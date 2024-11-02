/*
 * @Author: lkw199711 lkw199711@163.com
 * @Date: 2024-10-27 20:33:16
 * @LastEditors: lkw199711 lkw199711@163.com
 * @LastEditTime: 2024-10-27 22:36:04
 * @FilePath: \smanga-electron\backend.js
 */
const path = require("node:path");
const { execSync } = require('child_process')

const { utilityProcess } = require("electron");
const serverPath = path.join(__dirname, "smanga-adonis-build", "bin", "server.js");
let serverProcess = null;

function initServerProcess() {
    // 切换数据库
    ckeck_database();

    serverProcess = utilityProcess.fork(serverPath, [], {
        stdio: "pipe",
    });

    serverProcess.on?.("spawn", () => {
        serverProcess.stdout?.on("data", (data) => {
            console.log(`serverProcess output: ${data}`);
        });
        serverProcess.stderr?.on("data", (data) => {
            console.error(`serverProcess err: ${data}`);
        });
    });
}

function ckeck_database() {
    // 获取当前运行路径作为根目录
    const rootDir = process.cwd()
    // 检查并创建配置文件
    const configFile = './data/config/smanga.json';
    const rawData = fs.readFileSync(configFile, 'utf-8')
    const config = JSON.parse(rawData)
    const { client, deploy, host, port, username, password, database } = config.sql
    
    // 拼接数据库连接字符串和变量名
    let dbUrl, varName, schemaPath;
    
    // 检查并创建数据库文件
    if (client === 'sqlite') {
        dbUrl = 'file:./data/db.sqlite';
        varName = 'DB_URL_SQLITE';
        schemaPath = path.join(rootDir, 'prisma', 'sqlite', 'schema.prisma')   
    } else if (client === 'mysql') {
        dbUrl = `mysql://${username}:${password}@${host}:${port}/${database}`;
        varName = 'DB_URL_MYSQL';
        schemaPath = path.join(rootDir, 'prisma', 'mysql', 'schema.prisma')
    } else if (client === 'postgresql' || client === 'pgsql') {
        dbUrl = `postgresql://${username}:${password}@${host}:${port}/${database}`;
        varName = 'DB_URL_POSTGRESQL';
        const schemaPath = path.join(rootDir, 'prisma', 'pgsql', 'schema.prisma')
    } else {
        // 报错 数据库不支持
        console.error(`Unsupported database client: ${client}`);
        process.exit(1);
    }

    runNpxCommand('npx prisma generate --schema=' + schemaPath)
    runNpxCommand('npx prisma migrate deploy --schema=' + schemaPath)

    const ENV_FILE = path.join(rootDir, '.env');

    // 更新 .env 文件中的对应变量
    let envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const regex = new RegExp(`^${varName}=.*`, 'm');

    if (regex.test(envContent)) {
        // 如果存在，则替换
        envContent = envContent.replace(regex, `${varName}=${dbUrl}`);
    } else {
        // 如果不存在，则添加
        envContent += `\n${varName}=${dbUrl}`;
    }

    // 写回 .env 文件
    fs.writeFileSync(ENV_FILE, envContent, 'utf8');
}

function runNpxCommand(command) {
    try {
        // 执行 npx 命令，并捕获输出
        execSync(command, { stdio: 'inherit' })
        console.log('命令执行成功')
        return true
    } catch (error) {
        console.error('命令执行失败:', error.message)
        return false
    }
}