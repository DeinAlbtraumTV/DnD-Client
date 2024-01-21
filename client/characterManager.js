const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

let userdataPath = ipcRenderer.sendSync("get-userdata-path")
let moduleStoragePath = path.normalize(`${userdataPath}/sheet_modules`)
let characterStoragePath = path.normalize(`${userdataPath}/dnd_characters`)
let characterStorageFile = path.normalize(`${characterStoragePath}/characters.json`)

let sheetModulesLoaded = {}
let isDev = ipcRenderer.sendSync("is-dev")

const SAVE_VERSION = 2;

let modulesLoaded = false;

function _loadModule(dirName) {
    try {
        let module = {
            info: {},
            data: {},
            css: {},
            migration: {}
        }
        let moduleInfoFile = path.normalize(`${moduleStoragePath}/${dirName}/moduleInfo.json`)
        let sharedStyleFile = path.normalize(`${moduleStoragePath}/${dirName}/shared.css`)
        let characterSheetDataFile = path.normalize(`${moduleStoragePath}/${dirName}/characterSheet.json`)
        let characterSheetStyleFile = path.normalize(`${moduleStoragePath}/${dirName}/characterSheet.css`)
        let characterSheetMigrationFile = path.normalize(`${moduleStoragePath}/${dirName}/characterSheet.csv`)
        let detailSheetDataFile = path.normalize(`${moduleStoragePath}/${dirName}/detailSheet.json`)
        let detailSheetStyleFile = path.normalize(`${moduleStoragePath}/${dirName}/detailSheet.css`)
        let detailSheetMigrationFile = path.normalize(`${moduleStoragePath}/${dirName}/detailSheet.csv`)
        let spellcastingSheetDataFile = path.normalize(`${moduleStoragePath}/${dirName}/spellcastingSheet.json`)
        let spellcastingSheetStyleFile = path.normalize(`${moduleStoragePath}/${dirName}/spellcastingSheet.css`)
        let spellcastingSheetMigrationFile = path.normalize(`${moduleStoragePath}/${dirName}/spellcastingSheet.csv`)

        let moduleInfo = JSON.parse(fs.readFileSync(moduleInfoFile, "utf-8"))
        module.info.name = moduleInfo.name
        module.info.version = parseInt(moduleInfo.version)
        module.info.author = moduleInfo.author
        module.info.repo = moduleInfo.repo

        module.data.characterSheet = JSON.parse(fs.readFileSync(characterSheetDataFile, "utf-8"))
        module.data.detailSheet = JSON.parse(fs.readFileSync(detailSheetDataFile, "utf-8"))
        module.data.spellcastingSheet = JSON.parse(fs.readFileSync(spellcastingSheetDataFile, "utf-8"))

        module.css.characterSheet = fs.readFileSync(characterSheetStyleFile, "utf-8")
        module.css.detailSheet = fs.readFileSync(detailSheetStyleFile, "utf-8")
        module.css.spellcastingSheet = fs.readFileSync(spellcastingSheetStyleFile, "utf-8")
        module.css.shared = fs.readFileSync(sharedStyleFile, "utf-8")

        module.migration.characterSheet = characterSheetMigrationFile
        module.migration.detailSheet = detailSheetMigrationFile
        module.migration.spellcastingSheet = spellcastingSheetMigrationFile

        return module;
    } catch (e) {
        console.error(e)
        return null;
    }
}

module.exports = {
    loadModules() {
        if (!fs.existsSync(moduleStoragePath)) {
            fs.mkdirSync(moduleStoragePath)
        }

        //Copy builtin modules to module storage
        fs.cpSync((isDev ? "./client/data/modules/" : `${process.resourcesPath}/app.asar/client/data/modules/`), moduleStoragePath, {recursive:true})

        let modules = []
        let dirHandle = fs.readdirSync(moduleStoragePath, {withFileTypes:true})

        dirHandle.forEach(dirEntry => {
            if (dirEntry != null) {
                if (dirEntry.isDirectory()) {
                    modules.push(dirEntry.name)
                }
            }
        })

        modules.forEach(elem => {
            let module = _loadModule(elem)
            if (module == null) {
                console.log("Failed to load module:", elem, "! See console for details")
                return
            }
            sheetModulesLoaded[elem] = module
        });
    
        modulesLoaded = true

        return sheetModulesLoaded
    },
    loadModule: _loadModule,
    loadSheets() {
        if (!modulesLoaded) return false;

        if (!fs.existsSync(characterStoragePath)) {
            fs.mkdirSync(characterStoragePath)
        }

        //migrate old file to new storage location
        if (process.platform == "win32" && fs.existsSync(path.normalize(`${process.env.APPDATA}/dnd_characters/characters.json`))) {
            fs.renameSync(path.normalize(`${process.env.APPDATA}/dnd_characters/characters.json`), characterStorageFile)
        }

        if (!fs.existsSync(characterStorageFile)) {
            fs.writeFileSync(characterStorageFile, "{}", "utf-8")
        }

        let characterStorageFileContent = fs.readFileSync(characterStorageFile, "utf8");
        let data = JSON.parse(characterStorageFileContent ?? "{}")

        fs.writeFileSync(path.normalize(`${characterStoragePath}/characters_migration_backup.json`), characterStorageFileContent, "utf-8")

        data = migrateData(data)
        fs.writeFileSync(characterStorageFile, JSON.stringify(data), "utf-8")
    
        return data
    },

    storeSheets(sheets) {
        fs.writeFileSync(characterStorageFile, sheets, "utf-8")
    }
}

