<script>
	import Sidebar from "./components/Sidebar.svelte"
	import MiniBrowser from "./components/MiniBrowser.svelte"
	import { backgroundColor, backgroundImage, backgroundImageSize, backgroundOverlay, backgroundOverlayOpacity, backgroundPosition, currentCharacter, characterSheets, primaryColor, sheetZoom } from "./stores/persistentSettingsStore"
	import { set } from "./util/styleManager"
	import { characters, socket, sheetModules } from "./stores/nonPersistentStore"
	import CharacterSheet from "./components/sheets/CharacterSheet.svelte"
	import DetailsSheet from "./components/sheets/DetailsSheet.svelte"
	import SpellcastingSheet from "./components/sheets/SpellcastingSheet.svelte"
	import { io } from "socket.io-client"
	import NotifyBar from "./components/NotifyBar.svelte"
	import { NotificationType, notifications } from "./stores/notificationStore"
	import { localStorageStore } from "./stores/localStorageStore"
	import { generateName } from "./util/nameGenerator"

	if (PRE_REP_DEV_ENVIRONMENT) {
		$socket = io("ws://127.0.0.1:4134")
		notifications.push({
			type: NotificationType.WARNING,
			content: "Running in Dev Mode",
			timeout: -1
		})
	} else {
		$socket = io("ws://neah.gamewithfire.de:4134")
	}

	$socket.on("version-check", (data) => {
		checkIfVersionMatchesServer(data.minClientVer)
	})

	$sheetModules = window.characters.loadModules()
	$characters = window.characters.loadSheets()

	let showNewCharacterPopup = $state(false)
	let showCharacterDeletionPopup = $state(false)

	let prevSelected = $state("")
	let characterSelect = $state()
	let characterSheetsExpanded = $state(false)
	let newCharacterName = $state("")
	let newCharacterModule = $state("")
	let currentCharacterSheet = $state(0)
	let sheetRefs = $state({})

	function checkIfVersionMatchesServer(requiredVersion) {
		let requiredVersionParts = requiredVersion.split(".");
		let clientVersionParts = PRE_REP_CLIENT_VERSION.split(".")

		if (requiredVersionParts.length != clientVersionParts.length) {
			notifications.push({
				type: NotificationType.ERROR,
				content: "Client and Server Version-format mismatch.",
				timeout: -1
			})
			return;
		}

		for (let i = 0; i < requiredVersionParts.length; i++) {
			let requiredVersionPart = Number.parseInt(requiredVersionParts[i])
			let clientVersionPart = Number.parseInt(clientVersionParts[i])

			if (requiredVersionPart == Number.NaN || clientVersionPart == Number.NaN) {
				notifications.push({
					type: NotificationType.ERROR,
					content: "Version contains invalid characters.",
					timeout: -1
				})
				return;
			}

			if (requiredVersionPart > clientVersionPart) {
				notifications.push({
					type: NotificationType.ERROR,
					content: `Client and Server Version mismatch. Server wants: min. ${requiredVersion}, Client has: ${PRE_REP_CLIENT_VERSION}`,
					timeout: -1
				})
				return;
			}
		}
	}

	function toggleCharacterSheet() {
		characterSheetsExpanded = !characterSheetsExpanded
	}

	backgroundColor.subscribe(value => {
		set("backgroundColor", value)
	})

	backgroundOverlay.subscribe(value => {
		set("backgroundOverlay", value + parseInt(($backgroundOverlayOpacity ?? "0")).toString(16))
	})

	backgroundOverlayOpacity.subscribe(value => {
		set("backgroundOverlay", ($backgroundOverlay ?? "") + (255 - parseInt((value ?? "0"))).toString(16))
	})

	backgroundImage.subscribe(value => {
		set("backgroundImage", "url(" + value + ")")
	})

	backgroundImageSize.subscribe(value => {
		set("backgroundImageSize", value)
	})

	backgroundPosition.subscribe(value => {
		set("backgroundPosition", value)
	})

	primaryColor.subscribe(value => {
		set("primary", value)
	})

	sheetZoom.subscribe(value => {
		set("sheetZoom", value + "%")
	})

	$effect(() => {
		if ($characterSheets == "dark") {
			set("characterSheetsPrimary", "#0a0a0a")
			set("characterSheetsSecondary", "#202225")
			set("characterSheetsTertiary", "#808080")
		} else {
			set("characterSheetsPrimary", "#DEDFDF")
			set("characterSheetsSecondary", "#FFFFFF")
			set("characterSheetsTertiary", "#000000")
		}

		if ((!$localStorageStore.playerName || $localStorageStore.playerName == "") &&
			document.activeElement != document.getElementById("playerName") &&
			document.activeElement != document.getElementById("playerName_settings")) {
			$localStorageStore.playerName = generateName()
		}
	});

	function showCharacterPopup(event) {
		if (event.target.value == "new") {
			showNewCharacterPopup = true
		} else {
			prevSelected = event.target.value
		}
	}

	function characterSelectFocused(event) {
		if (event.target.value != "new") {
			prevSelected = event.target.value
		}
	}

	function createNewCharacter() {
		if ($characters[newCharacterName] == undefined) {
			$characters[newCharacterName] = {
				module: {
					id: newCharacterModule,
					version: $sheetModules[newCharacterModule].info.version
				}
			}

			for (let sheet in $sheetModules[newCharacterModule].info.sheets) {
				$characters[newCharacterName][sheet.saveName] = {}
				$characters[newCharacterName][sheet.saveName + "Notes"] = []
			}

			$currentCharacter = newCharacterName
			newCharacterName = ""
			showNewCharacterPopup = false

			window.characters.storeSheets(JSON.stringify($characters))
		}
	}

	function deleteCharacter() {
		delete $characters[$currentCharacter]

		$currentCharacter = "";

		showCharacterDeletionPopup = false;

		$characters = $characters;

		window.characters.storeSheets(JSON.stringify($characters))
	}

	if ($currentCharacter == "new") {
		$currentCharacter = ""
	}

	let ctrl_down = false;
	let n_down = false;

	function keyDown(event) {
		if (event.repeat) return;

		switch (event.key) {
			case "Control":
				ctrl_down = true;
				break;
			case "n":
				n_down = true;
				break;
		}

		if (ctrl_down && n_down) {
			createNote()
		}
	}

	function createNote() {
		switch (currentCharacterSheet) {
			case 0: // Sheet
				sheetRefs.sheet?.createNote()
				break;
			case 1: // Details
				sheetRefs.detail?.createNote()
				break;
			case 2: // Spellcasting
				sheetRefs.spellcasting?.createNote()
				break;
		}
	}

	function keyUp() {
		ctrl_down = false;
		n_down = false;
	}

	function sheetExpanderKeydown(event) {
		if (event.key == "Enter") {
			toggleCharacterSheet(event)
		}
	}
