/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, ipcMain, session } = require('electron')
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main')
const { Client } = require('discord-rpc')
const { join, dirname } = require('path')
const { initialize, enable } = require('@electron/remote/main')
const { autoUpdater } = require('electron-updater')
const { ElectronBlocker } = require('@ghostery/adblocker-electron')
const fetch = require('cross-fetch')

const DISABLE_AUTOMATIC_UPDATES = false

const isDev = process.env.NODE_ENV === 'development' || process.defaultApp

initialize()
setupTitlebar()

let updaterWindow = null;
let adBlocker = null;

function createUpdaterWindow() {
	const win = new BrowserWindow({
		width: 400,
		height: 500,
		titleBarStyle: 'hidden',
		show: false,
		backgroundColor: "#141414",
		webPreferences: {
			preload: join(__dirname, "updater_preload.js")
		},
		resizable: isDev
	})

	win.setMenuBarVisibility(false)

	win.loadFile(join(__dirname, "updater.html"))

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
			preload: join(__dirname, 'preload.js'),
			enableRemoteModule: true,
			contextIsolation: true,
			nodeIntegration: true
		},
		show: false,
		backgroundColor: "#141414"
	});
	enable(win.webContents)

	win.setMenuBarVisibility(false)

	if (isDev) {
		win.loadURL("http://localhost:5173")
	} else {
		win.loadFile(join(__dirname, "../public/index.html"))
	}

	win.maximize()

	win.once('ready-to-show', () => {
		win.show()
	})

	win.webContents.on('did-attach-webview', (e, contents) => {
		e.preventDefault()
		contents.setWindowOpenHandler(({url}) => {
			win.webContents.send("open-page-in-new-tab", url)
			return { action: 'deny' }
		})
	})
	
	win.webContents.setWindowOpenHandler(({url}) => {
		win.webContents.send("open-page-in-new-tab", url)
		return { action: 'deny' }
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

ipcMain.on("get-exeroot-path", event => {
	event.returnValue = dirname(app.getPath("exe"))
})

ipcMain.on("get-userdata-path", event => {
	event.returnValue = app.getPath("userData")
})

ipcMain.on("is-dev", event => {
	event.returnValue = isDev
})

ipcMain.on("start-adblock", (event) => {
	if (adBlocker) {
		adBlocker.enableBlockingInSession(session.defaultSession);
		console.log("Adblock active")
		event.returnValue = "success"
	} else {
		event.returnValue = "failure"
	}
})

ipcMain.on("stop-adblock", (event) => {
	if (adBlocker) {
		adBlocker.disableBlockingInSession(session.defaultSession);
		console.log("Adblock inactive")
		event.returnValue = "success"
	} else {
		event.returnValue = "failure"
	}
})

//UPDATER RELATED EVENTS
app.on('ready', () => {
	ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
		adBlocker = blocker;
	}).catch(() => console.log("Adblock Unavailable!"));

	if (!isDev) {
		if (DISABLE_AUTOMATIC_UPDATES || process.platform == 'darwin') {
			initMainApp()
		} else {
			updaterWindow = createUpdaterWindow()
			autoUpdater.checkForUpdates()
		}
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

autoUpdater.on("update-not-available", () => {
	initMainApp()
})

autoUpdater.on("download-progress", (info) => {
	updaterWindow.webContents.send("update-download-progress", info.percent)
})

autoUpdater.on("update-downloaded", () => {
	autoUpdater.quitAndInstall()
})

autoUpdater.on("error", () => {
	initMainApp()
})

//APP RELATED EVENTS
app.on('window-all-closed', function () {
  	if (process.platform !== 'darwin') app.quit();
})

//DISCORD RPC
const clientId = '858413101320503317';

const rpc = new Client({ transport: 'ipc' });
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