function migrateData(data) {
    //read csv file from the module the character is using
    //no module info means legacy character -> fallback to dnd_5e_builtin
    //replace all instances of the old keys with the new keys, version is the column name
    //return the new data
    //key in data is version or charname, version key is considered legacy and will not be used anymore
    let newData = {}

    for (let key in data) {
        if (key == "version") {
            continue
        }

        if (!data[key].module) {
            data[key].module = {
                id: "dnd_5e_builtin",
                version: 2
            }
        }

        let version = data[key].module.version
    
        if (version == -1) {
            continue
        }

        let module = sheetModulesLoaded[data[key].module.id]

        console.log("Starting character migration for:", key)

        if (!module) {
            console.log("Missing module", data[key].module.id, ", skipping migration for character:", key)
            newData[key] = data[key]
            continue
        }

        if (data[key].module.version >= module.info.version) {
            console.log("Character:", key, "is already on the latest version of module:", data[key].module.id)
            newData[key] = data[key]
            continue
        }
    
        if (!fs.existsSync(module.migration.characterSheet)) {
            console.log("No character save format file found, skipping migration for character:", key)
            newData[key] = data[key]
            continue
        }
    
        if (!fs.existsSync(module.migration.detailSheet)) {
            console.log("No detail save format file found, skipping migration for character:", key)
            newData[key] = data[key]
            continue
        }
    
        if (!fs.existsSync(module.migration.spellcastingSheet)) {
            console.log("No spellcasting save format file found, skipping migration for character:", key)
            newData[key] = data[key]
            continue
        }
    
        let sheetCsvLines = fs.readFileSync(sheetFormatPath, "utf8").replaceAll("\r", "").split("\n")
    
        let detailCsvLines = fs.readFileSync(detailFormatPath, "utf8").replaceAll("\r", "").split("\n")
    
        let spellcastingCsvLines = fs.readFileSync(spellFormatPath, "utf8").replaceAll("\r", "").split("\n")
    
        newData[key] = {
            module: data[key].module,
            sheet: {},
            details: {},
            spellcasting: {},
            sheetNotes: [],
            detailNotes: [],
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

        for (let sheetKey in data[key].sheet) {
            newData[key].sheet[sheetKey] = data[key].sheet[sheetKey]
        }

        for (let i = 1; i < detailCsvLines.length; i++) {
            let line = detailCsvLines[i].split(",")
            let oldKey = line[version - 1]
            let newKey = line[SAVE_VERSION - 1]

            if (data[key].details[oldKey] == undefined) continue

            newData[key].details[newKey] = data[key].details[oldKey]
            delete data[key].details[oldKey]
        }

        for (let detailKey in data[key].details) {
            newData[key].details[detailKey] = data[key].details[detailKey]
        }

        for (let i = 1; i < spellcastingCsvLines.length; i++) {
            let line = spellcastingCsvLines[i].split(",")
            let oldKey = line[version - 1]
            let newKey = line[SAVE_VERSION - 1]

            if (data[key].spellcasting[oldKey] == undefined) continue

            newData[key].spellcasting[newKey] = data[key].spellcasting[oldKey]
            delete data[key].spellcasting[oldKey]
        }

        for (let spellcastingKey in data[key].spellcasting) {
            newData[key].spellcasting[spellcastingKey] = data[key].spellcasting[spellcastingKey]
        }

        //Notes
        newData[key].sheetNotes = data[key].sheetNotes != undefined && Array.isArray(data[key].sheetNotes) ? data[key].sheetNotes : [];
        newData[key].detailNotes = data[key].detailNotes != undefined && Array.isArray(data[key].detailNotes) ? data[key].detailNotes : [];
        newData[key].spellcastingNotes = data[key].spellcastingNotes != undefined && Array.isArray(data[key].spellcastingNotes) ? data[key].spellcastingNotes : [];
    }

    return newData
}