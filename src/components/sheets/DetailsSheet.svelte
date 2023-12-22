<script>
    import { onMount } from "svelte";
    import { characters } from "../../stores/nonPersistentStore"
    import { currentCharacter, characterSheets } from "../../stores/persistentSettingsStore"
    import InlineSVG from "svelte-inline-svg"
    import Note from "./Note.svelte"

    export let showNotes = false;

    onMount(() => {
        if ($currentCharacter && $currentCharacter != "new" && $currentCharacter != "version") {
            loadValues()
        }

        currentCharacter.subscribe(value => {
            if (value && value != "new" && value != "version") {
                loadValues()
            }
        })
    })

    function loadValues() {
        Object.entries($characters[$currentCharacter].details).forEach((pair) => {
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
        })
    }

    function onDrop() {
        return false;
    }

    function onBlur(event) {
        $characters[$currentCharacter].details[event.target.getAttribute("id")] = event.target.value
        window.characters.storeSheets(JSON.stringify($characters))
    }

    function noteDataUpdate(data) {
        $characters[$currentCharacter].detailNotes[data.id] = data.detail
        window.characters.storeSheets(JSON.stringify($characters))
    }

    export const createNote = () => {
        let note = {
            id: $characters[$currentCharacter].detailNotes.length > 0 ? $characters[$currentCharacter].detailNotes[$characters[$currentCharacter].detailNotes.length - 1].id + 1 : 0,
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

        $characters[$currentCharacter].detailNotes.push(note)
        window.characters.storeSheets(JSON.stringify($characters))

        $characters[$currentCharacter].detailNotes = $characters[$currentCharacter].detailNotes;
    }

    let deleteNoteOnDrop = false;
    let showNoteRemover = false;

    function noteDragEnd(event) {
        if (deleteNoteOnDrop) {
            $characters[$currentCharacter].detailNotes = $characters[$currentCharacter].detailNotes.filter(note => note.id != event.detail)
            window.characters.storeSheets(JSON.stringify($characters))
        }

        showNoteRemover = false;
    }
</script>

<style>
    #detailSheet {
        color: black;
        position: relative;
        margin-top: 40px;
    }

    .dark .t, .dark input, .dark textarea {
        color: white;
    }

    input:focus, textarea:focus {
        outline: var(--primary) 2px solid;
        border-radius: 5px;
        box-sizing: border-box;
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

<div id="detailSheet" class="tabcontent" class:dark={$characterSheets == "dark"}>                   
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class="note-remover" class:hidden={!showNoteRemover} on:mouseover={() => {deleteNoteOnDrop = true}} on:mouseout={() => {deleteNoteOnDrop = false}}>
        🗑️
    </div>
    {#if showNotes}
        {#each $characters[$currentCharacter].detailNotes as data}
            <Note data={data} on:dragStart={() => {showNoteRemover = true}} on:dragEnd={noteDragEnd} on:dataUpdate={noteDataUpdate}></Note>
        {/each}
    {/if} 
    <form>
        <div id="contentContainer">
            <div id="page1" style="width: 935px; height: 1210px;" class="page">
                <div class="page-inner" style="width: 935px; height: 1210px;">
                    <div id="p1" class="pageArea" style="overflow: hidden; position: relative; width: 935px; height: 1210px; margin-top:auto; margin-left:auto; margin-right:auto;">
                    
                        <!-- Begin page background -->
                        <div id="pg1" style="-webkit-user-select: none; user-select: none;">
                            <InlineSVG id="pageBackground" src="sheets/assets/characterDetails/1.svg" aria-label="Page Background" width="935" height="1210" style="width:935px; height:1210px; -moz-transform:scale(1); transform: scale(1); z-index: 0; outline: none;"></InlineSVG>
                        </div>
                        <!-- End page background -->
                        
                        <!-- Begin text definitions (Positioned/styled in CSS) -->
                        <div id="text_cname2" class="t s1_2">CHARACTER NAME</div>
                        <div id="text_eyes" class="t s1_2">EYES</div>
                        <div id="text_age" class="t s1_2">AGE</div>
                        <div id="text_weight" class="t s1_2">WEIGHT</div>
                        <div id="text_height" class="t s1_2">HEIGHT</div>
                        <div id="text_hair" class="t s1_2">HAIR</div>
                        <div id="text_skin" class="t s1_2">SKIN</div>
                        <div id="text_name" class="t s2_2">NAME</div>
                        <div id="text_treasure" class="t s3_2">TREASURE</div>
                        <div id="text_backstory" class="t s3_2">CHARACTER BACKSTORY</div>
                        <div id="text_appearance" class="t s3_2">CHARACTER APPEARANCE</div>
                        <div id="text_additionalFeatures" class="t s3_2">ADDITIONAL FEATURES &amp; TRAITS</div>
                        <div id="text_allies" class="t s3_2">ALLIES &amp; ORGANIZATIONS</div>
                        <div id="text_symbol" class="t s4_2">SYMBOL</div>
                        <div id="text_copyright2" class="t s5_2">TM &amp; © 2014 Wizards of the Coast LLC. Permission is granted to photocopy this document for personal use.</div>
                        <!-- End text definitions -->
                        
                        <!-- Begin Form Data -->
                        <input id="cname2" type="text" value="" data-objref="270 0 R" data-field-name="CharacterName 2" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="age" type="text" value="" data-objref="271 0 R" data-field-name="Age" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="height" type="text" value="" data-objref="272 0 R" data-field-name="Height" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="weight" type="text" value="" data-objref="273 0 R" data-field-name="Weight" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="eyes" type="text" value="" data-objref="274 0 R" data-field-name="Eyes" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="skin" type="text" value="" data-objref="275 0 R" data-field-name="Skin" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="hair" type="text" value="" data-objref="276 0 R" data-field-name="Hair" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <textarea id="allies" data-objref="279 0 R" data-field-name="Allies" on:blur="{onBlur}" on:drop="{onDrop}"></textarea>
                        <input id="factionName" type="text" value="" data-objref="280 0 R" data-field-name="FactionName" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <textarea id="backstory" data-objref="281 0 R" data-field-name="Backstory" on:blur="{onBlur}" on:drop="{onDrop}"></textarea>
                        <textarea id="additionalFeatures" data-objref="282 0 R" data-field-name="Feat+Traits" on:blur="{onBlur}" on:drop="{onDrop}"></textarea>
                        <textarea id="treasure" data-objref="283 0 R" data-field-name="Treasure" on:blur="{onBlur}" on:drop="{onDrop}"></textarea>
                        <!-- End Form Data -->
                    
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>