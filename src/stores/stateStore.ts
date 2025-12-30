import type { Socket } from "socket.io-client";
import { type Writable, writable } from "svelte/store";
import type { PlayerInfo, Session, SheetModule } from "../types";

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export const characters: Writable<{[key: string]: any}> = writable({})

export const socket: Writable<Socket> = writable()
export const session: Writable<Session | undefined> = writable()

export const playerInfo: Writable<PlayerInfo> = writable({
    id: "",
    initiative: 0,
    initiativeModifier: 0,
})

export const sheetModules: Writable<{[key: string]: SheetModule}> = writable({})