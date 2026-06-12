// ecosystem.config.cjs
module.exports = {
    apps: [
        {
            name: "myHome",
            script: "./dist/server/index.cjs", // 你的入口文件
            env: {
                PROD_PORT: 6001,
                NODE_ENV: "production"
            },
            instances: 1, // 单实例或集群均可
            // 🔥 关键配置 1: 告诉 PM2 等待应用发出 'ready' 信号
            wait_ready: true,
            // 🔥 关键配置 2: 等待超时时间 (毫秒)
            listen_timeout: 10000,
            // 🔥 核心配置：每 3 天 (72小时) 重启一次
            // 语法解释：在每月的 1, 4, 7... 号的 凌晨 00:00 重启
            cron_restart: '0 0 1-31/3 * *',
            restart_delay: 2000,
            max_memory_restart: '1G',
            // 1. 开启自动重启 (默认就是 true，但写上更保险)
            autorestart: true,

            // 2. 最小运行时间 (关键！)
            // 如果进程启动后运行时间少于 5 秒就挂了，PM2 会认为启动失败
            min_uptime: '5s',

            // 3. 最大重启次数 (防止死循环)
            // 如果 1 分钟内连续挂了 10 次，PM2 就会放弃重启，让进程保持 "errored" 状态，以免把 CPU 跑满
            max_restarts: 10,

            // 日志配置
            out_file: './logs/out.log',      // 标准输出日志（console.log）
            error_file: './logs/error.log',  // 错误输出日志（console.error）

            // 可选配置
            log_date_format: 'YYYY-MM-DD HH:mm:ss',  // 日志时间格式
        }
    ]
};