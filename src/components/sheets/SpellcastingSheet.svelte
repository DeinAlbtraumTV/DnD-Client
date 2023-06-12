<script>
    import { onMount } from "svelte";
    import { characters } from "../../stores/nonPersistentStore"
    import { currentCharacter, characterSheets } from "../../stores/persistentSettingsStore"
    import InlineSVG from "svelte-inline-svg"
    import { stopTyping } from "../../util/nodeExtensions";
    import Note from "./Note.svelte"

    let spellinfoPopups = [];

    onMount(() => {
        if ($currentCharacter && $currentCharacter != "new") {
            loadValues()
        }

        currentCharacter.subscribe(value => {
            if ($currentCharacter && $currentCharacter != "new") {
                loadValues()
            }
        })
    })

    function loadValues() {
        Object.entries($characters[$currentCharacter].spellcasting).forEach((pair) => {
            let key = pair[0]
            let value = pair[1]
            
            let elem = document.querySelector("[id=\"" + key + "\"]")

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
        $characters[$currentCharacter].spellcasting[event.target.getAttribute("id")] = event.target.value;
        window.characters.storeSheets(JSON.stringify($characters));

        setTimeout(() => {
            let popupIndex = spellinfoPopups.findIndex(elem => elem.target == event.target);

            if (spellinfoPopups[popupIndex].showing) {
                spellinfoPopups[popupIndex].showing = false;
            } else {
                spellinfoPopups[popupIndex].shouldShow = false;
            }

            //Make svelte rerender all popups
            spellinfoPopups = spellinfoPopups;
        }, 75)
    }

    function onClick(event) {
        $characters[$currentCharacter].spellcasting[event.target.getAttribute("id")] = event.target.checked
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
    #spellcastingSheet {
        color: black;
        position: relative;
        margin-top: 40px;
    }

    .dark .t, .dark input {
        color: white;
    }

    input:focus {
        outline: var(--primary) 2px solid;
        border-radius: 5px;
        box-sizing: border-box;
    }

    input[type="checkbox"] {
        appearance: none !important;
        background-color: transparent !important;
        border: none !important;
        margin: 0 !important;
        outline: none !important;
        color: black !important;
        transform: translateY(2px);
        border-radius: 50% !important;
    }

    input[type="checkbox"]:hover, input[type="checkbox"]:focus {
        outline: 2px solid var(--primary) !important;
    }

    .dark input[type="checkbox"]:checked {
        background-color: var(--characterSheetsTertiary) !important;
    }

    input[type="checkbox"]:checked {
        background-color: black !important;
        border-radius: 50%;
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
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class="note-remover" class:hidden={!showNoteRemover} on:mouseover={() => {deleteNoteOnDrop = true}} on:mouseout={() => {deleteNoteOnDrop = false}}>
        🗑️
    </div>
    {#each $characters[$currentCharacter].sheetNotes as data}
        <Note data={data} on:dragStart={() => {showNoteRemover = true}} on:dragEnd={noteDragEnd} on:dataUpdate={noteDataUpdate}></Note>
    {/each}
    <form>
        <div id="contentContainer">
            <div id="page1" style="width: 935px; height: 1210px;" class="page">
                <div class="page-inner" style="width: 935px; height: 1210px;">
                    <div id="p1" class="pageArea" style="overflow: hidden; position: relative; width: 935px; height: 1210px; margin-top:auto; margin-left:auto; margin-right:auto;">

                        <!-- Begin page background -->
                        <div id="pg1" style="-webkit-user-select: none; user-select: none;">
                            <InlineSVG id="pageBackground" src="sheets/assets/spellcastingSheet/1.svg" aria-label="Page Background" width="935" height="1210" style="width:935px; height:1210px; -moz-transform:scale(1); transform: scale(1); z-index: 0; outline: none;"></InlineSVG>
                        </div>
                        <!-- End page background -->
                        
                        <!-- Begin text definitions (Positioned/styled in CSS) -->
                        <div id="text_copyright3" class="t s1_3">TM &amp; © 2014 Wizards of the Coast LLC. Permission is granted to photocopy this document for personal use.</div>
                        <div id="text_spellcasting" class="t s2_3">SPELLCASTING</div>
                        <div id="text_spellClass" class="t s2_3">CLASS</div>
                        <div id="text_spellsKnown" class="t m0_1_3 s3_3">SPELLS KNOWN</div>
                        <div id="text_spellName" class="t s4_3">SPELL NAME</div>
                        <div id="text_p" class="t m1_1_3 s5_3">P</div>
                        <div id="text_r" class="t m2_1_3 s5_3">R</div>
                        <div id="text_e" class="t m3_1_3 s5_3">E</div>
                        <div id="text_p2" class="t m4_1_3 s5_3">P</div>
                        <div id="text_a" class="t m5_1_3 s5_3">A</div>
                        <div id="text_r2" class="t m6_1_3 s5_3">R</div>
                        <div id="text_e2" class="t m7_1_3 s5_3">E</div>
                        <div id="text_d" class="t m8_1_3 s5_3">D</div>
                        <div id="text_spell" class="t s3_3">SPELL</div>
                        <div id="text_lvl" class="t s3_3">LEVEL</div>
                        <div id="text_slotsExpended" class="t s3_3">SLOTS EXPENDED</div>
                        <div id="text_slotsTotal" class="t s3_3">SLOTS TOTAL</div>
                        <div id="text_n1" class="t s6_3">1</div>
                        <div id="text_n0" class="t s6_3">0</div>
                        <div id="text_n2" class="t s6_3">2</div>
                        <div id="text_n3" class="t s6_3">3</div>
                        <div id="text_n6" class="t s6_3">6</div>
                        <div id="text_n7" class="t s6_3">7</div>
                        <div id="text_n8" class="t s6_3">8</div>
                        <div id="text_n9" class="t s6_3">9</div>
                        <div id="text_n4" class="t s6_3">4</div>
                        <div id="text_n5" class="t s6_3">5</div>
                        <div id="text_spellcasting2" class="t s2_3">SPELLCASTING</div>
                        <div id="text_spellAbility" class="t s2_3">ABILITY</div>
                        <div id="text_spellSave" class="t s2_3">SPELL SAVE DC</div>
                        <div id="text_spellAtk" class="t s2_3">SPELL ATTACK</div>
                        <div id="text_spellBonus" class="t s2_3">BONUS</div>
                        <div id="text_spellCantrips" class="t s7_3">CANTRIPS</div>
                        <!-- End text definitions -->
                        
                        <!-- Begin Form Data -->
                        <input id="spellClass" type="text" value="" data-field-name="Spellcasting Class 2" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spellAbility" type="text" value="" data-field-name="SpellcastingAbility 2" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spellSave" type="text" value="" data-field-name="SpellSaveDC  2" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="SpellAtk" type="text" value="" data-field-name="SpellAtkBonus 2" on:blur="{onBlur}" on:drop="{onDrop}"/>

                        <input id="spell0_1" type="text" value="" data-field-name="Spells 1014" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell0_2" type="text" value="" data-field-name="Spells 1016" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell0_3" type="text" value="" data-field-name="Spells 1017" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell0_4" type="text" value="" data-field-name="Spells 1018" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell0_5" type="text" value="" data-field-name="Spells 1019" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell0_6" type="text" value="" data-field-name="Spells 1020" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell0_7" type="text" value="" data-field-name="Spells 1021" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell0_8" type="text" value="" data-field-name="Spells 1022" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots1_1" type="text" value="" data-field-name="SlotsTotal 19" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots1_2" type="text" value="" data-field-name="SlotsRemaining 19" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell1_1Prep" type="checkbox" data-field-name="Check Box 251" on:change="{onClick}"/>
                        <input id="spell1_1" type="text" value="" data-field-name="Spells 1015" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_2Prep" type="checkbox" data-field-name="Check Box 309" on:change="{onClick}"/>
                        <input id="spell1_2" type="text" value="" data-field-name="Spells 1023" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_3Prep" type="checkbox" data-field-name="Check Box 3010" on:change="{onClick}"/>
                        <input id="spell1_3" type="text" value="" data-field-name="Spells 1024" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_4Prep" type="checkbox" data-field-name="Check Box 3011" on:change="{onClick}"/>
                        <input id="spell1_4" type="text" value="" data-field-name="Spells 1025" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_5Prep" type="checkbox" data-field-name="Check Box 3012" on:change="{onClick}"/>
                        <input id="spell1_5" type="text" value="" data-field-name="Spells 1026" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_6Prep" type="checkbox" data-field-name="Check Box 3013" on:change="{onClick}"/>
                        <input id="spell1_6" type="text" value="" data-field-name="Spells 1027" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_7Prep" type="checkbox" data-field-name="Check Box 3014" on:change="{onClick}"/>
                        <input id="spell1_7" type="text" value="" data-field-name="Spells 1028" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_8Prep" type="checkbox" data-field-name="Check Box 3015" on:change="{onClick}"/>
                        <input id="spell1_8" type="text" value="" data-field-name="Spells 1029" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_9Prep" type="checkbox" data-field-name="Check Box 3016" on:change="{onClick}"/>
                        <input id="spell1_9" type="text" value="" data-field-name="Spells 1030" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_10Prep" type="checkbox" data-field-name="Check Box 3017" on:change="{onClick}"/>
                        <input id="spell1_10" type="text" value="" data-field-name="Spells 1031" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_11Prep" type="checkbox" data-field-name="Check Box 3018" on:change="{onClick}"/>
                        <input id="spell1_11" type="text" value="" data-field-name="Spells 1032" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell1_12Prep" type="checkbox" data-field-name="Check Box 3019" on:change="{onClick}"/>
                        <input id="spell1_12" type="text" value="" data-field-name="Spells 1033" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots2_1" type="text" value="" data-field-name="SlotsTotal 20" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots2_2" type="text" value="" data-field-name="SlotsRemaining 20" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell2_1Prep" type="checkbox" data-field-name="Check Box 313" on:change="{onClick}"/>
                        <input id="spell2_1" type="text" value="" data-field-name="Spells 1046" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_2Prep" type="checkbox" data-field-name="Check Box 310" on:change="{onClick}"/>
                        <input id="spell2_2" type="text" value="" data-field-name="Spells 1034" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_3Prep" type="checkbox" data-field-name="Check Box 3020" on:change="{onClick}"/>
                        <input id="spell2_3" type="text" value="" data-field-name="Spells 1035" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_4Prep" type="checkbox" data-field-name="Check Box 3021" on:change="{onClick}"/>
                        <input id="spell2_4" type="text" value="" data-field-name="Spells 1036" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_5Prep" type="checkbox" data-field-name="Check Box 3022" on:change="{onClick}"/>
                        <input id="spell2_5" type="text" value="" data-field-name="Spells 1037" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_6Prep" type="checkbox" data-field-name="Check Box 3023" on:change="{onClick}"/>
                        <input id="spell2_6" type="text" value="" data-field-name="Spells 1038" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_7Prep" type="checkbox" data-field-name="Check Box 3024" on:change="{onClick}"/>
                        <input id="spell2_7" type="text" value="" data-field-name="Spells 1039" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_8Prep" type="checkbox" data-field-name="Check Box 3025" on:change="{onClick}"/>
                        <input id="spell2_8" type="text" value="" data-field-name="Spells 1040" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_9Prep" type="checkbox" data-field-name="Check Box 3026" on:change="{onClick}"/>
                        <input id="spell2_9" type="text" value="" data-field-name="Spells 1041" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_10Prep" type="checkbox" data-field-name="Check Box 3027" on:change="{onClick}"/>
                        <input id="spell2_10" type="text" value="" data-field-name="Spells 1042" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_11Prep" type="checkbox" data-field-name="Check Box 3028" on:change="{onClick}"/>
                        <input id="spell2_11" type="text" value="" data-field-name="Spells 1043" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_12Prep" type="checkbox" data-field-name="Check Box 3029" on:change="{onClick}"/>
                        <input id="spell2_12" type="text" value="" data-field-name="Spells 1044" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell2_13Prep" type="checkbox" data-field-name="Check Box 3030" on:change="{onClick}"/>
                        <input id="spell2_13" type="text" value="" data-field-name="Spells 1045" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots3_1" type="text" value="" data-field-name="SlotsTotal 21" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots3_2" type="text" value="" data-field-name="SlotsRemaining 21" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell3_1Prep" type="checkbox" data-field-name="Check Box 315" on:change="{onClick}"/>
                        <input id="spell3_1" type="text" value="" data-field-name="Spells 1048" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_2Prep" type="checkbox" data-field-name="Check Box 314" on:change="{onClick}"/>
                        <input id="spell3_2" type="text" value="" data-field-name="Spells 1047" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_3Prep" type="checkbox" data-field-name="Check Box 3031" on:change="{onClick}"/>
                        <input id="spell3_3" type="text" value="" data-field-name="Spells 1049" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_4Prep" type="checkbox" data-field-name="Check Box 3032" on:change="{onClick}"/>
                        <input id="spell3_4" type="text" value="" data-field-name="Spells 1050" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_5Prep" type="checkbox" data-field-name="Check Box 3033" on:change="{onClick}"/>
                        <input id="spell3_5" type="text" value="" data-field-name="Spells 1051" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_6Prep" type="checkbox" data-field-name="Check Box 3034" on:change="{onClick}"/>
                        <input id="spell3_6" type="text" value="" data-field-name="Spells 1052" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_7Prep" type="checkbox" data-field-name="Check Box 3035" on:change="{onClick}"/>
                        <input id="spell3_7" type="text" value="" data-field-name="Spells 1053" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_8Prep" type="checkbox" data-field-name="Check Box 3036" on:change="{onClick}"/>
                        <input id="spell3_8" type="text" value="" data-field-name="Spells 1054" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_9Prep" type="checkbox" data-field-name="Check Box 3037" on:change="{onClick}"/>
                        <input id="spell3_9" type="text" value="" data-field-name="Spells 1055" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_10Prep" type="checkbox" data-field-name="Check Box 3038" on:change="{onClick}"/>
                        <input id="spell3_10" type="text" value="" data-field-name="Spells 1056" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_11Prep" type="checkbox" data-field-name="Check Box 3039" on:change="{onClick}"/>
                        <input id="spell3_11" type="text" value="" data-field-name="Spells 1057" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_12Prep" type="checkbox" data-field-name="Check Box 3040" on:change="{onClick}"/>
                        <input id="spell3_12" type="text" value="" data-field-name="Spells 1058" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell3_13Prep" type="checkbox" data-field-name="Check Box 3041" on:change="{onClick}"/>
                        <input id="spell3_13" type="text" value="" data-field-name="Spells 1059" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots4_1" type="text" value="" data-field-name="SlotsTotal 22" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots4_2" type="text" value="" data-field-name="SlotsRemaining 22" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell4_1Prep" type="checkbox" data-field-name="Check Box 317" on:change="{onClick}"/>
                        <input id="spell4_1" type="text" value="" data-field-name="Spells 1060" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_2Prep" type="checkbox" data-field-name="Check Box 316" on:change="{onClick}"/>
                        <input id="spell4_2" type="text" value="" data-field-name="Spells 1061" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_3Prep" type="checkbox" data-field-name="Check Box 3042" on:change="{onClick}"/>
                        <input id="spell4_3" type="text" value="" data-field-name="Spells 1062" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_4Prep" type="checkbox" data-field-name="Check Box 3043" on:change="{onClick}"/>
                        <input id="spell4_4" type="text" value="" data-field-name="Spells 1063" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_5Prep" type="checkbox" data-field-name="Check Box 3044" on:change="{onClick}"/>
                        <input id="spell4_5" type="text" value="" data-field-name="Spells 1064" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_6Prep" type="checkbox" data-field-name="Check Box 3045" on:change="{onClick}"/>
                        <input id="spell4_6" type="text" value="" data-field-name="Spells 1065" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_7Prep" type="checkbox" data-field-name="Check Box 3046" on:change="{onClick}"/>
                        <input id="spell4_7" type="text" value="" data-field-name="Spells 1066" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_8Prep" type="checkbox" data-field-name="Check Box 3047" on:change="{onClick}"/>
                        <input id="spell4_8" type="text" value="" data-field-name="Spells 1067" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_9Prep" type="checkbox" data-field-name="Check Box 3048" on:change="{onClick}"/>
                        <input id="spell4_9" type="text" value="" data-field-name="Spells 1068" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_10Prep" type="checkbox" data-field-name="Check Box 3049" on:change="{onClick}"/>
                        <input id="spell4_10" type="text" value="" data-field-name="Spells 1069" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_11Prep" type="checkbox" data-field-name="Check Box 3050" on:change="{onClick}"/>
                        <input id="spell4_11" type="text" value="" data-field-name="Spells 1070" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_12Prep" type="checkbox" data-field-name="Check Box 3051" on:change="{onClick}"/>
                        <input id="spell4_12" type="text" value="" data-field-name="Spells 1071" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell4_13Prep" type="checkbox" data-field-name="Check Box 3052" on:change="{onClick}"/>
                        <input id="spell4_13" type="text" value="" data-field-name="Spells 1072" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots5_1" type="text" value="" data-field-name="SlotsTotal 23" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots5_2" type="text" value="" data-field-name="SlotsRemaining 23" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell5_1Prep" type="checkbox" data-field-name="Check Box 319" on:change="{onClick}"/>
                        <input id="spell5_1" type="text" value="" data-field-name="Spells 1073" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell5_2Prep" type="checkbox" data-field-name="Check Box 318" on:change="{onClick}"/>
                        <input id="spell5_2" type="text" value="" data-field-name="Spells 1074" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell5_3Prep" type="checkbox" data-field-name="Check Box 3053" on:change="{onClick}"/>
                        <input id="spell5_3" type="text" value="" data-field-name="Spells 1075" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell5_4Prep" type="checkbox" data-field-name="Check Box 3054" on:change="{onClick}"/>
                        <input id="spell5_4" type="text" value="" data-field-name="Spells 1076" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell5_5Prep" type="checkbox" data-field-name="Check Box 3055" on:change="{onClick}"/>
                        <input id="spell5_5" type="text" value="" data-field-name="Spells 1077" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell5_6Prep" type="checkbox" data-field-name="Check Box 3056" on:change="{onClick}"/>
                        <input id="spell5_6" type="text" value="" data-field-name="Spells 1078" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell5_7Prep" type="checkbox" data-field-name="Check Box 3057" on:change="{onClick}"/>
                        <input id="spell5_7" type="text" value="" data-field-name="Spells 1079" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell5_8Prep" type="checkbox" data-field-name="Check Box 3058" on:change="{onClick}"/>
                        <input id="spell5_8" type="text" value="" data-field-name="Spells 1080" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell5_9Prep" type="checkbox" data-field-name="Check Box 3059" on:change="{onClick}"/>
                        <input id="spell5_9" type="text" value="" data-field-name="Spells 1081" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots6_1" type="text" value="" data-field-name="SlotsTotal 24" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots6_2" type="text" value="" data-field-name="SlotsRemaining 24" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell6_1Prep" type="checkbox" data-field-name="Check Box 321" on:change="{onClick}"/>
                        <input id="spell6_1" type="text" value="" data-field-name="Spells 1082" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell6_2Prep" type="checkbox" data-field-name="Check Box 320" on:change="{onClick}"/>
                        <input id="spell6_2" type="text" value="" data-field-name="Spells 1083" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell6_3Prep" type="checkbox" data-field-name="Check Box 3060" on:change="{onClick}"/>
                        <input id="spell6_3" type="text" value="" data-field-name="Spells 1084" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell6_4Prep" type="checkbox" data-field-name="Check Box 3061" on:change="{onClick}"/>
                        <input id="spell6_4" type="text" value="" data-field-name="Spells 1085" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell6_5Prep" type="checkbox" data-field-name="Check Box 3062" on:change="{onClick}"/>
                        <input id="spell6_5" type="text" value="" data-field-name="Spells 1086" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell6_6Prep" type="checkbox" data-field-name="Check Box 3063" on:change="{onClick}"/>
                        <input id="spell6_6" type="text" value="" data-field-name="Spells 1087" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell6_7Prep" type="checkbox" data-field-name="Check Box 3064" on:change="{onClick}"/>
                        <input id="spell6_7" type="text" value="" data-field-name="Spells 1088" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell6_8Prep" type="checkbox" data-field-name="Check Box 3065" on:change="{onClick}"/>
                        <input id="spell6_8" type="text" value="" data-field-name="Spells 1089" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell6_9Prep" type="checkbox" data-field-name="Check Box 3066" on:change="{onClick}"/>
                        <input id="spell6_9" type="text" value="" data-field-name="Spells 1090" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots7_1" type="text" value="" data-field-name="SlotsTotal 25" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots7_2" type="text" value="" data-field-name="SlotsRemaining 25" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell7_1Prep" type="checkbox" data-field-name="Check Box 323" on:change="{onClick}"/>
                        <input id="spell7_1" type="text" value="" data-field-name="Spells 1091" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell7_2Prep" type="checkbox" data-field-name="Check Box 322" on:change="{onClick}"/>
                        <input id="spell7_2" type="text" value="" data-field-name="Spells 1092" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell7_3Prep" type="checkbox" data-field-name="Check Box 3067" on:change="{onClick}"/>
                        <input id="spell7_3" type="text" value="" data-field-name="Spells 1093" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell7_4Prep" type="checkbox" data-field-name="Check Box 3068" on:change="{onClick}"/>
                        <input id="spell7_4" type="text" value="" data-field-name="Spells 1094" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell7_5Prep" type="checkbox" data-field-name="Check Box 3069" on:change="{onClick}"/>
                        <input id="spell7_5" type="text" value="" data-field-name="Spells 1095" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell7_6Prep" type="checkbox" data-field-name="Check Box 3070" on:change="{onClick}"/>
                        <input id="spell7_6" type="text" value="" data-field-name="Spells 1096" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell7_7Prep" type="checkbox" data-field-name="Check Box 3071" on:change="{onClick}"/>
                        <input id="spell7_7" type="text" value="" data-field-name="Spells 1097" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell7_8Prep" type="checkbox" data-field-name="Check Box 3072" on:change="{onClick}"/>
                        <input id="spell7_8" type="text" value="" data-field-name="Spells 1098" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell7_9Prep" type="checkbox" data-field-name="Check Box 3073" on:change="{onClick}"/>
                        <input id="spell7_9" type="text" value="" data-field-name="Spells 1099" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots8_1" type="text" value="" data-field-name="SlotsTotal 26" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots8_2" type="text" value="" data-field-name="SlotsRemaining 26" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell8_1Prep" type="checkbox" data-field-name="Check Box 325" on:change="{onClick}"/>
                        <input id="spell8_1" type="text" value="" data-field-name="Spells 10100" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell8_2Prep" type="checkbox" data-field-name="Check Box 324" on:change="{onClick}"/>
                        <input id="spell8_2" type="text" value="" data-field-name="Spells 10101" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell8_3Prep" type="checkbox" data-field-name="Check Box 3074" on:change="{onClick}"/>
                        <input id="spell8_3" type="text" value="" data-field-name="Spells 10102" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell8_4Prep" type="checkbox" data-field-name="Check Box 3075" on:change="{onClick}"/>
                        <input id="spell8_4" type="text" value="" data-field-name="Spells 10103" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell8_5Prep" type="checkbox" data-field-name="Check Box 3076" on:change="{onClick}"/>
                        <input id="spell8_5" type="text" value="" data-field-name="Spells 10104" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell8_6Prep" type="checkbox" data-field-name="Check Box 3077" on:change="{onClick}"/>
                        <input id="spell8_6" type="text" value="" data-field-name="Spells 10105" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell8_7Prep" type="checkbox" data-field-name="Check Box 3078" on:change="{onClick}"/>
                        <input id="spell8_7" type="text" value="" data-field-name="Spells 10106" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>

                        <input id="slots9_1" type="text" value="" data-field-name="SlotsTotal 27" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="slots9_2" type="text" value="" data-field-name="SlotsRemaining 27" on:blur="{onBlur}" on:drop="{onDrop}"/>
                        <input id="spell9_1Prep" type="checkbox" data-field-name="Check Box 327" on:change="{onClick}"/>
                        <input id="spell9_1" type="text" value="" data-field-name="Spells 10107" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell9_2Prep" type="checkbox" data-field-name="Check Box 326" on:change="{onClick}"/>
                        <input id="spell9_2" type="text" value="" data-field-name="Spells 10108" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell9_3Prep" type="checkbox" data-field-name="Check Box 3079" on:change="{onClick}"/>
                        <input id="spell9_3" type="text" value="" data-field-name="Spells 10109" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell9_4Prep" type="checkbox" data-field-name="Check Box 3080" on:change="{onClick}"/>
                        <input id="spell9_4" type="text" value="" data-field-name="Spells 101010" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell9_5Prep" type="checkbox" data-field-name="Check Box 3081" on:change="{onClick}"/>
                        <input id="spell9_5" type="text" value="" data-field-name="Spells 101011" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell9_6Prep" type="checkbox" data-field-name="Check Box 3082" on:change="{onClick}"/>
                        <input id="spell9_6" type="text" value="" data-field-name="Spells 101012" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <input id="spell9_7Prep" type="checkbox" data-field-name="Check Box 3083" on:change="{onClick}"/>
                        <input id="spell9_7" type="text" value="" data-field-name="Spells 101013" class="popup-left" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
                        <!-- End Form Data -->
                    
                        
                    </div>
                    {#each spellinfoPopups as popup}
                        {#if popup.showing}
                            <div class="popup-wrapper" style="top: {popup.target.offsetTop - 234.5}px; {(popup.left ? "left: " + (popup.target.offsetLeft - 320) + "px" : "right: " + (popup.target.offsetLeft + 240) + "px")}; color: {$characterSheets == "dark" ? "white" : "black"} !important;">
                                <style>
                                    a {
                                        color: var(--primary);
                                    }

                                    p {
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