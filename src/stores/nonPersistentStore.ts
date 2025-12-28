import type { Socket } from "socket.io-client";
import { type Writable, writable } from "svelte/store";
import type { ModuleData } from "../types/types";

export const characters: Writable<{[key: string]: any}> = writable({})

export const socket: Writable<Socket> = writable()
export const session: Writable<Session | undefined> = writable()

export const playerInfo: Writable<PlayerInfo> = writable({
    id: "",
    initiative: 0,
    initiativeModifier: 0,
})

export const sheetModules: Writable<{[key: string]: SheetModule}> = writable({})

export type Session = {
    code: string,
    role: string,
    dm: boolean,
    url: string
}

export type PlayerInfo = {
    id: string,
    initiative: number,
    initiativeModifier: number,
}

export type PlayerData = {
    name: string,
    initiative: number,
    initiativeModifier: number,
    isDummy: boolean,
}

export type SheetModule = {
    css: {
        shared: string,
        characterSheet: string,
        detailSheet: string,
        spellcastingSheet: string
    },
    data: {
        [key: string]: Array<ModuleData>
    },
    info: {
        name: string,
        version: number,
        author: string | undefined | null,
        repo: string | undefined | null,
        format: number,
        sheets: {fileName: string,displayName: string,saveName: string}[]
    }
}