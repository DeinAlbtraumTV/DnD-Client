/// <reference types="svelte" />
import { WebviewTag } from "electron"

declare global {
    interface Window {
        characters: {
            loadSheets: () => any,
            storeSheets: (sheets: any) => any,
        },
        util: {
            openModuleFolder: () => any
        },
        spells: {
            getSpellInfo: (url: string) => Promise<string>
        }
        ipcRenderer: any
    }
}