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
    console.log(`  ${colors.cyan}║     fnpack初始化       ║${colors.reset}`);
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
        // 目录不存在就报错
        if (!fs.existsSync(projectDir)) {
            error(`项目目录 "${projectName}" 不存在.`);
            proocess.exit(1)
        }
    }

    const run_fnpackCreate = async () => {
        log(`正在初始化项目...`);
        fs.copyFileSync("./fnpack.exe", path.join(projectDir, "fnpack.exe"))
        success("克隆 fnpack.exe 成功")
        run(`fnpack.exe create fnnas.${projectName}`, { cwd: projectDir })
        success("fnpack创建 `fnnas.${projectName}` 成功")
    }


    const runList = [run_projectName, run_projectDist, run_projectDir, run_fnpackCreate, run_fnpackCreate]

    for (let i = 0; i < runList.length; i++) {
        const c = await runList[i]() || 0
        i += c
    }


    process.exit(0);
}

main().catch((err) => {
    error(err.message);
    process.exit(1);
});
