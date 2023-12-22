import { writable } from "svelte/store";

export const localStorageStore = writable(localStorage)