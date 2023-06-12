const fs = require("fs")

const characterStoragePath = process.env.APPDATA + "\\dnd_characters"
const characterStorageFile = characterStoragePath + "\\characters.json"

const SAVE_VERSION = 2;

module.exports = {
    loadSheets() {
        if (!fs.existsSync(characterStoragePath)) {
            fs.mkdirSync(characterStoragePath)
        }

        if (!fs.existsSync(characterStorageFile)) {
            fs.writeFileSync(characterStorageFile, "{}", "utf-8")
        }
        let characterStorageFileContent = fs.readFileSync(characterStorageFile, "utf8");
        let data = JSON.parse(characterStorageFileContent ?? "{}")

        if (!data.version) data.version = 1

        if (data.version < SAVE_VERSION) {
            data = migrateData(data)
            data.version = SAVE_VERSION
            fs.writeFileSync(characterStorageFile, JSON.stringify(data), "utf-8")
        }

        return data
    },

    storeSheets(sheets) {
        fs.writeFileSync(characterStorageFile, sheets, "utf-8")
    }
}

function migrateData(data) {
    //read csv file from ./data/saveFormat.csv
    //replace all instances of the old keys with the new keys, version is the column name
    //return the new data

    if (!fs.existsSync("./client/data/sheetSaveFormat.csv")) {
        console.log("No sheet save format file found, skipping migration")
        return data
    }

    if (!fs.existsSync("./client/data/detailsSaveFormat.csv")) {
        console.log("No detail save format file found, skipping migration")
        return data
    }

    if (!fs.existsSync("./client/data/spellcastingSaveFormat.csv")) {
        console.log("No spellcasting save format file found, skipping migration")
        return data
    }

    let version = data.version

    if (version == -1) {
        return data
    }

    let newData = {}

    let sheetCsvLines = fs.readFileSync("./client/data/sheetSaveFormat.csv", "utf8").replaceAll("\r", "").split("\n")

    let detailCsvLines = fs.readFileSync("./client/data/detailsSaveFormat.csv", "utf8").replaceAll("\r", "").split("\n")

    let spellcastingCsvLines = fs.readFileSync("./client/data/spellcastingSaveFormat.csv", "utf8").replaceAll("\r", "").split("\n")

    for (let key in data) {
        if (key == "version") {
            newData[key] = data[key]
            continue
        }

        newData[key] = {
            sheet: {},
            details: {},
            spellcasting: {},
            sheetNotes: [],
            detailsNotes: [],
            spellcastingNotes: []
        }

        for (let i = 1; i < sheetCsvLines.length; i++) {
            let line = sheetCsvLines[i].split(",")
            let oldKey = line[version - 1]
            let newKey = line[SAVE_VERSION - 1]

            if (data[key].sheet[oldKey] == undefined) continue

            newData[key].sheet[newKey] = data[key].sheet[oldKey]
            delete data[key].sheet[oldKey]
        }

        for (let key in data[key].sheet) {
            newData[key].sheet[key] = data[key].sheet[key]
        }

        for (let i = 1; i < detailCsvLines.length; i++) {
            let line = detailCsvLines[i].split(",")
            let oldKey = line[version - 1]
            let newKey = line[SAVE_VERSION - 1]

            if (data[key].details[oldKey] == undefined) continue

            newData[key].details[newKey] = data[key].details[oldKey]
            delete data[key].details[oldKey]
        }

        for (let key in data[key].details) {
            newData[key].details[key] = data[key].details[key]
        }

        for (let i = 1; i < spellcastingCsvLines.length; i++) {
            let line = spellcastingCsvLines[i].split(",")
            let oldKey = line[version - 1]
            let newKey = line[SAVE_VERSION - 1]

            if (data[key].spellcasting[oldKey] == undefined) continue

            newData[key].spellcasting[newKey] = data[key].spellcasting[oldKey]
            delete data[key].spellcasting[oldKey]
        }

        for (let key in data[key].spellcasting) {
            newData[key].spellcasting[key] = data[key].spellcasting[key]
        }
    }

    return newData
}