<!-- @migration-task Error while migrating Svelte code: `<tr>` cannot be a child of `<table>`. `<table>` only allows these children: `<caption>`, `<colgroup>`, `<tbody>`, `<thead>`, `<tfoot>`, `<style>`, `<script>`, `<template>`. The browser will 'repair' the HTML (by moving, removing, or inserting elements) which breaks Svelte's assumptions about the structure of your components.
https://svelte.dev/e/node_invalid_placement -->
<script lang="ts">
    import { localStorageStore } from "../stores/localStorageStore.js"
    import { backgroundColor, backgroundImage, backgroundImageSize, backgroundOverlay, backgroundOverlayOpacity, backgroundPosition, primaryColor, characterSheets, sessionCode, currentCharacter } from "../stores/persistentSettingsStore.js"
    import { socket, session, characters, playerInfo, PlayerData, sheetModules } from "../stores/nonPersistentStore.js"
    import { generateName } from "../util/nameGenerator.js";

    let settingsOpened = false
    let activeSettingsCategory = 0
    let mapLink = ""

    let players:Map<string, PlayerData> = new Map<string, PlayerData>()

    let dummyAddData = {
        name: "Dummy",
        initiativeModifier: 0
    }

    $socket.on("connect", () => {
        console.log("Connected to websocket server")
        
        $socket.emit("sync", { session_code: $sessionCode }, (callback: any) => {
            if (callback.session_exists) {
                joinSession()
            } else {
                $session = undefined
                $sessionCode = ""
            }
        })
    })

    $socket.on("disconnect", () => {
        $sessionCode = ""
        $session = undefined
        players = new Map<string, PlayerData>()
        console.log("Lost connection to server!")
    })

    $socket.on("assignDm", () => {
        if ($session) {
            $session.role = "Dungeon Master"
            $session.dm = true
            mapLink = $session.url
        }
    })

    $socket.on("addPlayer", (data: any) => {
        players.set(data.player, {
            name: data.playerName,
            initiative: data.initiative ?? 0,
            initiativeModifier: Number.parseInt(data.initiativeModifier ?? 0),
            isDummy: data.isDummy
        })

        players = players
    })

    $socket.on("removePlayer", (data: any) => {
        players.delete(data.player)

        players = players
    })

    $socket.on("syncPlayerData", () => {
        if ($session) {
            $socket.emit("syncPlayerData",
                { session_code: $sessionCode, playerName: $localStorageStore.playerName, initiative: $playerInfo.initiative, initiativeModifier: ($characters[$currentCharacter] ? $characters[$currentCharacter].sheet["initiative"] : 0) }
            )
        }
    })

    $socket.on("updateInitiative", (data: any) => {
        if (players.has(data.player)) {
            players.set(data.player, {
                name: players.get(data.player)?.name || "",
                initiative: data.initiative,
                initiativeModifier: players.get(data.player)?.initiativeModifier || 0,
                isDummy: players.get(data.player)?.isDummy || false
            })

            players = players
        }

        if ($socket.id == data.player) {
            $playerInfo.initiative = data.initiative
        }
    })

    $socket.on("updateInitiativeModifier", (data: any) => {
        if (players.has(data.player)) {
            players.set(data.player, {
                name: players.get(data.player)?.name || "",
                initiative: players.get(data.player)?.initiative || 0,
                initiativeModifier: data.initiativeModifier,
                isDummy: players.get(data.player)?.isDummy || false
            })

            players = players
        }

        if ($socket.id == data.player) {
            $playerInfo.initiativeModifier = data.initiativeModifier
        }
    })

    function select(event:FocusEvent & {currentTarget: EventTarget & HTMLInputElement;}) {
        event.currentTarget.select()
    }

    function createSession() {
        if ($session) {
            leaveSession()
        }

        $socket.emit("createSession", (callback: any) => {
            if (callback && callback.session_code) {
                $session = {
                    code: callback.session_code,
                    role: "Dungeon Master",
                    dm: true,
                    url: ""
                }

                $sessionCode = callback.session_code
                players = new Map<string, PlayerData>()
                rollInitiativeForMe()
                console.log("Created session", $sessionCode)
            }
        })
    }

    function joinSession() {
        if ($session) {
            $socket.emit("leaveSession", { session_code: $session.code }, (callback: any) => {
                if (callback && callback.left) {
                    $session = undefined
                    players = new Map<string, PlayerData>()
                    console.log("Left session", $sessionCode)
                }
            })
        }

        $socket.emit("joinSession", { session_code: $sessionCode, playerName: $localStorageStore.playerName, initiative: $playerInfo.initiative, initiativeModifier: ($characters[$currentCharacter] ? $characters[$currentCharacter].sheet["initiative"] : 0) }, (callback: any) => {
            if (callback && callback.joined) {
                $session = {
                    code: $sessionCode,
                    role: "Player",
                    url: callback.url,
                    dm: false
                }
                players = new Map<string, PlayerData>()
                rollInitiativeForMe()
                console.log("Joined session", $sessionCode)
            } else {
                $sessionCode = ""
                console.log("Failed to join session:", callback.status)
            }
        })
    }

    function leaveSession() {
        if (!$session) return

        $socket.emit("leaveSession", { session_code: $session.code }, (callback: any) => {
            if (callback && callback.left) {
                $session = undefined
                $sessionCode = ""
                players = new Map<string, PlayerData>()
                console.log("Left session", sessionCode)
            }
        })
    }

    function loadMapForSelf() {
        if (!mapLink.startsWith("http://") && !mapLink.startsWith("https://")) {
            mapLink = "https://" + mapLink
        }
        
        if ($session) {
            $session.url = mapLink
        }
    }

    function loadMapForAll() {
        if (!mapLink.startsWith("http://") && !mapLink.startsWith("https://")) {
            mapLink = "https://" + mapLink
        }
        if ($session) {
            $session.url = mapLink

            $socket.emit("loadMap", { url: mapLink, session_code: $session.code })
        }
    }

    function transferDm(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
        let target = event.currentTarget
        let parent = target.parentElement

        let player = parent?.getAttribute("data-player-id")

        if ($session) {
            $socket.emit("transferDm", { player: player, session_code: $session.code })

            $session.dm = false
            $session.role = "Player"
        }

        players = new Map<string, PlayerData>()
    }

    function rollInitiativeForMe() {
        if ($session) {
            let rand = Math.floor(Math.random() * 20) + 1;
            $playerInfo.initiative = rand;
            $socket.emit("updateInitiative", { player: $socket.id, session_code: $session.code, initiative: rand })
        }
    }

    function rollInitiativeForPlayer(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
        if ($session) {
            let target = event.currentTarget
            let parent = target.parentElement

            let player = parent?.getAttribute("data-player-id")

            if (!player) return

            let rand = Math.floor(Math.random() * 20) + 1

            let playerData = players.get(player)

            if (!playerData) return

            players.set(player, {
                name: playerData.name,
                initiative: rand,
                initiativeModifier: playerData.initiativeModifier,
                isDummy: playerData.isDummy
            })

            players = players

            $socket.emit("updateInitiative", { player: player, session_code: $session.code, initiative: rand })
        }
    }

    function rollInitiativeForAll() {
        if ($session) {
            for (let [key, value] of players) {
                let rand = Math.floor(Math.random() * 20) + 1

                players.set(key, {
                    name: value.name,
                    initiative: rand,
                    initiativeModifier: value.initiativeModifier,
                    isDummy: value.isDummy
                })

                $socket.emit("updateInitiative", { player: key, session_code: $session.code, initiative: rand })
            }
            
            players = players

            rollInitiativeForMe()
        }
    }

    function addDummyToInitiativeTracker() {
        if ($session) {
            let dummyId = Math.random().toString(36).substring(2, 11)

            let rand = Math.floor(Math.random() * 20) + 1

            players.set(dummyId, {
                name: dummyAddData.name,
                initiative: rand,
                initiativeModifier: dummyAddData.initiativeModifier,
                isDummy: true
            })

            players = players

            $socket.emit("addDummy", { dummyId: dummyId, name: dummyAddData.name, session_code: $session.code, initiative: rand, initiativeModifier: dummyAddData.initiativeModifier })

            dummyAddData = {
                name: "Dummy",
                initiativeModifier: 0
            }
        }
    }

    function removeDummy(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
        let target = event.currentTarget
        let parent = target.parentElement

        let player = parent?.getAttribute("data-player-id")

        if (!player) return

        if ($session) {
            players.delete(player)

            players = players

            $socket.emit("removeDummy", { player: player, session_code: $session.code })
        }
    }

    function onPlayernameBlur() {
        if ((!$localStorageStore.playerName || $localStorageStore.playerName == "") &&
			document.activeElement != document.getElementById("playerName") &&
			document.activeElement != document.getElementById("playerName_settings")) {
			$localStorageStore.playerName = generateName()
		}
    }
