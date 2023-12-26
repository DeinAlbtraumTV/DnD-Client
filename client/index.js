const { app, BrowserWindow, ipcMain } = require('electron')
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main')
const DiscordRPC = require('discord-rpc')
const path = require('path')
const remoteMain = require('@electron/remote/main')
const { autoUpdater } = require('electron-updater')

remoteMain.initialize()
setupTitlebar()

let updaterWindow = null;

function createUpdaterWindow() {
	const win = new BrowserWindow({
		width: 400,
		height: 500,
		titleBarStyle: 'hidden',
		show: false,
		backgroundColor: "#141414",
		webPreferences: {
			preload: path.join(__dirname, "updater_preload.js")
		},
		resizable: !app.isPackaged
	})

	win.setMenuBarVisibility(false)

	win.loadFile(path.join(__dirname, "updater.html"))

	win.once('ready-to-show', () => {
		win.show()
	})

	return win
}

function createMainWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		titleBarStyle: 'hidden',
		webPreferences: {
			sandbox: false,
			webviewTag: true,
			preload: path.join(__dirname, 'preload.js'),
			enableRemoteModule: true,
			contextIsolation: true,
			nodeIntegration: true
		},
		show: false,
		backgroundColor: "#141414"
	});
	remoteMain.enable(win.webContents)

	win.setMenuBarVisibility(false)

	win.loadFile(path.join(__dirname, "../public/index.html"))

	win.maximize()

	win.once('ready-to-show', () => {
		win.show()
	})

	win.webContents.on('new-window', (e, windowURL, frameName, disposition, options) => {
		e.preventDefault()
	})

	win.webContents.on('did-attach-webview', (e, contents) => {
		contents.on('new-window', (e, windowURL, frameName, disposition, options) => {
			e.preventDefault()
		})
	})
	
	win.webContents.on('will-navigate', (e, url, isInPlace, isMainFrame, frameProcessId, frameRoutingId) => {
		e.preventDefault();
		win.webContents.send("open-page-in-new-tab", url)
	})

	attachTitlebarToWindow(win);
}

function initMainApp() {
	if (updaterWindow) {
		updaterWindow.close()
	}
	createMainWindow();

	app.on('activate', function () {
		if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
	})
}

app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy')

ipcMain.on("get-userdata-path", event => {
	event.returnValue = app.getPath("userData")
})

//UPDATER RELATED EVENTS
app.on('ready', () => {
	if (app.isPackaged) {
		updaterWindow = createUpdaterWindow()
		autoUpdater.checkForUpdates()
	} else {
		//Simulate update so we can see how the UI behaves
		updaterWindow = createUpdaterWindow()

		updaterWindow.on("ready-to-show", () => {
			updaterWindow.webContents.send("update-found", autoUpdater.currentVersion.version, "dev_build")

			let progress = 0
			let timer = setInterval(() => {
				if (progress >= 100) {
					clearInterval(timer)
					initMainApp()
					return
				}
				progress += 5
				updaterWindow.webContents.send("update-download-progress", progress, 1000000)
			}, 100)
		})
	}
})

autoUpdater.on("update-available", (info) => {
	updaterWindow.webContents.send("update-found", autoUpdater.currentVersion.version, info.version)
})

autoUpdater.on("update-not-available", (info) => {
	initMainApp()
})

autoUpdater.on("download-progress", (info) => {
	updaterWindow.webContents.send("update-download-progress", info.percent)
})

autoUpdater.on("update-downloaded", (event) => {
	autoUpdater.quitAndInstall()
})

//APP RELATED EVENTS
app.on('window-all-closed', function () {
  	if (process.platform !== 'darwin') app.quit();
})

//DISCORD RPC
const clientId = '858413101320503317';

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
const startTimestamp = new Date();

rpc.on('ready', () => {
	rpc.setActivity({
		details: `Playing Dungeons and Dragons`,
		state: 'in a Dungeon',
		startTimestamp,
		largeImageKey: 'dnd_logo_full',
		instance: false,
	});
});

rpc.login({ clientId }).catch(console.error);