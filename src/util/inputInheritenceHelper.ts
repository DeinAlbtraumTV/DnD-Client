import type { ConditionalData, ConditionData, InheritData, ModuleData } from "../types"

export function getAffectedElements(changed: string, elements: ModuleData[]): string[] {
    const affected: string[] = []

    for (const elem of elements) {
        if (!elem.inherits) continue

        const inherit = elem.inherits

        try {
            if (doAffectedWalk(inherit, changed))
                affected.push(elem.id)
        } catch (e: unknown) {
            const error = e as { unknown: string }
            if (error.unknown) {
                console.warn(
                    "Encountered unknown inherit type. This is a problem with the module you are using and should be reported to the module author.\n" +
                    "Detailed info below: \n" +
                    "Key: \"" + error.unknown + "\"\n on element: \n" +
                    JSON.stringify(elem)
                )
            }
        }
    }

    let doCheck = true

    while (doCheck) {
        if (doAffectedChecks(elements, affected)) {
            doCheck = false
        }
    }

    return affected
}

function doAffectedChecks(elements: ModuleData[], affected: string[]) {
    for (const elem of elements) {
        if (!elem.inherits) continue

        const inherit = elem.inherits

        for (const affectedElem of affected) {
            if (doAffectedWalk(inherit, affectedElem)) {
                if (!affected.includes(elem.id)) {
                    affected.push(elem.id)
                    return false
                }
            }
        }
    }

    return true
}

function doAffectedWalk(start: InheritData | ConditionalData | ConditionData | string, changed: string, conditional_entered: boolean = false): boolean {
    let affected: boolean = false

    for (const [key, val] of Object.entries(start)) {
        //If we just entered a conditional we don't care what the options are called as we dont evaluate them
        //So we mark every referenced field as affected
        if (conditional_entered) {
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
                    for (const elem of val as InheritData[])
                        affected ||= doAffectedWalk(elem, changed)
                    break

                case "conditional":
                    affected ||= doAffectedWalk(val as ConditionalData, changed, true)
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

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function reCalculateValue(id: string, tree: ModuleData[], data: { [key: string]: any }, history: string[] = []): string {
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

    const field = findElemById(id, tree)
    const elem = <HTMLInputElement> document.querySelector("[id=\"" + id + "\"]")

    if (!field || !elem) {
        return ""
    }

    if (typeof(field) !== "object" || !field.inherits || elem.hasAttribute("user-edited")) {
        return data[id] ?? ""
    }

    if (Array.isArray(field)) {
        console.warn(
            "Inherits is an array on one element with id: " + id + "\n" +
            "This will lead to undefined behaviour. Please specify an operation to chain multiple fields together!"
        )
    }

    try {
        return "" + doCalculationWalk(field.inherits, tree, data, history)
    } catch (e: unknown) {
        const error = e as { unknown: string }
        if (error.unknown) {
            console.warn(
                "Encountered unknown inherit type. This is a problem with the module you are using and should be reported to the module author.\n" +
                "Detailed info below: \n" +
                "Key: \"" + error.unknown + "\"\n on element: \n" +
                JSON.stringify(field)
            )
        }

        return "0"
    }
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function doCalculationWalk(start: InheritData, tree: ModuleData[], data: { [key: string]: any }, history: string[]): number {
    let value: number = 0

    for (const [key, i_val] of Object.entries(start)) {
        const val = i_val as InheritData[] | ConditionalData | string
        switch (key) {
            case "id": {
                const id = val as string
                const field = findElemById(id, tree)

                if (field && field.inherits) {
                    value = Number.parseInt(reCalculateValue(id, tree, data, history))
                } else {
                    value = Number.parseInt(data[id] ?? 0)
                }
                break
            }

            case "add": {
                for (const elem of val as InheritData[]) {
                    value += doCalculationWalk(elem, tree, data, history)
                }
                break
            }

            case "sub": {
                for (const elem of val as InheritData[]) {
                    value -= doCalculationWalk(elem, tree, data, history)
                }
                break
            }

            case "mul": {
                if (value == 0)
                    value = 1

                for (const elem of val as InheritData[]) {
                    value *= doCalculationWalk(elem, tree, data, history)
                }
                break
            }

            case "div": {
                for (const elem of val as InheritData[]) {
                    const temp = doCalculationWalk(elem, tree, data, history)
                    if (value == 0) {
                        value = temp
                    } else {
                        value /= temp
                    }
                }
                break
            }

            case "conditional": {
                const conditional = val as ConditionalData
                const conditionField = findElemById(conditional.condition.id, tree)

                if (conditionField == null) {
                    break
                }

                const conditionFieldId = conditionField.id
                const conditionFieldType = conditionField.type
                let conditionFieldValue

                if (conditionField.inherits) {
                    conditionFieldValue = reCalculateValue(conditionFieldId, tree, data, history)
                } else {
                    conditionFieldValue = data[conditionFieldId]
                }

                //Conditionals fall back to 0 if no value is set for a path. Careful when using them in mul/div groups!
                if (conditionFieldType === "check") {
                    value = conditionFieldValue ? (
                            Object.keys(val).includes("true") ? doCalculationWalk(conditional["true"], tree, data, history) : 0
                        ) : (
                            Object.keys(val).includes("false") ? doCalculationWalk(conditional["false"], tree, data, history) : 0
                        )
                } else if (conditional[conditionFieldValue]) {
                    value = doCalculationWalk(conditional[conditionFieldValue], tree, data, history)
                }
                break
            }

            case "value":
                value = Number.parseInt(val as string)
                break

            default:
                throw {
                    unknown: key
                }
        }
    }

    return value
}

function findElemById(id: string, tree: ModuleData[]): ModuleData | null {
    for (const elem of tree) {
        if (elem.id == id) {
            return elem;
        }
    }

    return null;
}