const { CustomTitlebar, TitlebarColor } = require('custom-electron-titlebar')
const { contextBridge, ipcRenderer } = require("electron")
const cheerio = require('cheerio')
const path = require('path')
const { loadSheets, storeSheets, loadModules } = require("./characterManager.js")

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
                    .then(res => res.text())
                    .then((html) => {
                        const $ = cheerio.load(html)
                        const content = $('#page-content').html()
                        resolve(content)
                        return;
                    }).catch((error) => {
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
    "pdfs", {
        readCharacterSheet: () => {
            const filename = path.resolve(__dirname, 'pdfs', 'character.pdf')
            return fs.readFileSync(filename)
        },
        readDetailsSheet: () => {
            const filename = path.resolve(__dirname, 'pdfs', 'details.pdf')
            return fs.readFileSync(filename)
        },
        readSpellcastingSheet: () => {
            const filename = path.resolve(__dirname, 'pdfs', 'spellcasting.pdf')
            return fs.readFileSync(filename)
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