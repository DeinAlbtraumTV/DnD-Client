<script lang="ts">
    import { onMount } from "svelte";
    import { characters, sheetModules } from "../../stores/nonPersistentStore"
    import { currentCharacter, characterSheets } from "../../stores/persistentSettingsStore"
    import { getAffectedElements, reCalculateValue } from "../../util/inputInheritenceHelper";
    import Note from "./Note.svelte"
    import ModuleElement from "./ModuleElement.svelte"

    interface Props {
        showNotes?: boolean;
    }

    let { showNotes = false }: Props = $props();

    let spellinfoPopups = $state([]);

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
        Object.entries($characters[$currentCharacter].spellcasting).forEach((pair) => {
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

        $sheetModules[$characters[$currentCharacter].module.id].data.spellcastingSheet.forEach(elem => {
            if (!elem.type) return

            let field = document.querySelector("[id=\"" + elem.id + "\"]")

            if (!field.getAttribute("user-edited")) {
                let val = reCalculateValue(elem.id, $sheetModules[$characters[$currentCharacter].module.id].data.spellcastingSheet, $characters[$currentCharacter].spellcasting)

                if (Number.parseInt(val) > 0)
                    val = "+" + val

                field.value = val
            }
        })
    }

    function onDrop() {
        return false;
    }

    function onFocus(event) {
        let target = event.currentTarget;
        let spellname = target.value.replace(/ *\([^)]*\) */g, "");

        let popupIndex = spellinfoPopups.findIndex(elem => elem.target == target);

        if (popupIndex > -1) {
            if (spellinfoPopups[popupIndex].spellname != spellname) {
                spellinfoPopups[popupIndex].spellname = spellname;
                spellinfoPopups[popupIndex].promise = loadSpellDesc(target, spellname, target.classList.contains("popup-left"));
                spellinfoPopups[popupIndex].shouldShow = true;
            } else {
                spellinfoPopups[popupIndex].showing = true;
            }
        } else {
            spellinfoPopups.push({
                target: target,
                spellname: spellname,
                promise: loadSpellDesc(target, spellname, target.classList.contains("popup-left")),
                showing: false,
                shouldShow: true,
                popupContent: "",
                left: false,
            });
        }

        //Make svelte rerender all popups
        spellinfoPopups = spellinfoPopups;
    }

    async function loadSpellDesc(target, spellname, left = false) {
        let desc = await window.spells.getSpellInfo("http://dnd5e.wikidot.com/spell:" + spellname)

        let popupIndex = spellinfoPopups.findIndex(elem => elem.target == target);

        if (spellinfoPopups[popupIndex].spellname == spellname) {
            spellinfoPopups[popupIndex].popupContent = desc;
            spellinfoPopups[popupIndex].showing = spellinfoPopups[popupIndex].shouldShow;
            spellinfoPopups[popupIndex].shouldShow = false;
            spellinfoPopups[popupIndex].left = left;
        }

        //Make svelte rerender all popups
        spellinfoPopups = spellinfoPopups;
    }

    function onBlur(event) {
        if (event.target.value == "" && $characters[$currentCharacter].spellcasting[event.target.getAttribute("id")] != "") {
            event.target.removeAttribute("user-edited")
            delete $characters[$currentCharacter].spellcasting[event.target.getAttribute("id")]

            if (!event.target.getAttribute("user-edited")) {
                let selfVal = reCalculateValue(event.target.getAttribute("id"), $sheetModules[$characters[$currentCharacter].module.id].data.spellcastingSheet, $characters[$currentCharacter].spellcasting)

                if (Number.parseInt(selfVal) > 0)
                    selfVal = "+" + selfVal

                event.target.value = selfVal
            }
        } else if (event.target.value != "") {
            event.target.setAttribute("user-edited", true)
            $characters[$currentCharacter].spellcasting[event.target.getAttribute("id")] = event.target.value
        }

        let affectedElems = getAffectedElements(event.target.getAttribute("id"), $sheetModules[$characters[$currentCharacter].module.id].data.spellcastingSheet)
        
        for (const id of affectedElems) {
            let elem = document.querySelector("[id=\"" + id + "\"]")

            if (elem && !elem.getAttribute("user-edited")) {
                let val = reCalculateValue(id, $sheetModules[$characters[$currentCharacter].module.id].data.spellcastingSheet, $characters[$currentCharacter].spellcasting)

                if (Number.parseInt(val) > 0)
                    val = "+" + val

                elem.value = val
            }
        }

        window.characters.storeSheets(JSON.stringify($characters));

        setTimeout(() => {
            let popupIndex = spellinfoPopups.findIndex(elem => elem.target == event.target);
                if (spellinfoPopups[popupIndex]) {
                    if (spellinfoPopups[popupIndex].showing) {
                        spellinfoPopups[popupIndex].showing = false;
                    } else {
                        spellinfoPopups[popupIndex].shouldShow = false;
                    }
                }
            //Make svelte rerender all popups
            spellinfoPopups = spellinfoPopups;
        }, 75)
    }

    function onClick(event) {
        $characters[$currentCharacter].spellcasting[event.target.getAttribute("id")] = event.target.checked

        let affectedElems = getAffectedElements(event.target.getAttribute("id"), $sheetModules[$characters[$currentCharacter].module.id].data.spellcastingSheet)

        for (const id of affectedElems) {
            let elem = document.querySelector("[id=\"" + id + "\"]")

            if (elem && !elem.getAttribute("user-edited")) {
                let val = reCalculateValue(id, $sheetModules[$characters[$currentCharacter].module.id].data.spellcastingSheet, $characters[$currentCharacter].spellcasting)

                if (Number.parseInt(val) > 0)
                    val = "+" + val

                elem.value = val
            }
        }

        window.characters.storeSheets(JSON.stringify($characters))
    }
    
    function noteDataUpdate(data) {
        $characters[$currentCharacter].spellcastingNotes[data.id] = data.detail
        window.characters.storeSheets(JSON.stringify($characters))
    }

    export const createNote = () => {
        let note = {
            id: $characters[$currentCharacter].spellcastingNotes.length > 0 ? $characters[$currentCharacter].spellcastingNotes[$characters[$currentCharacter].spellcastingNotes.length - 1].id + 1 : 0,
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

        $characters[$currentCharacter].spellcastingNotes.push(note)
        window.characters.storeSheets(JSON.stringify($characters))

        $characters[$currentCharacter].spellcastingNotes = $characters[$currentCharacter].spellcastingNotes;
    }

    let deleteNoteOnDrop = $state(false);
    let showNoteRemover = $state(false);

    function noteDragEnd(event) {
        if (deleteNoteOnDrop) {
            $characters[$currentCharacter].spellcastingNotes = $characters[$currentCharacter].spellcastingNotes.filter(note => note.id != event.detail)
            window.characters.storeSheets(JSON.stringify($characters))
        }

        showNoteRemover = false;
    }
</script>

<style>
    #spellcastingSheet {
        color: black;
        position: relative;
        margin-top: 40px;
    }

    .popup-wrapper {
        border-radius: 10px;
        background-color: var(--characterSheetsPrimary);
        position: absolute;
        height: 500px;
        width: 300px;
        z-index: 10;
        padding: 4px;
        overflow: auto;
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

<div id="spellcastingSheet" class="tabcontent" class:dark={$characterSheets == "dark"}>
    {@html `<style>@scope{${$sheetModules[$characters[$currentCharacter].module.id]?.css?.spellcastingSheet}}</style>`}
    <!-- svelte-ignore a11y_mouse_events_have_key_events -->
    <div class="note-remover" class:hidden={!showNoteRemover} onmouseover={() => {deleteNoteOnDrop = true}} onmouseout={() => {deleteNoteOnDrop = false}}>
        🗑️
    </div>
    {#if showNotes}
        {#each $characters[$currentCharacter].spellcastingNotes as data}
            <Note data={data} on:dragStart={() => {showNoteRemover = true}} on:dragEnd={noteDragEnd} on:dataUpdate={noteDataUpdate}></Note>
        {/each}
    {/if}
    <form>
        <div id="contentContainer">
            <div id="page1" style="width: 935px; height: 1210px;" class="page">
                <div class="page-inner" style="width: 935px; height: 1210px;">
                    <div id="p1" class="pageArea" style="overflow: hidden; position: relative; width: 935px; height: 1210px; margin-top:auto; margin-left:auto; margin-right:auto;">
                        {#each $sheetModules[$characters[$currentCharacter].module.id].data.spellcastingSheet as elem}
                            <ModuleElement data={elem} onBlur={onBlur} onDrop={onDrop} onClick={onClick} onFocus={onFocus} onStopTyping={onFocus}/>
                        {/each}
                    </div>
                    {#each spellinfoPopups as popup}
                        {#if popup && popup.showing}
                            <div class="popup-wrapper" style="top: {popup.target.offsetTop - 234.5}px; {(popup.left ? "left: " + (popup.target.offsetLeft - 315) + "px" : "left: " + (popup.target.offsetLeft + 260) + "px")}; color: {$characterSheets == "dark" ? "white" : "black"} !important;">
                                <style>
                                    .popup-wrapper a {
                                        color: var(--primary);
                                    }

                                    .popup-wrapper p {
                                        margin-block-start: 5px;
                                        margin-block-end: 5px;
                                    }
                                </style>
                                {@html popup.popupContent}
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
    </form>
</div>