/*
 * @Author: lkw199711 lkw199711@163.com
 * @Date: 2024-04-21 18:08:13
 * @LastEditors: lkw199711 lkw199711@163.com
 * @LastEditTime: 2024-11-02 20:02:07
 * @FilePath: \electron-demo\main.js
 * @Description: 这是主文件 electron 主进程
 */
const { app, BrowserWindow, ipcMain } = require("electron/main");
const path = require("node:path");
const express = require("express");
const { createProxyMiddleware } = require('http-proxy-middleware');
const { ChildProcess, fork, spawn, execSync } = require("child_process");
const { utilityProcess } = require("electron");
const serverPath = path.join(__dirname, "smanga-adonis-build", "bin", "server.js");
let serverProcess = null;

const fs = require("fs");
// import { join, resolve } from "path";
let mainWindow;
let nestProcess, redisProcess;
let server;
const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true, // 如果需要 Node.js 环境
			contextIsolation: true, // 如果需要访问全局变量
			enableRemoteModule: true, // 如果需要使用 remote 模块
			webSecurity: false, // 允许加载外部资源，可能会存在安全风险
		},
	});

	initServerProcess();

	// 创建 Express 应用程序
	const appEx = express();

	// 反代后端项目
	appEx.use("/api", createProxyMiddleware({
		target: 'http://localhost:9798', // 后端服务地址
		changeOrigin: true,
	}));

	// 设置静态文件目录
	appEx.use(express.static(path.join(__dirname, "smanga-webui-build")));

	// 启动 Express 服务并监听端口
	server = appEx.listen(9797, () => {
		console.log("Server is running on port 9797");
	});

	// 在 Electron 窗口中加载 Express 服务提供的页面
	mainWindow.loadURL("http://localhost:9797/index.html");

	// 关闭窗口时关闭 Express 服务
	mainWindow.on("closed", () => {
		mainWindow = null;
	});
};

app.whenReady().then(() => {
	ipcMain.handle("ping", () => "pong");
	createWindow();

	const redisPath = 'redis/redis-server.exe';
	redisProcess = spawn(redisPath, ['--port', '6379']);
	redisProcess.stdout.on('data', (data) => console.log(`Redis输出: ${data}`));
	redisProcess.stderr.on('data', (data) => console.error(`Redis错误: ${data}`));

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (redisProcess) redisProcess.kill();
	if (process.platform !== "darwin") {
		server.close();
		// nestProcess.kill();
		quitServerProcess();
		app.quit();
	}
});

function initServerProcess() {
	// 切换数据库
	// ckeck_database();

	serverProcess = utilityProcess.fork(serverPath, [], {
		stdio: "pipe",
	});

	serverProcess.on?.("spawn", () => {
		serverProcess.stdout?.on("data", (data) => {
			console.log(`serverProcess output: ${data}`);
			write_log(data)
		});
		serverProcess.stderr?.on("data", (data) => {
			console.error(`serverProcess err: ${data}`);
			write_log(data, 'error')
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

function quitServerProcess() {
	serverProcess?.kill();
}


function write_log(logMessage, type = 'log') {
	// 拼接日志文件路径
	const logFile = path.join(__dirname, 'data', 'logs', 'smanga.log.txt')
	const errFile = path.join(__dirname, 'data', 'logs', 'smanga.err.txt')

	// 将日志内容同步写入文件，使用 '\n' 换行符
	try {
		if (type === 'log') {
			fs.appendFileSync(logFile, logMessage + '\n')
		} else {
			fs.appendFileSync(errFile, logMessage + '\n')
		}
	} catch (err) {
	}
}
