/*
 * @Author: 梁楷文 lkw199711@163.com
 * @Date: 2024-05-16 15:46:42
 * @LastEditors: 梁楷文 lkw199711@163.com
 * @LastEditTime: 2024-05-28 20:48:33
 * @FilePath: \smanga-electron\forge.config.js
 */
const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
	packagerConfig: {
		asar: true,
		// extraResources: [
		// 	{
		// 		from: "nest-dist",
		// 		to: "nest-dist",
		// 		filter: ["**/*"],
		// 	},
		// 	{
		// 		from: "nest-dist/node_modules",
		// 		to: "nest-dist/node_modules",
		// 		filter: ["**/*"],
		// 	},
		// ],
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {},
		},
		// {
		// 	name: "@electron-forge/maker-zip",
		// 	platforms: ["darwin", "win32"],
		// },
		// {
		// 	name: "@electron-forge/maker-deb",
		// 	config: {},
		// },
		// {
		// 	name: "@electron-forge/maker-rpm",
		// 	config: {},
		// },
	],
	plugins: [
		{
			name: "@electron-forge/plugin-auto-unpack-natives",
			config: {},
		},
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
};
