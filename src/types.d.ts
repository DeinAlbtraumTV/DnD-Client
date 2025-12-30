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

export type SpellInfoPopup = {
    target: HTMLElement,
    spellname: string,
    promise: Promise,
    showing: boolean,
    shouldShow: boolean,
    popupContent: string,
    left: boolean,
}

export type NoteData = {
    id: number,
    x: number,
    y: number,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    width: number,
    height: number,
    text: string,
    expanded: boolean
}

export type ModuleData = {
    id: string,
    data?: string | ModuleData,
    initiative?: boolean,
    class?: string,
    type?: "svg" | "text" | "spell" | "check" | "text-multiline",
    src?: string,
    inherits?: InheritData
}

export type InheritData = {
    add: Array<InheritData>
} | {
    sub: Array<InheritData>
} | {
    mul: Array<InheritData>
} | {
    div: Array<InheritData>
} | {
    conditional: ConditionalData
} | {
    id: string
} | {
    value: string
}

export type ConditionalData = {
    condition: ConditionData,
    [key: string]: InheritData
}

export type ConditionData = {
    id: string
}