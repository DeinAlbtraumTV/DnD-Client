const { app, BrowserWindow } = require('electron')
const DiscordRPC = require('discord-rpc');
const path = require('path');

if (handleSquirrelEvent()) {
    // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}
  
function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }
  
  const ChildProcess = require('child_process');
  
  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);
  
  const spawn = function(command, args) {
    let spawnedProcess, error;
  
    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}
  
    return spawnedProcess;
  };
  
  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };
  
  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
        // Optionally do things such as:
        // - Add your .exe to the PATH
        // - Write to the registry for things like file associations and
        //   explorer context menus
  
        // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);
  
      setTimeout(app.quit, 1000);
      return true;
  
    case '--squirrel-uninstall':
        // Undo anything you did in the --squirrel-install and
        // --squirrel-updated handlers
  
        // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);
  
      setTimeout(app.quit, 1000);
      return true;
  
    case '--squirrel-obsolete':
        // This is called on the outgoing version of your app before
        // we update to the new version - it's the opposite of
        // --squirrel-updated
  
      app.quit();
      return true;
  }
};

function createWindow () {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      frame: false,
      webPreferences: {
          webviewTag: true,
          preload: path.join(__dirname, 'preload.js'),
          enableRemoteModule: true,
          contextIsolation: true,
      },
      show: false,
    });
  
    win.loadFile('index.html');

    win.maximize();
    win.show();
}

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