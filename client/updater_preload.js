/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld(
    "ipc", {
        send: (channel, ...args) => ipcRenderer.send(channel, args),
        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(event, args))
    }
)