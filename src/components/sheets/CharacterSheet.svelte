<script>
    import { onMount } from "svelte";
    import { characters, socket, playerInfo, sheetModules } from "../../stores/nonPersistentStore"
    import { currentCharacter, characterSheets, sessionCode } from "../../stores/persistentSettingsStore"
    import { getAffectedElements, reCalculateValue } from "../../util/inputInheritenceHelper";
    import Note from "./Note.svelte"
    import ModuleElement from "./ModuleElement.svelte";

    export let showNotes = false;

    onMount(() => {
        if ($currentCharacter && $currentCharacter != "new" && $currentCharacter != "version" && $characters[$currentCharacter]) {
            loadValues()
        }

        currentCharacter.subscribe(value => {
            if (value && value != "new" && value != "version" && $characters[$currentCharacter]) {
                loadValues()
            }
        })
    })

    function loadValues() {
        let elems = document.querySelectorAll("[data-field-name]")

        elems.forEach(elem => {
            if (elem.type == "checkbox") {
                elem.checked = false
            } else {
                elem.value = ""
            }
        })

        Object.entries($characters[$currentCharacter].sheet).forEach((pair) => {
            let key = pair[0]
            let value = pair[1]

            let elem = document.querySelector("[id=\"" + key + "\"]")

            if (!elem || elem == null) {
                return
            }

            if (elem.type == "checkbox") {
                elem.checked = value
            } else {
                elem.value = value
            }

            elem.setAttribute("user-edited", true)
        })

        $sheetModules[$characters[$currentCharacter].module.id].data.characterSheet.forEach(elem => {
            if (!elem.type) return

            let field = document.querySelector("[id=\"" + elem.id + "\"]")

            if (!field.getAttribute("user-edited")) {
                let val = reCalculateValue(elem.id, $sheetModules[$characters[$currentCharacter].module.id].data.characterSheet, $characters[$currentCharacter].sheet)

                if (Number.parseInt(val) > 0)
                    val = "+" + val

                field.value = val
            }
        })

        $playerInfo.initiativeModifier = Number.parseInt($characters[$currentCharacter].sheet.initiative) || 0
    }

    function onDrop() {
        return false;
    }

    function onBlur(event) {
        if (event.target.value == "" && $characters[$currentCharacter].sheet[event.target.getAttribute("id")] != "") {
            event.target.removeAttribute("user-edited")
            delete $characters[$currentCharacter].sheet[event.target.getAttribute("id")]

            if (!event.target.getAttribute("user-edited")) {
                let selfVal = reCalculateValue(event.target.getAttribute("id"), $sheetModules[$characters[$currentCharacter].module.id].data.characterSheet, $characters[$currentCharacter].sheet)

                if (Number.parseInt(selfVal) > 0)
                    selfVal = "+" + selfVal

                event.target.value = selfVal
            }
        } else if (event.target.value != "") {
            event.target.setAttribute("user-edited", true)
            $characters[$currentCharacter].sheet[event.target.getAttribute("id")] = event.target.value
        }

        let affectedElems = getAffectedElements(event.target.getAttribute("id"), $sheetModules[$characters[$currentCharacter].module.id].data.characterSheet)
        
        for (const id of affectedElems) {
            let elem = document.querySelector("[id=\"" + id + "\"]")

            if (elem && !elem.getAttribute("user-edited")) {
                let val = reCalculateValue(id, $sheetModules[$characters[$currentCharacter].module.id].data.characterSheet, $characters[$currentCharacter].sheet)

                if (Number.parseInt(val) > 0)
                    val = "+" + val

                elem.value = val

                if (elem.getAttribute("data-initiative")) {
                    let initiative = Number.parseInt(val)

                    if (isNaN(initiative)) {
                        initiative = 0
                    }

                    $playerInfo.initiativeModifier = initiative
                    $socket.emit("updateInitiativeModifier", { session_code: $sessionCode, initiativeModifier: initiative} )
                }
            }
        }

        //Field-specific actions
        if (event.target.getAttribute("data-initiative")) {
            let initiative = Number.parseInt(event.target.value)

            if (isNaN(initiative)) {
                initiative = 0
            }

            $playerInfo.initiativeModifier = initiative
            $socket.emit("updateInitiativeModifier", { session_code: $sessionCode, initiativeModifier: initiative} )
        }

        window.characters.storeSheets(JSON.stringify($characters))
    }

    function onClick(event) {
        $characters[$currentCharacter].sheet[event.target.getAttribute("id")] = event.target.checked

        let affectedElems = getAffectedElements(event.target.getAttribute("id"), $sheetModules[$characters[$currentCharacter].module.id].data.characterSheet)

        for (const id of affectedElems) {
            let elem = document.querySelector("[id=\"" + id + "\"]")

            if (elem && !elem.getAttribute("user-edited")) {
                let val = reCalculateValue(id, $sheetModules[$characters[$currentCharacter].module.id].data.characterSheet, $characters[$currentCharacter].sheet)

                if (Number.parseInt(val) > 0)
                    val = "+" + val

                elem.value = val

                if (elem.getAttribute("data-initiative")) {
                    let initiative = Number.parseInt(val)

                    if (isNaN(initiative)) {
                        initiative = 0
                    }

                    $playerInfo.initiativeModifier = initiative;
                    $socket.emit("updateInitiativeModifier", { session_code: $sessionCode, initiativeModifier: initiative} );
                }
            }
        }

        window.characters.storeSheets(JSON.stringify($characters))
    }

    function noteDataUpdate(data) {
        $characters[$currentCharacter].sheetNotes[data.id] = data.detail
        window.characters.storeSheets(JSON.stringify($characters))
    }

    export const createNote = () => {
        let note = {
            id: $characters[$currentCharacter].sheetNotes.length > 0 ? $characters[$currentCharacter].sheetNotes[$characters[$currentCharacter].sheetNotes.length - 1].id + 1 : 0,
            x: 467.5,
            y: 605,
            minX: 0,
            minY: 0,
            maxX: 935,
            maxY: 1210,
            width: 0,
            height: 0,
            text: ''
        }

        $characters[$currentCharacter].sheetNotes.push(note)
        window.characters.storeSheets(JSON.stringify($characters))

        $characters[$currentCharacter].sheetNotes = $characters[$currentCharacter].sheetNotes;
    }

    let deleteNoteOnDrop = false;
    let showNoteRemover = false;

    function noteDragEnd(event) {
        if (deleteNoteOnDrop) {
            $characters[$currentCharacter].sheetNotes = $characters[$currentCharacter].sheetNotes.filter(note => note.id != event.detail)
            window.characters.storeSheets(JSON.stringify($characters))
        }

        showNoteRemover = false;
    }