</script>

<div id="sidebar-container">
    <div id="sidebar-content-container">
        <div id="dungeonControlRoom-container">
            <div id="sessionControls">
                <form on:submit|preventDefault>
                    <p id="sessionRole-indicator">Your role: {$session ? $session.role : "none"}</p>
                    <div class="dungeonControlRoom-inputRow">
                        <p class="dungeonControlRoom-inlineText">Join a Session:</p>
                        <input class="dungeonControlRoom-input input boxShadow" type="text" bind:value="{$sessionCode}">
                    </div>
                    <div class="dungeonControlRoom-inputRow">
                        <button class="dungeonControlRoom-button" on:click="{createSession}">Create Session</button>
                        <button class="dungeonControlRoom-button" on:click="{joinSession}">Join Session</button>
                        <button class="dungeonControlRoom-button" disabled="{!$session}" on:click="{leaveSession}">Leave Session</button>
                    </div>
                </form>
                {#if $session}
                <form on:submit|preventDefault>
                    {#if $session.dm}
                    <p class="dungeonControlRoom-text">Dungeon Control Room</p>
                    <div class="dungeonControlRoom-inputRow">
                        <p class="dungeonControlRoom-inlineText">Load a map:</p>
                        <input class="dungeonControlRoom-input input boxShadow" type="text" bind:value="{mapLink}">
                    </div>
                    <div class="dungeonControlRoom-inputRow">
                        <button class="dungeonControlRoom-button" on:click="{loadMapForSelf}">Load Map for yourself</button>
                        <button class="dungeonControlRoom-button" on:click="{loadMapForAll}">Load Map for everyone</button>
                    </div>
                    {/if}
                    <div class="playerList">
                        <p class="dungeonControlRoom-text">Players in the session:</p>
                        {#each [...players] as [key, value]}
                            {#if !value.isDummy}
                                <div class="dungeonControlRoom-inputRow" data-player-id="{key}">
                                    <p class="dungeonControlRoom-inlineText">{value.name}</p>
                                    {#if $session.dm}
                                        <button class="dungeonControlRoom-button" on:click="{transferDm}">Make DM</button>
                                    {/if}
                                </div>
                            {/if}
                        {/each}
                    </div>
                </form>
                {/if}
            </div>
        </div>
        <div id="initiativeTracker-container">
            {#if $session}
                <form on:submit|preventDefault>
                    <p class="dungeonControlRoom-text" id="initiativeTrackerTitle">Initiative Tracker</p>
                    <div class="dungeonControlRoom-inputRow">
                        {#if $session.dm}
                            <button class="dungeonControlRoom-button" on:click={rollInitiativeForAll}>Roll for everyone</button>
                        {/if}
                        <button class="dungeonControlRoom-button" on:click={rollInitiativeForMe}>Roll for me</button>
                    </div>
                    {#if $session.dm}
                        <div class="sidebar-subgroup">
                            <p class="dungeonControlRoom-text">Add a dummy</p>
                            <div class="dungeonControlRoom-inputRow">
                                <p class="dungeonControlRoom-inlineText">Initiative Modifier:</p>
                                <input id="dummyInitiativeModifierInput" class="dungeonControlRoom-input input boxShadow" type="number" placeholder="Initiative Modifier" bind:value={dummyAddData.initiativeModifier}>
                            </div>
                            <div class="dungeonControlRoom-inputRow">
                                <p class="dungeonControlRoom-inlineText">Name:</p>
                                <input class="dungeonControlRoom-input input boxShadow" type="text" placeholder="Name" bind:value={dummyAddData.name}>
                            </div>
                            <div class="dungeonControlRoom-inputRow">
                                <button class="dungeonControlRoom-button" on:click={addDummyToInitiativeTracker}>Add</button>
                            </div>
                        </div>
                    {/if}
                    <div class="playerList" id="initiativeList">
                        <p class="playerName">{$localStorageStore.playerName}: {$playerInfo.initiative + $playerInfo.initiativeModifier} ({$playerInfo.initiative} + {$playerInfo.initiativeModifier})</p>
                        {#each [...players] as [key, value]}
                            <div class="dungeonControlRoom-inputRow" data-player-id="{key}">
                                <p class="dungeonControlRoom-inlineText">{value.name}: {value.initiative + value.initiativeModifier} ({value.initiative} + {value.initiativeModifier})</p>
                                {#if $session.dm}
                                    <button class="dungeonControlRoom-button" on:click="{rollInitiativeForPlayer}">Roll</button>
                                    {#if value.isDummy}
                                        <button class="dungeonControlRoom-button" on:click="{removeDummy}">Remove</button>
                                    {/if}
                                {/if}
                            </div>
                        {/each}
                    </div>
                </form>
            {/if}
        </div>
        <div id="playerInfo-container">
            <input id="playerName" placeholder="Username" type="text" class="input boxShadow" on:blur={onPlayernameBlur} bind:value="{$localStorageStore.playerName}"/>
            <button id="settings-button" on:click="{() => {settingsOpened = !settingsOpened}}"><i class="fas fa-cog"></i></button>
        </div>
    </div>
    <div id="content-container" class="">
        <slot></slot>
    </div>
</div>
<div id="settings-container" class:opened="{settingsOpened}">
    <div id="settings">
        <button id="closeSettings-button" on:click="{() => {settingsOpened = !settingsOpened}}"><i class="far fa-times-circle"></i></button>
        <div id="category-wrapper">
            <div id="category-selector">
                <hr>
                <div class="settings-category-title">General Settings</div>
                <div class="category-button" on:keydown={(event) => {if (event.key == "Enter") activeSettingsCategory = 0}} on:click="{() => {activeSettingsCategory = 0}}" class:active="{activeSettingsCategory == 0}">User Settings</div>
                <hr>
                <div class="settings-category-title">App Settings</div>
                <div class="category-button" on:keydown={(event) => {if (event.key == "Enter") activeSettingsCategory = 1}} on:click="{() => {activeSettingsCategory = 1}}" class:active="{activeSettingsCategory == 1}">Appearance</div>
                <div class="category-button" on:keydown={(event) => {if (event.key == "Enter") activeSettingsCategory = 2}} on:click="{() => {activeSettingsCategory = 2}}" class:active="{activeSettingsCategory == 2}">Modules</div>
            </div>
            <div id="category-container">
                <div id="user-settings" class="settings-category" class:active="{activeSettingsCategory == 0}">
                    <h2>User Settings</h2>
                    <div class="input-wrapper">
                        <p>Username:</p>
                        <input id="playerName_settings" placeholder="Username" type="text" class="input" on:blur={onPlayernameBlur} bind:value="{$localStorageStore.playerName}"/>
                    </div>
                </div>
                <div id="appearance" class="settings-category" class:active="{activeSettingsCategory == 1}">
                    <h2>Appearance</h2>
                    <div class="input-wrapper">
                        <p>Primary Color:</p>
                        <input type="color" id="primaryColor-input" class="input color" bind:value="{$primaryColor}">
                    </div>
                    <div class="input-wrapper">
                        <p>Background Color:</p>
                        <input type="color" id="backgroundColor-input" class="input color" bind:value="{$backgroundColor}">
                    </div>
                    <div class="input-wrapper">
                        <p>Background Overlay:</p>
                        <div class="double-input-wrapper">
                            <input type="color" id="backgroundOverlay-input" class="input color" bind:value="{$backgroundOverlay}">
                            <p>Overlay Transparency:</p>
                            <input type="range" min="0" max="255" id="backgroundOverlayOpacity-input" class="input slider" bind:value="{$backgroundOverlayOpacity}">
                        </div>
                    </div>
                    <div class="input-wrapper">
                        <p>Background Image:</p>
                        <input type="url" id="backgroundImageUrl-input" class="input" bind:value="{$backgroundImage}" on:focus="{select}">
                    </div>
                    <div class="input-wrapper">
                        <p>Background Image Size:</p>
                        <select id="backgroundImageSize-input" class="input select" bind:value="{$backgroundImageSize}">
                            <option selected value="auto">Auto</option>
                            <option value="contain">Contain</option>
                            <option value="cover">Cover</option>
                        </select>
                    </div>
                    <div class="input-wrapper">
                        <p>Background Image Position:</p>
                        <select id="backgroundImagePosition-input" class="input select" bind:value="{$backgroundPosition}">
                            <option selected value="bottom">Bottom</option>
                            <option value="top">Top</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="center">Center</option>
                            <option value="unset">Unset</option>
                        </select>
                    </div>
                    <div class="input-wrapper">
                        <p>Character-Sheets:</p>
                        <select id="characterSheet-input" class="input select" bind:value="{$characterSheets}">
                            <option selected value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </div>
                </div>
                <div id="modules" class="settings-category" class:active="{activeSettingsCategory == 2}">
                    <h2>Modules</h2>
                    <div class="input-wrapper">
                        <p>Installed Modules:</p>
                        <button class="input button" on:click={() => {window.util.openModuleFolder()}}>Open Module Folder</button>
                    </div>
                    <div class="input-wrapper table-wrapper">
                        <table class="table">
                            <tr>
                                <th>Module</th>
                                <th>Version</th>
                                <th>Author</th>
                                <th>Repository</th>
                            </tr>
                            {#each Object.values($sheetModules) as module}
                                <tr>
                                    <td>{module.info.name}</td>
                                    <td>{module.info.version}</td>
                                    <td>{module.info.author ?? "Someone"}</td>
                                    <td>
                                        {#if module.info.repo}
                                            <a class="link" href="{module.info.repo}">{new URL(module.info.repo).hostname}</a>
                                        {:else}
                                            -
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
h2 {
    margin: 0;
    margin-bottom: 5px;
}

hr {
    width: -webkit-fill-available;
    margin-right: 4px;
    border: none;
    border-top: 1px solid rgb(150, 150, 150);
}

#sidebar-container {
    display: flex;
    width: 100%;
    height: 100%;
}

#sidebar-content-container {
    width: 350px;
    background-color: #141414;
    height: 100%;
}

#dungeonControlRoom-container {
    width: 100%;
    height: 50%;
    overflow-y: auto;
    overflow-x: hidden;
}

#initiativeTracker-container {
    height: 45%;
    overflow-y: auto;
    overflow-x: hidden;
}

#initiativeTrackerTitle {
    margin-top: 0;
    padding-top: 16px;
}

#initiativeList {
    margin-top: 16px;
}

#sessionRole-indicator {
    margin-top: 0;
    margin-bottom: 5px;
    padding-top: 10px;
    padding-left: 5px;
}

#playerInfo-container {
    background-color: #0a0a0a;
    height: 5%;
    min-height: fit-content;
    display: flex;
    align-items: center;
    justify-content: left;
}

#settings-button {
    border-radius: 5px;
    min-width: 32px;
    height: 32px;
    font-size: 22px;
    border: none;
    color: white;
    background-color: transparent;
    transition: background-color 0.1s linear;
    margin-right: 8px;
    text-align: center;
    align-items: center;
    justify-content: center;
    display: flex;
    cursor: pointer;
}

#settings-button:hover {
    background-color: var(--primary);
}

#content-container {
    flex-grow: 1;
}

#settings-container {
    display: none;
    position: absolute;
    user-select: none;
}

#settings-container.opened {
    display: flex;
    background: rgb(32, 32, 32);
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 3;
}

