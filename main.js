/*
 * @Author: lkw199711 lkw199711@163.com
 * @Date: 2024-04-21 18:08:13
 * @LastEditors: 梁楷文 lkw199711@163.com
 * @LastEditTime: 2024-05-29 20:58:32
 * @FilePath: \electron-demo\main.js
 * @Description: 这是主文件 electron 主进程
 */
const { app, BrowserWindow, ipcMain } = require("electron/main");
const path = require("node:path");
const express = require("express");
const { ChildProcess, fork, spawn } = require("child_process");

const fs = require("fs");
// import { join, resolve } from "path";
let mainWindow;
let nestProcess;
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

	// const filePath = `file://${join(
	// 	__dirname,
	// 	"smanga",
	// 	"dist",
	// 	"baota",
	// 	"index.html"
	// )}`;

	// win.webContents.openDevTools();

	// fs.writeFileSync("./a.txt", "Hello Node.js");
	// win.loadFile("./smanga/dist/baota/index.html");

	// 加载 Nest.js 服务
	// nestProcess = fork(path.resolve(__dirname, "nest-demo", "dist", "main.js"), [
	// 	"--subprocess",
	// ]);
	// nestProcess = spawn("node", [
	// 	path.resolve(__dirname, "smanga", "dist", "baota", "main.js"),
	// 	// path.resolve(__dirname, "nest-demo", "dist", "main.js"),
	// ]);
	initServerProcess();

	// 创建 Express 应用程序
	const appEx = express();

	// 设置静态文件目录
	appEx.use(express.static(path.join(__dirname, "smanga")));

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

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		server.close();
		// nestProcess.kill();
		quitServerProcess();
		app.quit();
	}
});


const { utilityProcess } = require("electron");

// const serverPath = path.join(__dirname, "nest.js");
const serverPath = path.join(__dirname, 'nest-dist', "main.js");
let serverProcess = null;

function initServerProcess() {
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

function quitServerProcess() {
	serverProcess?.kill();
}
