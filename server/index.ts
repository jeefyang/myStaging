import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import { createServer } from 'vite';
import http from 'http';
import path from 'path';
import helmet from 'helmet';
import router from './routes/api';



const isDev = process.env.NODE_ENV === 'development';


const app: Express = express();
console.log('当前是否为开发模式', isDev);

// 正是环境
if (!isDev) {
    // ⚠️ 关键设置：如果你的 Node 服务在生产环境中是用 Nginx 反向代理的，必须加这一句！
    // 这样 Express 才能通过 req.headers['x-forwarded-proto'] 知道真实用户用的是不是 HTTPS
    app.set('trust proxy', 1);

    app.use((req, res, next) => {
        // 判断当前请求是否是 HTTPS 
        // req.secure 适用于直接用 Node 启 HTTPS； x-forwarded-proto 适用于 Nginx 代理 HTTPS
        const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

        if (isHttps) {
            // 🔒 线上 HTTPS 环境：直接使用默认的最严安全策略
            helmet()(req, res, next);
        } else {
            // 🔓 局域网 HTTP 环境：放宽限制，干掉升级 HTTPS 的强硬指令
            helmet({
                hsts: false,
                contentSecurityPolicy: {
                    directives: {
                        "default-src": ["'self'"],
                        "script-src": ["'self'", "'unsafe-inline'"],
                        "style-src": ["'self'", "'unsafe-inline'"],
                        "img-src": ["'self'", "data:"],
                        "upgrade-insecure-requests": null, // 核心修复
                    },
                },
            })(req, res, next);
        }
    });
}


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/api', router);


app.get('/health', (_req, res) => {
    res.json({ status: 'OK' });
});


if (isDev) {
    (async () => {
        try {
            // ✅ 1. 创建原生 HTTP 服务器（必须！）
            const httpServer = http.createServer(app);

            // ✅ 2. 启动 Vite，传入 httpServer（Vite 5+ 标准方式）
            const vite = await createServer({
                server: {
                    middlewareMode: true,
                    // 在 Vite 7/8 中，也可以显式指定 hmr.server
                    hmr: {
                        server: httpServer
                    }
                },
                configFile: path.resolve('./vite.config.ts'),
                root: path.resolve('./')
            });

            // ✅ 3. 挂载中间件
            app.use(vite.middlewares);

            // ✅ 4. 监听端口
            const PORT = Number(import.meta.env.VITE_DEV_PORT || '5173');
            httpServer.listen(PORT, () => {
                console.log(`🚀 Dev server running on http://localhost:${PORT}`);
            });

        } catch (error) {
            console.error('❌ Server startup failed:', error);
            process.exit(1);
        }
    })();
}
else {
    const clientPath = path.resolve("./dist/client");
    // 默认index.html
    app.get('/', (req, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
    });
    // 其他路径
    app.get("/{*splat}", (req, res) => {
        const splat: string[] = (<any>req.params).splat;
        // 随机组件就添加缓存控制
        if (splat.length > 0 && splat[splat.length - 1].includes('-')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
        res.sendFile(path.join(clientPath, splat.join('/')), (e) => {
            // 如果找不到文件,则返回 index.html
            e && res.sendFile(path.join(clientPath, 'index.html'));
        });
    });
    // 这里的 process.env.SERVER_PORT 正好能接住你之前在 PM2 ecosystem 配置里写的 PORT: 4000
    const port = import.meta.env.VITE_PROD_PORT || 3000;

    app.listen(port, () => {
        console.log(`🚀 后端服务已启动，生产环境监听端口: ${port}`);
    });

}



export { app as viteNodeApp };