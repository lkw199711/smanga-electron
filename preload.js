/*
 * @Author: lkw199711 lkw199711@163.com
 * @Date: 2024-04-21 22:00:02
 * @LastEditors: lkw199711 lkw199711@163.com
 * @LastEditTime: 2024-04-21 22:10:02
 * @FilePath: \electron-demo\preload.js
 * @Description: 预加载脚本
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("versions", {
	node: () => process.versions.node,
	chrome: () => process.versions.chrome,
	electron: () => process.versions.electron,
	ping: () => ipcRenderer.invoke("ping"),
	// 除函数之外，我们也可以暴露变量
});
