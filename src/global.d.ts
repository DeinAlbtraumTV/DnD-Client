/// <reference types="svelte" />

interface Window {
    characters: {
        loadSheets: () => any,
        storeSheets: (sheets: any) => any,
    },
    ipcRenderer: any
}