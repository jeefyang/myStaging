import path from 'path';
import fs from "fs"

const configFile = path.join(process.cwd(), './myTest/vite.config.ts')
let content = fs.readFileSync(configFile, 'utf-8');

// 要添加的 build 配置
const buildConfig = `  build: {
    outDir: "dist/client",
  },`;

// 情况判断
if (content.includes('build:')) {
    // 有 build 配置，替换整个 build 块
    if (content.includes('outDir')) {
        // 替换 outDir
        content = content.replace(
            /outDir:\s*['"][^'"]*['"]/,
            `outDir: "dist/client"`
        );
    } else {
        // 在 build 块中添加 outDir
        content = content.replace(
            /(build:\s*\{)/,
            `$1\n    outDir: "dist/client",`
        );
    }
} else {
    // 在 defineConfig 的 { 后面直接添加
    content = content.replace(
        /(export default defineConfig\(\{)/,
        `$1\n${buildConfig}`
    );
}
console.log(content)