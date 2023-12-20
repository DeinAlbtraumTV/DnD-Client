const { app, BrowserWindow } = require('electron');
const { setupTitlebar, attachTitlebarToWindow } = require('custom-electron-titlebar/main');
const DiscordRPC = require('discord-rpc');
const path = require('path');
const remoteMain = require('@electron/remote/main');

remoteMain.initialize()
setupTitlebar();

function createWindow() {
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
	backgroundColor: "#000000"
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

app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy')

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
})

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