#settings {
    width: 50%;
    max-width: 900px;
    height: 95%;
    margin: auto;
    display: flex;
    flex-direction: column;
}

#closeSettings-button {
    min-width: 44px;
    height: 44px;
    font-size: 34px;
    display: flex;
    padding: 0;
    margin: 0;
    align-items: center;
    justify-content: center;
    text-align: center;
    border: none;
    background-color: transparent;
    color: white;
    margin-left: auto;
    cursor: pointer;
}

#closeSettings-button:hover {
    color: var(--primary);
}

#category-wrapper {
    display: flex;
    flex-direction: row;
    flex-grow: 1;
}

#category-selector {
    display: flex;
    width: 180px;
    height: 100%;
    flex-direction: column;
    border-right: solid 2px #303030;
}

#category-container {
    display: flex;
    width: -webkit-fill-available;
    margin-left: 30px;
    flex-direction: column;
}

.category-button {
    display: block;
    cursor: pointer;
    padding: 4px;
    border-radius: 5px;
    margin-top: 2px;
    margin-right: 4px;
    font-size: 17px;
    color: rgb(200, 200, 200);
}

.category-button:first {
    margin-top: 0px;
}

.category-button:hover, .category-button.active {
    /*background-color: rgba(70, 70, 70, 0.4);*/
    background-color: #2d2d2d;
}

