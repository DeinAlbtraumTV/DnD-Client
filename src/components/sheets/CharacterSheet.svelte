<script>
    import { onMount } from "svelte";
    import { characters, socket, playerInfo } from "../../stores/nonPersistentStore"
    import { currentCharacter, characterSheets, sessionCode } from "../../stores/persistentSettingsStore"
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
                switch (elem.type) {
                    case "number":
                        elem.value = Number.parseInt(value)
                        break;
                    default:
                        elem.value = value
                }
            }
        })

        $playerInfo.initiativeModifier = Number.parseInt($characters[$currentCharacter].sheet.initiative) || 0
    }

    function onDrop() {
        return false;
    }

    function onBlur(event) {
        $characters[$currentCharacter].sheet[event.target.getAttribute("id")] = event.target.value

        //Field-specific actions
        switch (event.target.getAttribute("id")) {
            case "initiative": {
                let initiative = Number.parseInt(event.target.value)

                if (isNaN(initiative)) {
                    initiative = 0
                }

                $playerInfo.initiativeModifier = initiative;
                $socket.emit("updateInitiativeModifier", { session_code: $sessionCode, initiativeModifier: initiative} );
            }
        }

        window.characters.storeSheets(JSON.stringify($characters))
    }

    function onClick(event) {
        $characters[$currentCharacter].sheet[event.target.getAttribute("id")] = event.target.checked
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

    .dark .t, .dark input, .dark textarea {
        color: white;
    }

    input:focus, textarea:focus {
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

                        <!-- Begin page background -->
                        <div id="pg1" style="-webkit-user-select: none; user-select: none;">
                            <InlineSVG id="pageBackground" src="sheets/assets/characterSheet/1.svg" aria-label="Page Background" width="935" height="1210" style="width:935px; height:1210px; -moz-transform:scale(1); transform: scale(1); z-index: 0; outline: none;"></InlineSVG>
                        </div>
                        <!-- End page background -->

                        <!-- Begin text definitions (Positioned/styled in CSS) -->
                        <div id="text_race" class="t s1">RACE</div>
                        <div id="text_class" class="t s1">CLASS &amp; LEVEL</div>
                        <div id="text_pname" class="t s1">PLAYER NAME</div>
                        <div id="text_cname" class="t s1">CHARACTER NAME</div>
                        <div id="text_background" class="t s1">BACKGROUND</div>
                        <div id="text_xp" class="t s1">EXPERIENCE POINTS</div>
                        <div id="text_alignment" class="t s1">ALIGNMENT</div>
                        <div id="text_copyright1" class="t s2">TM &amp; © 2014 Wizards of the Coast LLC. Permission is granted to photocopy this document for personal use.</div>
                        <div id="text_hpMax" class="t s3">Hit Point Maximum</div>
                        <div id="text_str" class="t s1">Strength</div>
                        <div id="text_dex" class="t s1">Dexterity</div>
                        <div id="text_con" class="t s1">Constitution</div>
                        <div id="text_int" class="t s1">Intelligence</div>
                        <div id="text_wis" class="t s1">Wisdom</div>
                        <div id="text_cha" class="t s1">Charisma</div>
                        <div id="text_cp" class="t s4">CP</div>
                        <div id="text_ep" class="t s4">EP</div>
                        <div id="text_pp" class="t s4">PP</div>
                        <div id="text_gp" class="t s4">GP</div>
                        <div id="text_sp" class="t s4">SP</div>
                        <div id="text_passive" class="t s5">PASSIVE WISDOM (PERCEPTION)</div>
                        <div id="text_equipment" class="t s6">EQUIPMENT</div>
                        <div id="text_profs" class="t s6">OTHER PROFICIENCIES &amp; LANGUAGES</div>
                        <div id="text_atk" class="t s6">ATTACKS &amp; SPELLCASTING</div>
                        <div id="text_features" class="t s6">FEATURES &amp; TRAITS</div>
                        <div id="text_arcobatics" class="t s1">Acrobatics </div>
                        <div id="text_dex2" class="t s7">(Dex)</div>
                        <div id="text_animal" class="t s1">Animal Handling </div>
                        <div id="text_wis2" class="t s7">(Wis)</div>
                        <div id="text_arcana" class="t s1">Arcana </div>
                        <div id="text_int2" class="t s7">(Int)</div>
                        <div id="text_athletics" class="t s1">Athletics </div>
                        <div id="text_str2" class="t s7">(Str)</div>
                        <div id="text_deception" class="t s1">Deception </div>
                        <div id="text_cha2" class="t s7">(Cha)</div>
                        <div id="text_history" class="t s1">History </div>
                        <div id="text_int3" class="t s7">(Int)</div>
                        <div id="text_insight" class="t s1">Insight </div>
                        <div id="text_wis3" class="t s7">(Wis)</div>
                        <div id="text_intimidation" class="t s1">Intimidation </div>
                        <div id="text_cha3" class="t s7">(Cha)</div>
                        <div id="text_investigation" class="t s1">Investigation </div>
                        <div id="text_int4" class="t s7">(Int)</div>
                        <div id="text_medicine" class="t s1">Medicine </div>
                        <div id="text_wis4" class="t s7">(Wis)</div>
                        <div id="text_nature" class="t s1">Nature </div>
                        <div id="text_int5" class="t s7">(Int)</div>
                        <div id="text_perception" class="t s1">Perception </div>
                        <div id="text_wis5" class="t s7">(Wis)</div>
                        <div id="text_performance" class="t s1">Performance </div>
                        <div id="text_cha4" class="t s7">(Cha)</div>
                        <div id="text_persuasion" class="t s1">Persuasion </div>
                        <div id="text_cha5" class="t s7">(Cha)</div>
                        <div id="text_religion" class="t s1">Religion </div>
                        <div id="text_int6" class="t s7">(Int)</div>
                        <div id="text_sleightOfHand" class="t s1">Sleight of Hand </div>
                        <div id="text_dex3" class="t s7">(Dex)</div>
                        <div id="text_stealth" class="t s1">Stealth </div>
                        <div id="text_dex4" class="t s7">(Dex)</div>
                        <div id="text_survival" class="t s1">Survival </div>
                        <div id="text_wis6" class="t s7">(Wis)</div>
                        <div id="text_deathSaves" class="t s5">DEATH SAVES</div>
                        <div id="text_hitDice" class="t s5">HIT DICE</div>
                        <div id="text_weapon_name" class="t s4">NAME</div>
                        <div id="text_atkBonus" class="t s4">ATK BONUS</div>
                        <div id="text_damage" class="t s4">DAMAGE/TYPE</div>
                        <div id="text_total" class="t s3">Total</div>
                        <div id="text_successes" class="t s5">SUCCESSES</div>
                        <div id="text_failures" class="t s5">FAILURES</div>
                        <div id="text_ideals" class="t s5">IDEALS</div>
                        <div id="text_bonds" class="t s5">BONDS</div>
                        <div id="text_flaws" class="t s5">FLAWS</div>
                        <div id="text_traits" class="t s5">PERSONALITY TRAITS</div>
                        <div id="text_armor" class="t s6">ARMOR</div>
                        <div id="text_class2" class="t s6">CLASS</div>
                        <div id="text_hpCurrent" class="t s6">CURRENT HIT POINTS</div>
                        <div id="text_hpTemp" class="t s6">TEMPORARY HIT POINTS</div>
                        <div id="text_initiative" class="t s6">INITIATIVE</div>
                        <div id="text_speed" class="t s6">SPEED</div>
                        <div id="text_profBonus" class="t s8">PROFICIENCY BONUS</div>
                        <div id="text_str3" class="t s6">STRENGTH</div>
                        <div id="text_dex5" class="t s6">DEXTERITY</div>
                        <div id="text_con2" class="t s6">CONSTITUTION</div>
                        <div id="text_int7" class="t s6">INTELLIGENCE</div>
                        <div id="text_wis7" class="t s6">WISDOM</div>
                        <div id="text_cha6" class="t s6">CHARISMA</div>
                        <div id="text_saves" class="t s6">SAVING THROWS</div>
                        <div id="text_inspiration" class="t s8">INSPIRATION</div>
                        <div id="text_skills" class="t s6">SKILLS</div>
                        <!-- End text definitions -->

                        <!-- Begin Form Data -->
                        <input id="charactername" type="text" data-field-name="CharacterName" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="class" type="text" data-field-name="ClassLevel" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="background" type="text" data-field-name="Background" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="playername" type="text" data-field-name="PlayerName" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="race" type="text" data-field-name="Race " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="alignment" type="text" data-field-name="Alignment" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="xp" type="text" data-field-name="XP" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="strMod" type="text" data-field-name="STR" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="str" type="text" data-field-name="STRmod" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="dexMod" type="text" data-field-name="DEX" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="dex" type="text" data-field-name="DEXmod " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="conMod" type="text" data-field-name="CON" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="con" type="text" data-field-name="CONmod" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="intMod" type="text" data-field-name="INT" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="int" type="text" data-field-name="INTmod" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wisMod" type="text" data-field-name="WIS" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wis" type="text" data-field-name="WISmod" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="chaMod" type="text" data-field-name="CHA" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="cha" type="text" data-field-name="CHamod" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="inspiration" type="text" data-field-name="Inspiration" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="proficiency" type="text" data-field-name="ProfBonus" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="strSaveProf" type="checkbox" data-field-name="Check Box 11" on:change="{onClick}"/>
                        <input id="strSave" type="text" data-field-name="ST Strength" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="dexSaveProf" type="checkbox" data-field-name="Check Box 18" on:change="{onClick}"/>
                        <input id="dexSave" type="text" data-field-name="ST Dexterity" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="conSaveProf" type="checkbox" data-field-name="Check Box 19" on:change="{onClick}"/>
                        <input id="conSave" type="text" data-field-name="ST Constitution" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="intSaveProf" type="checkbox" data-field-name="Check Box 20" on:change="{onClick}"/>
                        <input id="intSave" type="text" data-field-name="ST Intelligence" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wisSaveProf" type="checkbox" data-field-name="Check Box 21" on:change="{onClick}"/>
                        <input id="wisSave" type="text" data-field-name="ST Wisdom" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="chaSaveProf" type="checkbox" data-field-name="Check Box 22" on:change="{onClick}"/>
                        <input id="chaSave" type="text" data-field-name="ST Charisma" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="acrobaticsProf" type="checkbox" data-field-name="Check Box 23" on:change="{onClick}"/>
                        <input id="acrobatics" type="text" data-field-name="Acrobatics" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="animalProf" type="checkbox" data-field-name="Check Box 24" on:change="{onClick}"/>
                        <input id="animal" type="text" data-field-name="Animal" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="arcanaProf" type="checkbox" data-field-name="Check Box 25" on:change="{onClick}"/>
                        <input id="arcana" type="text" data-field-name="Arcana" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="athleticsProf" type="checkbox" data-field-name="Check Box 26" on:change="{onClick}"/>
                        <input id="athletics" type="text" data-field-name="Athletics" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="deceptionProf" type="checkbox" data-field-name="Check Box 27" on:change="{onClick}"/>
                        <input id="deception" type="text" data-field-name="Deception " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="historyProf" type="checkbox" data-field-name="Check Box 28" on:change="{onClick}"/>
                        <input id="history" type="text" data-field-name="History " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="insightProf" type="checkbox" data-field-name="Check Box 29" on:change="{onClick}"/>
                        <input id="insight" type="text" data-field-name="Insight" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="intimidationProf" type="checkbox" data-field-name="Check Box 30" on:change="{onClick}"/>
                        <input id="intimidation" type="text" data-field-name="Intimidation" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="investigationProf" type="checkbox" data-field-name="Check Box 31" on:change="{onClick}"/>
                        <input id="investigation" type="text" data-field-name="Investigation " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="medicineProf" type="checkbox" data-field-name="Check Box 32" on:change="{onClick}"/>
                        <input id="medicine" type="text" data-field-name="Medicine" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="natureProf" type="checkbox" data-field-name="Check Box 33" on:change="{onClick}"/>
                        <input id="nature" type="text" data-field-name="Nature" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="perceptionProf" type="checkbox" data-field-name="Check Box 34" on:change="{onClick}"/>
                        <input id="perception" type="text" data-field-name="Perception " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="performanceProf" type="checkbox" data-field-name="Check Box 35" on:change="{onClick}"/>
                        <input id="performance" type="text" data-field-name="Performance" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="persuasionProf" type="checkbox" data-field-name="Check Box 36" on:change="{onClick}"/>
                        <input id="persuasion" type="text" data-field-name="Persuasion" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="religionProf" type="checkbox" data-field-name="Check Box 37" on:change="{onClick}"/>
                        <input id="religion" type="text" data-field-name="Religion" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="sleightOfHandProf" type="checkbox" data-field-name="Check Box 38" on:change="{onClick}"/>
                        <input id="sleightOfHand" type="text" data-field-name="SleightofHand" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="stealthProf" type="checkbox" data-field-name="Check Box 39" on:change="{onClick}"/>
                        <input id="stealth" type="text" data-field-name="Stealth " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="survivalProf" type="checkbox" data-field-name="Check Box 40" on:change="{onClick}"/>
                        <input id="survival" type="text" data-field-name="Survival" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="passivePerception" type="text" data-field-name="Passive" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="ac" type="text" data-field-name="AC" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="initiative" type="text" data-field-name="Initiative" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="speed" type="text" data-field-name="Speed" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="hpMax" type="text" data-field-name="HPMax" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="hpCurrent" type="text" data-field-name="HPCurrent" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="hpTemp" type="text" data-field-name="HPTemp" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="hitDiceTotal" type="text" data-field-name="HDTotal" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="hitDice" type="text" data-field-name="HD" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="success1" type="checkbox" data-field-name="Check Box 12" on:change="{onClick}"/>
                        <input id="success2" type="checkbox" data-field-name="Check Box 13" on:change="{onClick}"/>
                        <input id="success3" type="checkbox" data-field-name="Check Box 14" on:change="{onClick}"/>
                        <input id="failure1" type="checkbox" data-field-name="Check Box 15" on:change="{onClick}"/>
                        <input id="failure2" type="checkbox" data-field-name="Check Box 16" on:change="{onClick}"/>
                        <input id="failure3" type="checkbox" data-field-name="Check Box 17" on:change="{onClick}"/>

                        <input id="wpnName1" type="text" data-field-name="Wpn Name" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wpnAtk1" type="text" data-field-name="Wpn1 AtkBonus" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wpnDmg1" type="text" data-field-name="Wpn1 Damage" on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="wpnName2" type="text" data-field-name="Wpn Name 2" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wpnAtk2" type="text" data-field-name="Wpn2 AtkBonus " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wpnDmg2" type="text" data-field-name="Wpn2 Damage " on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <input id="wpnName3" type="text" data-field-name="Wpn Name 3" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wpnAtk3" type="text" data-field-name="Wpn3 AtkBonus  " on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="wpnDmg3" type="text" data-field-name="Wpn3 Damage " on:drop="{onDrop}" on:blur="{onBlur}"/>

                        <textarea id="attacksSpells" data-field-name="AttacksSpellcasting" on:drop="{onDrop}" on:blur="{onBlur}"></textarea>

                        <textarea id="traits" data-field-name="PersonalityTraits " on:drop="{onDrop}" on:blur="{onBlur}"></textarea>
                        <textarea id="ideals" data-field-name="Ideals" on:drop="{onDrop}" on:blur="{onBlur}"></textarea>
                        <textarea id="bonds" data-field-name="Bonds" on:drop="{onDrop}" on:blur="{onBlur}"></textarea>
                        <textarea id="flaws" data-field-name="Flaws" on:drop="{onDrop}" on:blur="{onBlur}"></textarea>

                        <textarea id="langs" data-field-name="ProficienciesLang" on:drop="{onDrop}" on:blur="{onBlur}"></textarea>

                        <input id="cp" type="text" data-field-name="CP" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="sp" type="text" data-field-name="SP" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="ep" type="text" data-field-name="EP" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="gp" type="text" data-field-name="GP" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        <input id="pp" type="text" data-field-name="PP" on:drop="{onDrop}" on:blur="{onBlur}"/>
                        
                        <textarea id="equipment" data-field-name="Equipment" on:drop="{onDrop}" on:blur="{onBlur}"></textarea>
                        <textarea id="features" data-field-name="Features and Traits" on:drop="{onDrop}" on:blur="{onBlur}"></textarea>
                        <!-- End Form Data -->

                    </div>
                </div>
            </div>
        </div>
    </form>
</div>