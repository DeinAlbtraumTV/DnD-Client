const { CustomTitlebar, TitlebarColor } = require('custom-electron-titlebar')
const { contextBridge, ipcRenderer } = require("electron")
const cheerio = require('cheerio')
const path = require('path')
const { loadSheets, storeSheets, loadModules, getModuleStoragePath } = require("./characterManager.js")

if (process.platform == "darwin" 
    || process.platform == "win32") {
    window.addEventListener('DOMContentLoaded', () => {
        new CustomTitlebar({
            backgroundColor: TitlebarColor.fromHex('#0a0a0a'),
            titleHorizontalAlignment: "left"
        })
    })
}

contextBridge.exposeInMainWorld(
    "spells", {
        getSpellInfo: async (url) => {
            return new Promise(resolve => {
                fetch(url)
                    .catch(() => {
                        resolve("Failed to load that spell, please try again later.");
                    }).then(
                        res => res.text()
                    ).catch(() => {
                        resolve("Failed to load that spell, please try again later.");
                    }).then((html) => {
                        const $ = cheerio.load(html)
                        const content = $('#page-content').html()
                        resolve(content)
                        return;
                    }).catch(() => {
                        resolve("Failed to load that spell, please try again later.");
                    });
            })
        }
    }
)

contextBridge.exposeInMainWorld(
    "characters", {
        loadModules: loadModules,
        loadSheets: loadSheets,
        storeSheets: storeSheets
    }
)

contextBridge.exposeInMainWorld(
    "adblock", {
        enable: () => {
            ipcRenderer.sendSync("start-adblock")
        },
        disable: () => {
            ipcRenderer.sendSync("stop-adblock")
        }
    }
)

let mainWindowWillNavigateListener = () => {}

contextBridge.exposeInMainWorld(
    "ipcRendererListener", {
        register: {
            mainWindowWillNavigateListener: (func) => {
                mainWindowWillNavigateListener = func
            }
        }
    }
)

ipcRenderer.on("open-page-in-new-tab", (event, url) => {
    mainWindowWillNavigateListener(url)
})

contextBridge.exposeInMainWorld(
    "util", {
        openModuleFolder: () => {
            openExplorerIn(getModuleStoragePath(), () => {})
        }
    }
)

function openExplorerIn(path, callback) {
    var cmd = ``;
    switch (require(`os`).platform().toLowerCase().replace(/[0-9]/g, ``).replace(`darwin`, `macos`)) {
        case `win`:
            path = path || '=';
            cmd = `explorer`;
            break;
        case `linux`:
            path = path || '/';
            cmd = `xdg-open`;
            break;
        case `macos`:
            path = path || '/';
            cmd = `open`;
            break;
    }
    let p = require(`child_process`).spawn(cmd, [path]);
    p.on('error', (err) => {
        console.log(err.message)
        p.kill();
        return callback(err);
    });
}