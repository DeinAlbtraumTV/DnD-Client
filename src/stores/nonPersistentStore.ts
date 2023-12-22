import type { Socket } from "socket.io-client";
import { type Writable, writable } from "svelte/store";

export const characters: Writable<{[key: string]: any}> = writable({})
export const currentCharacterObj = writable({})

export const socket: Writable<Socket> = writable()
export const session: Writable<Session | undefined> = writable()

export const playerInfo: Writable<PlayerInfo> = writable({
    id: "",
    initiative: 0,
    initiativeModifier: 0,
})

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