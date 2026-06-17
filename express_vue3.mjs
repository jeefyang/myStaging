#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';


// ── Colored output ──────────────────────────────────────────────
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

function log(msg) {
    console.log(`${colors.cyan}▶${colors.reset} ${msg}`);
}
function success(msg) {
    console.log(`${colors.green}✔${colors.reset} ${msg}`);
}
function warn(msg) {
    console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}
function error(msg) {
    console.log(`${colors.red}✘${colors.reset} ${msg}`);
}

// ── Helpers ─────────────────────────────────────────────────────
function run(cmd, opts = {}) {
    execSync(cmd, { stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
}

function capture(cmd) {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
}

function ask(question, answer = "") {
    return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`${colors.yellow}?${colors.reset} ${question} ${answer.trim() ? `(默认值:${answer.trim()})` : ''}`, (newAnswer) => {
            resolve(newAnswer.trim() || answer.trim());
        });
    });
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

/** Query npm registry for the latest version of a package */
function getLatestVersion(pkg) {
    try {
        return capture(`pnpm view ${pkg} version`);
    } catch {
        warn(`Could not query version for "${pkg}". Using "latest" as placeholder.`);
        return 'latest';
    }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
    console.log(`\n  ${colors.cyan}╔══════════════════════════════════════╗${colors.reset}`);
    console.log(`  ${colors.cyan}║     create-vex — Vue + Express       ║${colors.reset}`);
    console.log(`  ${colors.cyan}╚══════════════════════════════════════╝${colors.reset}\n`);

    /** 项目名称 */
    let projectName = process.argv[2];
    /** 项目地址 */
    let projectDist = process.argv[3] || "./"
    /** 项目目录 */
    let projectDir = "";

    const run_projectName = async () => {
        projectName = (await ask('项目名称:', projectName)) || projectName;
        if (!projectName) {
            error('项目名称不能为空');
            return -1
        }
    }

    const run_projectDist = async () => {
        projectDist = (await ask('项目地址:', projectDist)) || projectDist;
        if (!projectDist) {
            error('项目地址不能为空');
            return -1
        }
    }

    const run_projectDir = async () => {

        projectDir = path.join(projectDist, projectName);
        console.log(projectDir);
        if (!projectDir) {
            error('项目目录不能为空');
            process.exit(1);
        }
        // 目录存在就不创建了vue了
        if (fs.existsSync(projectDir)) {
            warn(`项目目录 "${projectName}" 已经存在.`);
            return 1
        }
    }

    const run_vueBuild = async () => {
        log(`开始创建vue项目:${projectName}`)
        try {
            run(`pnpm create vue@latest "${projectName}"`, { cwd: path.join(projectDist) });
        } catch (e) {
            error('vue创建失败');
            error(e)
            process.exit(1);
        }
        success(`vue项目 ${projectName} 创建成功`);
    }

    const run_package = async () => {
        log('读取package.json')
        const pkgPath = path.join(projectDir, 'package.json');
        const pkg = readJson(pkgPath);
        log('nodejs 插件版本补充中...');
        log(`添加dependencies依赖中...`);
        if (!pkg.dependencies) {
            pkg.dependencies = {}
        }
        const add_dependencies = ['@tsconfig/node24', 'express', 'node', "vite", "cors"]
        for (let i = 0; i < add_dependencies.length; i++) {
            const key = add_dependencies[i];
            // 存在就跳过
            if (pkg.dependencies[key]) {
                continue
            }
            try {
                const ver = getLatestVersion(key);
                if (!ver.trim()) {
                    warn(`${key} 获取最新版本失败`)
                    continue
                }

                pkg.dependencies[key] = `^${ver}`
            } catch (e) {
                warn(`${key} 获取最新版本失败`)
                continue
            }


        }
        log(`添加devDependencies依赖中...`);
        if (!pkg.devDependencies) {
            pkg.devDependencies = {}
        }
        const add_devDependencies = ['@types/cors', '@types/express', '@types/node', "@types/cors"]
        for (let i = 0; i < add_devDependencies.length; i++) {
            const key = add_devDependencies[i];
            // 存在就跳过
            if (pkg.devDependencies[key]) {
                continue
            }
            try {
                const ver = getLatestVersion(key);
                if (!ver.trim()) {
                    warn(`${key} 获取最新版本失败`)
                    continue
                }
                pkg.devDependencies[key] = `^${ver}`
            } catch (e) {
                warn(`${key} 获取最新版本失败`)
                continue
            }
        }
        success(`package.json 添加依赖成功`);

        log(`package.json 添加scripts中...`)
        const scripts = {
            "dev": "vite --config vite.config.server.ts",
            "build": "run-p \"build-only {@}\" --",
            "preview": "vite preview",
            "build-only": "vite build --config vite.config.server.ts && vite build --config vite.config.ts",
            "type-check": "vue-tsc --build",
            "format": "prettier --write --experimental-cli src/",
            "update": "git pull&&pnpm install&&npm run build && pm2 reload ecosystem.config.cjs",
            "start": "pm2 start ecosystem.config.cjs",
            "reload": "pm2 reload ecosystem.config.cjs --update-env",
            "stop": "pm2 stop ecosystem.config.cjs",
            "restart": "pm2 restart ecosystem.config.cjs",
            "delete": "pm2 delete ecosystem.config.cjs",
            "logs": "pm2 logs ecosystem.config.cjs"
        }
        for (const key in scripts) {
            log(`${key}: ${scripts[key]}`)
        }
        pkg.scripts = {
            ...scripts,
        }
        success(`package.json 添加scripts完成`)
        writeJson(pkgPath, pkg);
        success(`package.json 保存成功`);

    }

    const run_tsconfig = async () => {
        log(`tsconfig.json 添加依赖中...`)
        const tsconfigPath = path.join(projectDir, 'tsconfig.json');
        const tsconfig = readJson(tsconfigPath);
        if (!tsconfig.references) {
            error('tsconfig.json references 配置错误')
            process.exit(1);
        }
        // 要放在前面，不然不生效
        const optionFile = "./tsconfig.option.json"
        if (tsconfig.references.findIndex(item => item.path === optionFile) == -1) {
            tsconfig.references.splice(0, 0, { path: optionFile })
        }
        // 可以放在后面
        const serverFile = "./tsconfig.server.json"
        if (tsconfig.references.findIndex(item => item.path === serverFile) == -1) {
            tsconfig.references.push({ path: serverFile })
        }
        writeJson(tsconfigPath, tsconfig);
        success(`tsconfig.json 添加依赖成功`);
    }

    const replaceViteBuildOutDir = (originStr, outDir) => {
        let content = originStr;
        // 要添加的 build 配置
        const buildConfig = `  build: {
    outDir: "${outDir}",
  },`;

        // 情况判断
        if (content.includes('build:')) {
            // 有 build 配置，替换整个 build 块
            if (content.includes('outDir')) {
                // 替换 outDir
                content = content.replace(
                    /outDir:\s*['"][^'"]*['"]/,
                    `outDir: "${outDir}"`
                );
            } else {
                // 在 build 块中添加 outDir
                content = content.replace(
                    /(build:\s*\{)/,
                    `$1\n    outDir: "${outDir}",`
                );
            }
        } else {
            // 在 defineConfig 的 { 后面直接添加
            content = content.replace(
                /(export default defineConfig\(\{)/,
                `$1\n${buildConfig}`
            );
        }
        return content;
    }

    const run_replaceVite = async () => {
        log(`调整vite.config.ts`)
        const viteStr = fs.readFileSync(path.join(projectDir, 'vite.config.ts'), 'utf-8')
        const viteStrNew = replaceViteBuildOutDir(viteStr, 'dist/client')
        fs.writeFileSync(path.join(projectDir, 'vite.config.ts'), viteStrNew, "utf-8")
        success(`vite.config.ts 保存成功`)
    }

    const run_addGitignore = async () => {
        log(`添加.gitignore`)
        const gitignorePath = path.join(projectDir, '.gitignore');
        let gitignore = fs.readFileSync(gitignorePath, 'utf-8');
        const list = [
            'ecosystem.config.cjs',
            'components.d.ts',
            "auto-imports.d.ts",
            "logs",
            "*.pid",
            ".reasonix/*.json"
        ]
        list.forEach(item => {
            if (gitignore.includes(item)) {
                return
            }
            gitignore += `\n${item}`
            log(`.gitignore 添加 ${item}`)
        })
        fs.writeFileSync(gitignorePath, gitignore)
        success(`.gitignore 添加成功`)
    }

    const loopCopyFile = (src, overwrite = false) => {
        const destSrc = path.join(projectDir, src)
        const stats = fs.statSync(src)
        if (stats.isDirectory()) {
            if (!fs.existsSync(path.join(projectDir, src))) {
                fs.mkdirSync(destSrc, { recursive: true })
            }
            const files = fs.readdirSync(src)
            for (let i = 0; i < files.length; i++) {
                loopCopyFile(path.join(src, files[i]), overwrite)
            }
            log(`${src} 文件夹拷贝成功`)
            return
        }
        if (!overwrite && fs.existsSync(destSrc)) {
            log(`${src} 文件已存在`)
            return
        }

        fs.copyFileSync(src, destSrc)
        success(`${src} 文件拷贝成功`)
    }

    const run_copyFiles = async () => {
        log(`克隆对应文件`)
        const list = ['common', 'server', 'types',".env", 'ecosystem.config.example.cjs', 'tsconfig.server.json', 'tsconfig.option.json', 'vite.config.server.ts']
        for (let i = 0; i < list.length; i++) {
            loopCopyFile(list[i])
        }
        const overwriteList = ["env.d.ts"]
        for (let i = 0; i < overwriteList.length; i++) {
            loopCopyFile(overwriteList[i], true)
        }
    }



    const runList = [run_projectName, run_projectDist, run_projectDir, run_vueBuild, run_package, run_tsconfig, run_replaceVite, run_addGitignore, run_copyFiles]

    for (let i = 0; i < runList.length; i++) {
        const c = await runList[i]() || 0
        i += c
    }

    log(`项目初始化完成`)
    log(`cd ${projectDist}${projectName}`)
    log(`pnpm install`)
    log(`or`)
    log(`pnpm install --ignore-workspace`)
    process.exit(0);
}

main().catch((err) => {
    error(err.message);
    process.exit(1);
});
