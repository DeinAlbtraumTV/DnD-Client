export interface InputJsonNode {
    type?: "svg" | "text" | "spell" | "check" | "text-multiline"
    id: string
    initiative?: boolean
    class?: string
    data?: string
    inherits: InheritsJsonNode
}

export interface InheritsJsonNode {
    add?: InheritsJsonNode[]
    sub?: InheritsJsonNode[]
    mul?: InheritsJsonNode[]
    div?: InheritsJsonNode[]
    id: string
    value?: string | number
    conditional?: ConditionalJsonNode
}

export interface ConditionalJsonNode {
    condition: InheritsJsonNode
    [key: string]: InheritsJsonNode
}

export function getAffectedElements(changed: string, elements: InputJsonNode[]): string[] {
    let affected: string[] = []

    for (let elem of elements) {
        if (!elem.inherits) continue

        let inherit = elem.inherits

        try {
            if (doAffectedWalk(inherit, changed))
                affected.push(elem.id)
        } catch (e: any) {
            if (e.unknown) {
                console.warn(
                    "Encountered unknown inherit type. This is a problem with the module you are using and should be reported to the module author.\n" +
                    "Detailed info below: \n" +
                    "Key: \"" + e.unknown + "\"\n on element: \n" +
                    JSON.stringify(elem)
                )
            }
        }
    }

    for (let elem of elements) {
        if (!elem.inherits) continue

        let inherit = elem.inherits

        for (let affectedElem of affected) {
            if (doAffectedWalk(inherit, affectedElem))
                affected.push(elem.id)
        }
    }

    return affected
}

function doAffectedWalk(start: InheritsJsonNode, changed: string, conditionalEntered: boolean = false): boolean {
    let affected: boolean = false

    for (const [key, i_val] of Object.entries(start)) {
        const val: any = <any> i_val
        //If we just entered a conditional we don't care what the options are called as we dont evaluate them
        //So we mark every referenced field as affected
        if (conditionalEntered) {
            affected ||= doAffectedWalk(val, changed)
        } else {
            switch (key) {
                case "id":
                    if (changed === val) {
                        affected = true;
                    }
                    break

                case "add":
                case "sub":
                case "mul":
                case "div":
                    for (let elem of val)
                        affected ||= doAffectedWalk(elem, changed)
                    break

                case "conditional":
                    affected ||= doAffectedWalk(val, changed, true)
                    break

                //Values don't belong to any other input fields but we also don't want to error because of them
                case "value":
                    break

                default:
                    throw {
                        unknown: key
                    }
            }
        }
    }

    return affected
}

export function reCalculateValue(id: string, tree: InputJsonNode[], data: any, history: string[] = []): string {
    if (history.includes(id)) {
        console.warn(
            "Circular inheritence detected. This is a problem with the module you are using and should be reported to the module author.\n" +
            "Detailed info below: \n" +
            "Inherits failed on element with id: " + id + "\n" + 
            "History is as follows: \n" + JSON.stringify(history)
        )
        return ""
    }

    history.push(id)

    let field = findElemById(id, tree)

    if (!field) {
        return ""
    }

    if (!field.inherits || field.inherits.length == 0) {
        return data[id] ?? ""
    }

    if (field.inherits.length > 1) {
        console.warn(
            "Multiple inherits found on one element with id: " + id + "\n" +
            "This will lead to undefined behaviour. Please specify an operation to chain multiple fields together!"
        )
    }

    try {
        return "" + doCalculationWalk(field.inherits, tree, data, history)
    } catch (e: any) {
        if (e.unknown) {
            console.warn(
                "Encountered unknown inherit type. This is a problem with the module you are using and should be reported to the module author.\n" +
                "Detailed info below: \n" +
                "Key: \"" + e.unknown + "\"\n on element: \n" +
                JSON.stringify(field)
            )
        }

        return "0"
    }
}

function doCalculationWalk(start: InheritsJsonNode, tree: InputJsonNode[], data: any, history: string[]): number {
    let value: number = 0

    for (const [key, i_val] of Object.entries(start)) {
        const val: any = <any> i_val;
        switch (key) {
            case "id":
                let field = findElemById(val, tree)

                if (field.inherits) {
                    value = Number.parseInt(reCalculateValue(val, tree, data, history))
                } else {
                    value = Number.parseInt(data[val] ?? 0)
                }
                break

            case "add":
                for (const elem of val) {
                    value += doCalculationWalk(elem, tree, data, history)
                }
                break

            case "sub":
                for (const elem of val) {
                    value -= doCalculationWalk(elem, tree, data, history)
                }
                break

            case "mul":
                if (value == 0)
                    value = 1

                for (const elem of val) {
                    value *= doCalculationWalk(elem, tree, data, history)
                }
                break

            case "div":
                for (const elem of val) {
                    let temp = doCalculationWalk(elem, tree, data, history)
                    if (value == 0) {
                        value = temp
                    } else {
                        value /= temp
                    }
                }
                break

            case "conditional":
                let conditionField = findElemById(val.condition.id, tree)
                let conditionFieldId = conditionField.id
                let conditionFieldType = conditionField.type
                let conditionFieldValue

                if (conditionField.inherits) {
                    conditionFieldValue = reCalculateValue(conditionFieldId, tree, data, history)
                } else {
                    conditionFieldValue = data[conditionFieldId]
                }

                //Conditionals fall back to 0 if no value is set for a path. Careful when using them in mul/div groups!
                if (conditionFieldType === "check") {
                    value = conditionFieldValue ? (
                            Object.keys(val).includes("true") ? doCalculationWalk(val.true, tree, data, history) : 0
                        ) : (
                            Object.keys(val).includes("false") ? doCalculationWalk(val.false, tree, data, history) : 0
                        )
                } else if (val[conditionFieldValue]) {
                    value = doCalculationWalk(val[conditionFieldValue], tree, data, history)
                }
                break

            case "value":
                value = val
                break

            default:
                throw {
                    unknown: key
                }
        }
    }

    return value
}

function findElemById(id: string, tree: InputJsonNode[]): any {
    for (const elem of tree) {
        if (elem.id == id) {
            return elem;
        }
    }

    return null;
}