.settings-category {
    display: none;
    flex-direction: column;
}

.settings-category.active {
    display: flex;
    flex-direction: column;
}

.settings-category-title {
    text-transform: uppercase;
    font-weight: bold;
    font-size: 14px;
    margin-top: 2px;
    margin-bottom: 4px;
    color: rgb(150, 150, 150);
}

.input-wrapper {
    display: flex;
    align-items: center;
    margin-top: 2px;
}

.input-wrapper:first {
    margin-top: 0;
}

.input-wrapper p {
    min-width: fit-content;
}

.double-input-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
}

.input {
    width: 100%;
    padding: 4px;
    padding-left: 8px;
    padding-right: 8px;
    margin: 0;
    margin-left: 5px;
    margin-right: 5px;
    background-color: #2d2d2d;
    border-radius: 5px;
    color: white;
    border: none;
    outline: none;
    height: 24px;
    font-size: 1rem;
}

.input.select {
    height: 32px;
}   

.input.boxShadow {
    -webkit-box-shadow: 0px 0px 10px 1px rgba(0,0,0,0.5); 
    box-shadow: 0px 0px 10px 1px rgba(0,0,0,0.5);
}

.input:focus, .input:hover {
    outline: var(--primary) solid 2px;
}

.input.color {
    width: 32px;
    height: 32px;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
    border-radius: 50%;
}

