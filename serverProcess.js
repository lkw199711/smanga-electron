/*
 * @Author: lkw199711 lkw199711@163.com
 * @Date: 2024-04-23 23:32:04
 * @LastEditors: lkw199711 lkw199711@163.com
 * @LastEditTime: 2024-04-23 23:50:34
 * @FilePath: \electron-demo\serverProcess.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// import { utilityProcess } from 'electron';
const { utilityProcess } = require("electron");

const serverPath = path.join(__dirname, "nest.js");
let serverProcess = null;

export function initServerProcess() {
  serverProcess =
    utilityProcess.fork(serverPath, [], {
      stdio: 'pipe',
    });

  serverProcess.on?.('spawn', () => {
    serverProcess.stdout?.on('data', (data) => {
      console.log(`serverProcess output: ${data}`);
    });
    serverProcess.stderr?.on('data', (data) => {
      console.error(`serverProcess err: ${data}`);
    });
  });
}

export function quitServerProcess() {
  url || serverProcess?.kill();
}