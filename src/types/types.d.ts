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
    conditional: ConditionData
} | {
    id: string
} | {
    value: string
}

export type ConditionData = {
    condition: { id: string},
    [key: string]: InheritData
}