.input.button {
    height: 32px;
    width: fit-content;
    padding: 8px;
    cursor: pointer;
}

input[type=color]::-webkit-color-swatch {
    border: none;
    border-radius: 50%;
    padding: 0;
    width: 32px;
    height: 32px;
    padding: 0;
}

input[type=color]::-webkit-color-swatch-wrapper {
    border: none;
    border-radius: 50%;
    padding: 0;
    width: 32px;
    height: 32px;
    padding: 0;
}

input[type=range] {
    cursor: pointer;
}

.table-wrapper {
    border: white 2px solid;
    border-radius: 5px;
}

.table {
    width: 100%;
    height: fit-content;
    border-collapse: collapse;
    background-color: #2d2d2d;
    color: white;
    outline: none;
    font-size: 16px;
}

.table th, .table td {
    text-align: center;
    padding: 4px;
}

.table tr:not(:last-child) {
    border-bottom: white 2px solid;
}

.table th:not(:first), .table td:not(:first) {
    border-left: white 2px solid;
}

.table th:not(:last-of-type), .table td:not(:last-child) {
    border-right: white 2px solid;
}

.link {
    color: white;
    text-decoration: underline var(--primary) 2px;
}

.link:hover {
    text-decoration: underline var(--primary) 2px;
}

.dungeonControlRoom-text {
    margin-left: 5px;
    margin-bottom: 5px;
}

.dungeonControlRoom-inlineText {
    display: inline;
    margin-left: 5px;
    min-width: fit-content;
    margin-top: 10px;
    margin-bottom: 10px;
}

.dungeonControlRoom-inputRow {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.dungeonControlRoom-input {
    display: inline;
}

.dungeonControlRoom-button {
    color: white;
	padding: 8px;
    border: none;
    outline: none;
	background-color: #2d2d2d;
	box-shadow: 0px 0px 10px 1px rgb(0 0 0 / 50%);
	border-radius: 5px;
	cursor: pointer;
    margin-left: 5px;
    min-width: fit-content;
    width: 100%;
    margin-top: 5px;
    padding-left: 11px;
    padding-right: 11px;
}

.dungeonControlRoom-button:focus, .dungeonControlRoom-button:hover {
    outline: var(--primary) solid 2px;
}

.dungeonControlRoom-button:disabled {
    box-shadow: none;
    cursor: unset;
    color: rgb(100, 100, 100);
    outline: none;
}

.dungeonControlRoom-button:last-of-type {
    margin-right: 5px;
}

.playerList {
    margin-top: 5px;   
}

.playerName {
    padding-left: 5px;
    display: inline;
}

</style>