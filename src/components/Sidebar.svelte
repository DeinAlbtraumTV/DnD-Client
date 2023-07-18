<script lang="ts">
    import { localStorageStore } from "../stores/localStorageStore.js"
    import { backgroundColor, backgroundImage, backgroundImageSize, backgroundOverlay, backgroundOverlayOpacity, backgroundPosition, primaryColor, characterSheets, sessionCode, currentCharacter } from "../stores/persistentSettingsStore.js"
    import { socket, session, characters, playerInfo, PlayerData } from "../stores/nonPersistentStore.js"

    let settingsOpened = false
    let activeSettingsCategory = 0
    let mapLink = ""

    let players:Map<string, PlayerData> = new Map<string, PlayerData>()

    $socket.on("connect", () => {
        $socket.emit("sync", { session_code: $sessionCode }, (callback: any) => {
            if (callback.session_exists) {
                $session = {
                    code: $sessionCode,
                    role: "Player",
                    dm: false,
                    url: callback.url
                }
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
        console.log("Added player", data.player)
        players.set(data.player, {
            name: data.player,
            initiative: 0,
            initiativeModifier: data.initiativeModifier
        })
    })

    $socket.on("removePlayer", (data: any) => {
        console.log("Removed player", data.player)
        players.delete(data.player)

        players = players
    })

    $socket.on("syncPlayerData", () => {
        if ($session) {
            $socket.emit("syncPlayerData",
                { session_code: $session.code, playerName: $localStorageStore.playerName }
            )
        }
    })

    $socket.on("updateInitiative", (data: any) => {
        if (players.has(data.player)) {
            players.set(data.player, {
                name: data.player,
                initiative: data.initiative,
                initiativeModifier: players.get(data.player)?.initiativeModifier || 0
            })
        }
    })

    $socket.on("updateInitiativeModifier", (data: any) => {
        if (players.has(data.player)) {
            players.set(data.player, {
                name: data.player,
                initiative: players.get(data.player)?.initiative || 0,
                initiativeModifier: data.initiativeModifier
            })
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
        console.log($session)
        if ($session) {
            $socket.emit("leaveSession", { session_code: $session.code }, (callback: any) => {
                if (callback && callback.left) {
                    $session = undefined
                    players = new Map<string, PlayerData>()
                    console.log("Left session", $sessionCode)
                }
            })
        }

        $socket.emit("joinSession", { session_code: $sessionCode, playerName: $localStorageStore.playerName, initiativeModifier: $characters[$currentCharacter].sheet["initiative"] }, (callback: any) => {
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
        let player = target.parentElement?.getAttribute("data-player-id")

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
            $socket.emit("updateInitiative", { player: $playerInfo.id, session_code: $session.code, initiative: rand + $playerInfo.initiativeModifier })
        }
    }

    function rollInitiativeForPlayer(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
        let target = event.currentTarget
        let player = target.parentElement?.getAttribute("data-player-id")

        if (!player) return

        let rand = Math.floor(Math.random() * 20) + 1

        let playerData = players.get(player)

        if ($session && playerData) {
            $socket.emit("updateInitiative", { player: player, session_code: $session.code, initiative: rand + playerData.initiativeModifier })
        }
    }

    function rollInitiativeForAll() {
        if ($session) {
            for (let player in players) {
                let rand = Math.floor(Math.random() * 20) + 1

                let playerData = players.get(player)

                if (!playerData) continue

                $socket.emit("updateInitiative", { player: player, session_code: $session.code, initiative: (rand + playerData.initiativeModifier) })
            }

            rollInitiativeForMe()
        }
    }
</script>

<div id="sidebar-container">
    <div id="sidebar-expanded-container">
        <div id="sidebarItem-expanded-container">
            <div id="sessionControls">
                <form on:submit|preventDefault>
                    <p id="sessionRole-indicator">Your role: {$session ? $session.role : "none"}</p>
                    <p id="sessionCode-text">Join a Session:</p>
                    <input id="sessionCodeInput" class="sessionControl-input input boxShadow" type="text" bind:value="{$sessionCode}">
                    <button class="sessionControl-button" on:click="{createSession}">Create Session</button>
                    <button class="sessionControl-button" on:click="{joinSession}">Join Session</button>
                    <button class="sessionControl-button" disabled="{!$session}" on:click="{leaveSession}">Leave Session</button>
                </form>
                {#if $session}
                <form on:submit|preventDefault>
                    {#if $session.dm}
                    <p class="dungeonControlRoom-text">Dungeon Control Room</p>
                    <p class="dungeonControlRoom-inlineText">Load a map:</p>
                    <input id="mapLinkInput" class="dungeonControlRoom-input input boxShadow" type="text" bind:value="{mapLink}">
                    <button class="dungeonControlRoom-button" on:click="{loadMapForSelf}">Load Map for yourself</button>
                    <button class="dungeonControlRoom-button" on:click="{loadMapForAll}">Load Map for everyone</button>
                    {/if}
                    <div class="playerList">
                        <p class="dungeonControlRoom-text">Players in the session:</p>
                        {#each [...players] as [key, value]}
                        <div data-player-id="{key[0]}">
                            <p class="playerName">{value.name}</p>
                            {#if $session.dm}
                                <button class="dungeonControlRoom-button" on:click="{transferDm}">Make DM</button>
                            {/if}
                        </div>
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
                    {#if $session.dm}
                        <button class="dungeonControlRoom-button" on:click={rollInitiativeForAll}>Roll for everyone</button>
                    {/if}
                    <button class="dungeonControlRoom-button" on:click={rollInitiativeForMe}>Roll for me</button>
                    <div class="playerList" id="initiativeList">
                        <p class="playerName">{$localStorageStore.playername}: {$playerInfo.initiative + $playerInfo.initiativeModifier} ({$playerInfo.initiative} + {$playerInfo.initiativeModifier})</p>
                        {#each [...players] as [key, value]}
                            <div data-player-id="{key[0]}">
                                <p class="playerName">{value.name}: {value.initiative} ({value.initiative - value.initiativeModifier} + {value.initiativeModifier})</p>
                                {#if $session.dm}
                                    <button class="dungeonControlRoom-button" on:click="{rollInitiativeForPlayer}">Roll</button>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </form>
            {/if}
        </div>
        <div id="playerInfo-container">
            <input id="playerName" placeholder="Username" type="text" class="input boxShadow" bind:value="{$localStorageStore.playerName}"/>
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
                <div id="app-settings-title" class="settings-category-title">General Settings</div>
                <div class="category-button" on:keydown={(event) => {if (event.key == "Enter") activeSettingsCategory = 0}} on:click="{() => {activeSettingsCategory = 0}}" class:active="{activeSettingsCategory == 0}">User Settings</div>
                <hr>
                <div id="app-settings-title" class="settings-category-title">App Settings</div>
                <div class="category-button" on:keydown={(event) => {if (event.key == "Enter") activeSettingsCategory = 1}} on:click="{() => {activeSettingsCategory = 1}}" class:active="{activeSettingsCategory == 1}">Appearance</div>
            </div>
            <div id="category-container">
                <div id="user-settings" class="settings-category" class:active="{activeSettingsCategory == 0}">
                    <h2>User Settings</h2>
                    <div class="input-wrapper">
                        Username:
                        <input id="playerName" placeholder="Username" type="text" class="input" bind:value="{$localStorageStore.playerName}"/>
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

#sidebar-expanded-container {
    width: 350px;
    background-color: #141414;
    height: 100%;
}

#sidebarItem-expanded-container {
    width: 100%;
    height: 50%;
}

#initiativeTracker-container {
    height: 45%;
}

#initiativeTrackerTitle {
    margin-top: 0;
    padding-top: 16px;
}

#initiativeList {
    margin-top: 16px;
}

#sessionControls {
    height: 100%;
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
    background-color: rgba(70, 70, 70, 0.4);
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
    margin-left: 8px;
    margin-right: 8px;
    background-color: #252525;
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

#sessionRole-indicator {
    margin-top: 0;
    margin-bottom: 5px;
    padding-top: 10px;
    padding-left: 5px;
}

#sessionCode-text {
    display: inline;
    margin-left: 5px;
}

.sessionControl-input {
    width: auto;
    display: inline;
}

.sessionControl-button {
    color: white;
	padding: 8px;
    border: none;
    outline: none;
	background-color: #252525;
	box-shadow: 0px 0px 10px 1px rgb(0 0 0 / 50%);
	border-radius: 5px;
	cursor: pointer;
    margin-left: 5px;
    width: fit-content;
    margin-top: 5px;
}

.sessionControl-button:hover {
    outline: 2px solid var(--primary);
}

.sessionControl-button:disabled {
    box-shadow: none;
    cursor: unset;
    color: rgb(100, 100, 100);
}

.sessionControl-button:disabled {
    outline: none;
}

.dungeonControlRoom-text {
    margin-left: 5px;
}

.dungeonControlRoom-inlineText {
    display: inline;
    margin-left: 5px;
}

.dungeonControlRoom-input {
    width: auto;
    display: inline;
}

.dungeonControlRoom-button {
    color: white;
	padding: 8px;
    border: none;
    outline: none;
	background-color: #252525;
	box-shadow: 0px 0px 10px 1px rgb(0 0 0 / 50%);
	border-radius: 5px;
	cursor: pointer;
    margin-left: 5px;
    width: fit-content;
    margin-top: 5px;
    padding-left: 11px;
    padding-right: 11px;
}

.dungeonControlRoom-button:focus, .dungeonControlRoom-button:hover {
    outline: var(--primary) solid 2px;
}

#mapLinkInput {
    width: 211px;
}

.playerList {
    margin-top: 5px;   
}

.playerName {
    padding-left: 5px;
    display: inline;
}

</style>