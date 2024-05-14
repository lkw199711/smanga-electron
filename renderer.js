/*
 * @Author: lkw199711 lkw199711@163.com
 * @Date: 2024-04-21 22:02:46
 * @LastEditors: lkw199711 lkw199711@163.com
 * @LastEditTime: 2024-04-21 22:12:22
 * @FilePath: \electron-demo\renderer.js
 * @Description: 额外的渲染逻辑
 */
const information = document.getElementById("info");
information.innerText = `本应用正在使用 Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), 和 Electron (v${versions.electron()})`;

const func = async () => {
	const response = await window.versions.ping();
	console.log(response); // 打印 'pong'
};

func();