const customTitlebar = require('custom-electron-titlebar')
const {contextBridge} = require("electron")
const rp = require('request-promise')
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

window.addEventListener('DOMContentLoaded', () => {
    new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#222639'),
        titleHorizontalAlignment: "left",
        menu: null,
        icon: null,
    })
})

contextBridge.exposeInMainWorld(
    "spells", {
        getSpellInfo: async (url) => {
            return new Promise(resolve => {
                rp(url).then((html) => {
                    const $ = cheerio.load(html)
                    const content = $('#page-content').html()
                    resolve(content)
                }).catch(function(err){
                    resolve("I can´t seem to find this spell. Please make sure to not include special characters")
                });
            })
        }
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