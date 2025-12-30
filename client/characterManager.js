const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

let exeRoot = ipcRenderer.sendSync("get-exeroot-path")
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

        let moduleInfo = JSON.parse(fs.readFileSync(moduleInfoFile, "utf-8"))
        module.info.name = moduleInfo.name
        module.info.version = parseInt(moduleInfo.version)
        module.info.author = moduleInfo.author
        module.info.repo = moduleInfo.repo
        module.info.sheets = moduleInfo.sheets
        module.info.migrations = moduleInfo.sheetMigration ?? {}

        for (let sheet of moduleInfo.sheets) {
            let basePath = path.normalize(`${moduleStoragePath}/${dirName}/${sheet}`)
            if (!fs.existsSync(basePath + ".json")) {
                console.error(`Missing data file for module ${moduleInfo.name}. This sheet (${sheet}) will not work as expected!`)
                continue
            }
            if (!fs.existsSync(basePath + ".css")) {
                console.error(`Missing style file for module ${moduleInfo.name}. This sheet (${sheet}) will not work as expected!`)
                continue
            }
            if (!fs.existsSync(basePath + ".csv")) {
                console.warn(`Missing migration file for module ${moduleInfo.name}. This sheet (${sheet}) might not work as expected if its version changes!`)
                continue
            }

            module.data[sheet] = JSON.parse(fs.readFileSync(basePath + ".json", "utf-8"))
            module.css[sheet] = fs.readFileSync(basePath + ".css", "utf-8")
            module.migration[sheet] = basePath + ".csv"
        }

        module.css.shared = fs.readFileSync(sharedStyleFile, "utf-8")

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

        fs.cpSync((isDev ? "./client/data/modules/" : path.join(exeRoot, `/data/modules/`)), moduleStoragePath, {recursive:true})

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

        data = migrateSheets(data)
        fs.writeFileSync(characterStorageFile, JSON.stringify(data), "utf-8")
    
        return data
    },
    storeSheets(sheets) {
        fs.writeFileSync(characterStorageFile, sheets, "utf-8")
    },
    getModuleStoragePath() {
        return moduleStoragePath
    }
}

function migrateSheets(data) {
    //read csv file from the module the character is using
    //no module info means legacy character -> fallback to dnd_5e_builtin
    //replace all instances of the old keys with the new keys, version is the column name
    //return the new data
    //key in data is version or charname, key value "version" is considered legacy and will not be used anymore
    //as newer versions of this client store the save format version in each character, as different modules might have different versions
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
        console.log("Migration data:", module.migration)

        if (!module) {
            console.log("Missing module", data[key].module.id + ",", "skipping migration for character:", key)
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
    
        newData[key] = {
            module: data[key].module
        }

        let sheetIndex = 0
        for (sheet in module.sheets) {
            newData[key][sheet] = {}
            newData[key][sheet + "Notes"] = []

            let migrateFrom = data[key]
            let migrateTo = {}
            migrateTo[sheet] = {}

            if (!fs.existsSync(module.migration[sheet])) {
                console.log("No save format file found for sheet ", sheet, ", skipping migration of this sheet for character:", key)
                newData[key] = data[key]
                continue
            }

            let migrationCsv = fs.readFileSync(module.migration[sheet], "utf8").replaceAll("\r", "").split("\n")

            for (let oldVersion = version; oldVersion < SAVE_VERSION; oldVersion++) {
                let sheetFrom

                if (module.info.migrations[oldVersion]) {
                    sheetFrom = module.info.migrations[oldVersion][sheetIndex]
                } else {
                    sheetFrom = sheet
                }

                migrateSheet(migrationCsv, oldVersion, oldVersion + 1, sheetFrom, sheet, migrateFrom, migrateTo)

                migrateFrom = migrateTo
                migrateTo = {}
            }

            newData[key][sheet] = migrateFrom[sheet]
            newData[key][sheet + "Notes"] = migrateFrom[sheet + "Notes"]
            sheetIndex++
        }
    }

    return newData
}

function migrateSheet(csvInput, versionFrom, versionTo, sheetFrom, sheetTo, from, to) {
    for (let i = 1; i < csvInput.length; i++) {
        let line = csvInput[i].split(",")
        let oldKey = line[versionFrom - 1]
        let newKey = line[versionTo - 1]

        if (from[sheetFrom][oldKey] == undefined) continue

        to[sheetTo][newKey] = from[sheetFrom][oldKey]
        delete from[sheetFrom][oldKey]
    }

    for (let key in from[sheetFrom]) {
        to[sheetTo][key] = from[sheetFrom][key]
    }

    let oldNotes = from[sheetFrom + "Notes"]
    to[sheetTo + "Notes"] = oldNotes != undefined && Array.isArray(oldNotes) ? oldNotes : []
}