</script>

<svelte:window onkeydown={keyDown} onkeyup={keyUp}/>
<main>
	<NotifyBar/>
	<Sidebar>
		<div class="flex-container">
			<MiniBrowser/>
			<div id="sheet-container">
				<div id="sheetExpander" class:expanded={characterSheetsExpanded} onkeydown={sheetExpanderKeydown} onclick={toggleCharacterSheet}>
					{#if characterSheetsExpanded}
						<i class="fas fa-arrow-right"></i>
					{:else}
						<i class="fas fa-arrow-left"></i>
					{/if}
				</div>
				<div id="characterSheets" class:active={characterSheetsExpanded} class:dark={$characterSheets == "dark"}>
					<div class="tab-container">
						<select name="character" id="characterSelect" bind:this="{characterSelect}" onchange={showCharacterPopup} bind:value="{$currentCharacter}" onfocus={characterSelectFocused}>
							{#each Object.keys($characters) as name}
								{#if name != "version"}
									<option value="{name}">{name}</option>
								{/if}
							{/each}
							<option selected value="new">New Character</option>
						</select>

						<!--Margin fuckery because css decided to not space the buttons if they are generated by an each statement... Looks 100% the same in the inspector, yet behaves differently-->
						{#each $sheetModules[$characters[$currentCharacter].module.id].info.sheets as sheet, i}
							<button style="margin-left: {i > 0 ? 2 : 0}px; margin-right: {i < $sheetModules[$characters[$currentCharacter].module.id].info.sheets.length - 1 ? 2 : 0}px;" class="sheet-button" class:active={currentCharacterSheet == i} onclick={() => {currentCharacterSheet = i}}>{sheet.displayName}</button>
						{/each}
						<button class="sheet-button active" onclick={() => {$sheetZoom = Math.min($sheetZoom + 12.5, 150)}}>Zoom +</button>
						<button class="sheet-button active" onclick={() => {$sheetZoom = Math.max($sheetZoom - 12.5, 50)}}>Zoom -</button>
						<button class="sheet-button danger seperated-left" onclick={() => {showCharacterDeletionPopup = true}}>Banish Character</button>
						<button class="sheet-button" onclick={createNote}>Add note</button>
					</div>
					{#if $characters[$currentCharacter] !== undefined}
						<div>
							{#each $sheetModules[$characters[$currentCharacter].module.id].info.sheets as sheet, i}
								<div id="charactersheet-container" class:visible={currentCharacterSheet == i}>
									<CharacterSheet bind:this={sheetRefs[sheet.saveName]} showNotes={currentCharacterSheet == i}/>
								</div>
							{/each}
							<!--
							<div id="characterdetails-container" class:visible={currentCharacterSheet == 1}>
								<DetailsSheet bind:this={sheetRefs.detail} showNotes={currentCharacterSheet == 1}/>
							</div>
							<div id="spellcastingsheet-container" class:visible={currentCharacterSheet == 2}>
								<SpellcastingSheet bind:this={sheetRefs.spellcasting} showNotes={currentCharacterSheet == 2}/>
							</div>
							-->
							{@html `<style>@scope {${$sheetModules[$characters[$currentCharacter].module.id]?.css?.shared}}</style>`}
						</div>
					{:else}
						<div class="flex-container" id="noCharacterSelected-container">
							<p>
								Please select a character first
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</Sidebar>
	<div class="popup-container" class:active="{showNewCharacterPopup}">
		<div class="popup-content">
			<div class="flex-column">
				<button id="closePopup-button" onclick={() => {showNewCharacterPopup = false; characterSelect.value = prevSelected; currentCharacter.set(prevSelected)}}><i class="far fa-times-circle"></i></button>
			</div>
			<label for="characterName-input" id="characterName-label">Character Name:</label>
			<input class="input boxShadow" type="text" placeholder="Name" id="characterName-input" bind:value="{newCharacterName}">
			<label for="characterModule-input" id="characterModule-label">Character Sheet:</label>
			<select class="input boxShadow select" id="characterModule-input" bind:value="{newCharacterModule}">
				{#each Object.entries($sheetModules) as entry}
					{#if entry[0].id == "dnd_5e_builtin"}
						<option selected value="{entry[0]}">{entry[1].info.name}</option>
					{:else}
						<option value="{entry[0]}">{entry[1].info.name}</option>
					{/if}
				{/each}
			</select>
			<div class="flex-column flex-container">
				<button id="showNewCharacterPopup-button" onclick={createNewCharacter}>Create</button>
			</div>
		</div>
	</div>
	<div class="popup-container" class:active="{showCharacterDeletionPopup}">
		<div class="popup-content">
			<div class="flex-column">
				<button id="closePopup-button" onclick={() => {showCharacterDeletionPopup = false;}}><i class="far fa-times-circle"></i></button>
			</div>
			<label for="banishCharacter-button" id="banishCharacter-label">Are you sure you want to banish this character? This action can't be undone and your character will be banished to the astral plane!</label>
			<div class="flex-column flex-container">
				<button class="danger" id="banishCharacter-button" onclick={deleteCharacter}>Banish</button>
			</div>
		</div>
	</div>
</main>

<style>
	main {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	.flex-container {
		display: flex;
		width: 100%;
		height: 100%;
	}

	.flex-column {
		display: flex;
		width: 100%;
		flex-direction: column;
	}

	.tab-container {
		width: 100%;
		padding: 4px;
		background-color: #0a0a0a;
		padding-bottom: 6px;
		position: fixed;
		z-index: 10;
	}

	#characterSelect {
		appearance: none;
		margin-left: 10px;
		margin-top: 2px;
		padding: 4px;
		border-radius: 5px;
		background-color: #252525;
		border: none;
		box-shadow: 0px 0px 10px 1px rgb(0 0 0 / 50%);
		color: white;
		border: 2px solid transparent;
		transition: border 0.1s linear;
		cursor: pointer;
	}

	#characterSelect:focus, #characterSelect:active, #characterSelect:hover {
		padding: 4px;
		border: 2px solid var(--primary);
		outline: none;
	}

	#noCharacterSelected-container {
		justify-content: center;
		align-items: center;
		color: black;
	}

	.popup-container {
		display: none;
		position: absolute;
		width: 100%;
		height: 100%;
		background-color: #2022255b;
		top: 0;
		left: 0;
		z-index: 10;
		align-items: center;
		justify-content: center;
	}

	.popup-container.active {
		display: flex;
	}

	.popup-content {
		display: flex;
		flex-direction: column;
		min-width: 400px;
		width: 30%;
		background-color: #202225;
		border-radius: 5px;
		padding: 4px;
		border: 2px solid var(--primary);
	}

	.input {
		padding: 4px;
		padding-left: 8px;
		padding-right: 8px;
		margin: 0;
		margin-left: 5px;
		margin-right: 5px;
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

	#characterName-label, #characterModule-label {
		margin-left: 4px;
	}

	#characterName-input, #characterModule-input {
		display: block;
		margin: 4px;
	}

	#showNewCharacterPopup-button {
		background-color: var(--primary);
		border-radius: 5px;
		color: white;
		max-width: min-content;
		padding: 6px;
		appearance: none;
		margin-left: auto;
		margin-top: 4px;
		margin-right: 4px;
		margin-bottom: 4px;
		cursor: pointer;
		border: none;
	}

	#closePopup-button {
		width: 44px;
		height: 44px;
		font-size: 34px;
		background-color: transparent;
		appearance: none;
		margin-left: auto;
		border: none;
		color: white;
		cursor: pointer;
	}

	#closePopup-button:hover {
		color: var(--primary);
	}

	#sheet-container {
		display: flex;
		align-items: center;
		width: 0;
		height: 100%;
		zoom: var(--sheetZoom);
	}

	#sheetExpander {
		height: 70px;
		background-color: #202225;
		display: flex;
		align-items: center;
		border-radius: 5px 0 0 5px;
		padding-left: 5px;
		border: none;
		border-width: 0;
		-webkit-transition: right 0.3s ease-in-out;
        -ms-transition: right 0.3s ease-in-out;
        transition: right 0.3s ease-in-out;
		position: absolute;
		right: 0;
		border: solid;
		border-right: none;
		border-width: 2px;
		border-color: white;
		cursor: pointer;
	}

	#sheetExpander.expanded {
		right: 935px;
    	z-index: 1;
	}

	#characterSheets {
		display: block;
		width: 0;
		position: absolute;
		right: 0;
		height: -webkit-fill-available;
		-webkit-transition: width 0.3s ease-in-out;
        -ms-transition: width 0.3s ease-in-out;
        transition: width 0.3s ease-in-out;
		z-index: 2;
		background-color: white;
		overflow-y: auto;
		overflow-x: hidden;
	}

	#characterSheets.active {
		display: block;
		width: 935px;
	}

	#characterSheets.dark {
		background-color: #202225;
		color: white;
	}

	#charactersheet-container, #characterdetails-container, #spellcastingsheet-container {
		display: none;
	}

	#charactersheet-container.visible, #characterdetails-container.visible, #spellcastingsheet-container.visible {
		display: block;
	}

	.sheet-button {
		color: white;
		border: none;
		padding: 6px;
		background-color: #252525;
		transition: background-color 0.1s linear;
		box-shadow: 0px 0px 10px 1px rgb(0 0 0 / 50%);
		border-radius: 5px;
		cursor: pointer;
	}

	.sheet-button:hover, .sheet-button.active {
		background-color: var(--primary);
	}

	#banishCharacter-button {
		background-color: #252525;
		transition: background-color 0.1s linear;
		border-radius: 5px;
		color: white;
		max-width: min-content;
		padding: 4px;
		appearance: none;
		margin-left: auto;
		margin-top: auto;
		margin-right: 4px;
		margin-bottom: 4px;
		cursor: pointer;
	}

	.danger {
		padding: 4px;
		border: 2px solid #ce1010;
	}

	.danger:hover, #banishCharacter-button:hover {
		background-color: #ce1010;
	}
</style>