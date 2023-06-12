import { writable } from "svelte/store";

const backgroundColorStored = localStorage.getItem("backgroundColor")
const backgroundOverlayStored = localStorage.getItem("backgroundOverlay")
const backgroundOverlayOpacityStored = localStorage.getItem("backgroundOverlayOpacity")
const backgroundImageStored = localStorage.getItem("backgroundImage")
const backgroundImageSizeStored = localStorage.getItem("backgroundImageSize")
const backgroundPositionStored = localStorage.getItem("backgroundPosition")
const currentCharacterStored = localStorage.getItem("character")
const primaryColorStored = localStorage.getItem("primaryColor")
const characterSheetsStored = localStorage.getItem("characterSheets")
const sheetZoomStored = Number.parseInt(localStorage.getItem("sheetZoom") ?? "100")

const sessionCodeStored = localStorage.getItem("sessionCode")

export const backgroundColor = writable(backgroundColorStored ?? "#101010")
export const backgroundOverlay = writable(backgroundOverlayStored ?? "#000000")
export const backgroundOverlayOpacity = writable(backgroundOverlayOpacityStored ?? "128")
export const backgroundImage = writable(backgroundImageStored ?? "")
export const backgroundImageSize = writable(backgroundImageSizeStored ?? "auto")
export const backgroundPosition = writable(backgroundPositionStored ?? "center")
export const currentCharacter = writable(currentCharacterStored ?? "new")
export const primaryColor = writable(primaryColorStored ?? "#FA422C")
export const characterSheets = writable(characterSheetsStored ?? "dark")
export const sheetZoom = writable(sheetZoomStored ?? 100)

export const sessionCode = writable(sessionCodeStored ?? "")

backgroundColor.subscribe(value => {
    localStorage.setItem("backgroundColor", value ?? "#101010")
})

backgroundOverlay.subscribe(value => {
    localStorage.setItem("backgroundOverlay", value ?? "#000000")
})

backgroundOverlayOpacity.subscribe(value => {
    localStorage.setItem("backgroundOverlayOpacity", value ?? "128")
})

backgroundImage.subscribe(value => {
    localStorage.setItem("backgroundImage", value ?? "")
});

backgroundImageSize.subscribe(value => {
    localStorage.setItem("backgroundImageSize", value ?? "auto")
})

backgroundPosition.subscribe(value => {
    localStorage.setItem("backgroundPosition", value ?? "center")
})

currentCharacter.subscribe(value => {
    localStorage.setItem("character", value ?? "new")
})

primaryColor.subscribe(value => {
    localStorage.setItem("primaryColor", value ?? "#FA422C")
})

characterSheets.subscribe(value => {
    localStorage.setItem("characterSheets", value ?? "dark")
})

sheetZoom.subscribe(value => {
    localStorage.setItem("sheetZoom", value.toString() ?? "100")
})

sessionCode.subscribe(value => {
    localStorage.setItem("sessionCode", value ?? "")
})