</script>

<style>
    #characterSheet {
        color: black;
        position: relative;
        margin-top: 40px;
    }

    .note-remover {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 35px;
        position: fixed;
        bottom: calc(45px - 25px);
        right: calc(467.5px - 25px);
        width: 50px;
        height: 50px;
        background-color: #40404080;
        z-index: 200;
        border-radius: 50%;
        transition: all 0.1s linear;
    }

    .note-remover:hover {
        bottom: calc(45px - 30px);
        right: calc(467.5px - 30px);
        width: 60px;
        height: 60px;
        border-radius: 25%;
        font-size: 45px;
    }

    .note-remover.hidden {
        display: none;
    }
</style>

<div id="characterSheet" class="tabcontent" class:dark={$characterSheets == "dark"}>
    {@html `<style>@scope{${$sheetModules[$characters[$currentCharacter].module.id]?.css?.characterSheet}}</style>`}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class="note-remover" class:hidden={!showNoteRemover} on:mouseover={() => {deleteNoteOnDrop = true}} on:mouseout={() => {deleteNoteOnDrop = false}}>
        🗑️
    </div>
    {#if showNotes}
        {#each $characters[$currentCharacter].sheetNotes as data}
            <Note data={data} on:dragStart={() => {showNoteRemover = true}} on:dragEnd={noteDragEnd} on:dataUpdate={noteDataUpdate}></Note>
        {/each}
    {/if}
    <form>
        <div id="contentContainer">
            <div id="page1" style="width: 935px; height: 1210px;" class="page">
                <div class="page-inner" style="width: 935px; height: 1210px;">
                    <div id="p1" class="pageArea" style="overflow: hidden; position: relative; width: 935px; height: 1210px;margin-left:auto; margin-right:auto;">
                        {#each $sheetModules[$characters[$currentCharacter].module.id].data.characterSheet as elem}
                            <ModuleElement data={elem} onBlur={onBlur} onDrop={onDrop} onClick={onClick}/>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>