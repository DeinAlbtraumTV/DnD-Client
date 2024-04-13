/// <reference types="svelte" />

interface Window {
    characters: {
        loadSheets: () => any,
        storeSheets: (sheets: any) => any,
    },
    util: {
        openModuleFolder: () => any
    }
    ipcRenderer: any
}