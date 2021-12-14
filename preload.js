const customTitlebar = require('custom-electron-titlebar')
const {contextBridge} = require("electron")
const fs = require('fs')

window.addEventListener('DOMContentLoaded', () => {
    new customTitlebar.Titlebar({
        backgroundColor: customTitlebar.Color.fromHex('#222639'),
        titleHorizontalAlignment: "left",
        menu: null,
        icon: null,
    })
})

contextBridge.exposeInMainWorld(
    "pdfs", {
        readCharacterSheet: () => {
            return fs.readFileSync('pdfs/character.pdf')
        },
        readDetailsSheet: () => {
            return fs.readFileSync('pdfs/details.pdf')
        },
        readSpellcastingSheet: () => {
            return fs.readFileSync('pdfs/spellcasting.pdf')
        }
    }
)