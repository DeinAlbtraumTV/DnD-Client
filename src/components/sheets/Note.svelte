<script lang="ts">
    import { createBubbler, stopPropagation } from 'svelte/legacy';

    const bubble = createBubbler();
    import { createEventDispatcher } from "svelte";
    import { sheetZoom } from "../../stores/persistentSettingsStore";

    let dispatch = createEventDispatcher();

    let { data = $bindable({
        id: 0,
        x: 0,
        y: 0,
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
        width: 0,
        height: 0,
        expanded: false,
        text: ''
    }) } = $props();

    let isMouseDown = false;

    let startX = 0, startY = 0, nowX = 0, nowY = 0;

    function mouseDown(event) {
        let zoomFactor = $sheetZoom / 100;

        startX = event.clientX / zoomFactor;
        startY = event.clientY / zoomFactor;

        isMouseDown = true;
        dispatch("dragStart")
    }

    function mouseMove(event) {
        if (isMouseDown) {
            let zoomFactor = $sheetZoom / 100;

            nowX = event.clientX / zoomFactor;
            nowY = event.clientY / zoomFactor;

            data.x += nowX - startX;
            data.y += nowY - startY;

            data.x = Math.max(data.minX, Math.min(data.x, data.maxX - data.width));
            data.y = Math.max(data.minY, Math.min(data.y, data.maxY - data.height));

            startX = nowX;
            startY = nowY;
        }
    }

    function mouseUp() {
        if (isMouseDown) {
            dispatch("dragEnd", data.id);
            dispatch("dataUpdate", data);

            isMouseDown = false;
        }
    }

    function textChanged(event) {
        data.text = event.target.innerText;
        dispatch("dataUpdate", data);
    }

    function noteExpanderClicked(event) {
        event.stopPropagation();
        isMouseDown = false;
        data.expanded = !data.expanded;
        dispatch("dataUpdate", data);
    }

    function noteExpanderKeydown(event) {
        if (event.key == "Enter") {
            event.stopPropagation();
            isMouseDown = false;
            data.expanded = !data.expanded;
            dispatch("dataUpdate", data);
        }
    }
</script>
<style>
    .note {
        position: absolute;
        cursor: move;
        z-index: 100;
        background-color: #00000090;
        min-width: 15px;
        min-height: 15px;
        display: flex;
        flex-direction: column;
        user-select: none;
    }

    .note.expanded {
        min-width: 100px;
        min-height: 100px;
        z-index: 101;
    }

    .note * {
        display: none;
    }

    .note.expanded * {
        display: block;
    }

    .note .note-expander {
        width: 30px;
        height: 30px;
        background-color: var(--primary);
        opacity: 0.5;
        color: white;
        cursor: pointer;
        margin-right: 10px;
        display: flex;
        margin: auto;
        margin-left: 0;
        align-items: center;
        justify-content: center;
        transition: opacity 0.1s linear;
    }

    .note .note-expander * {
        display: block;
    }

    .note.expanded .note-expander, .note-expander:hover {
        opacity: 1;
    }

    .note.expanded .note-mover {
        display: flex;
    }

    .note-text {
        flex-grow: 1;
        resize: none;
        border: none;
        background-color: transparent;
        font-size: 16px;
        font-family: inherit;
        font-weight: 400;
        color: white;
        user-select: text;
        cursor: text;
        padding: 5px;
    }

    .note-text:focus {
        outline: var(--primary) 2px solid;
    }

    .note .note-row {
        display: flex;
        flex-direction: row;
        align-items: center;
    }

    .note-mover {
        flex-grow: 1;
        height: 30px;
        cursor: move;
        background-color: var(--primary);
        border-left: white 1px solid;
        color: white;
        align-items: center;
        justify-content: center;
    }

    .note-mover * {
        font-size: 16px;
        transform: scaleY(1.2) scaleX(5);
    }
</style>

<svelte:window onmousemove={mouseMove} onmouseup={mouseUp}/>
<div class="note" class:expanded={data.expanded == true} onmousedown={mouseDown} style={`top:${data.y}px; left:${data.x}px;`} bind:clientHeight={data.height} bind:clientWidth={data.width}>
    <div class="note-row">
        <div class="note-expander" onkeydown={noteExpanderKeydown} onclick={noteExpanderClicked} onmousedown={stopPropagation(bubble('mousedown'))}>
            <div>{data.expanded ? "-" : "+"}</div>
        </div>
        <div class="note-mover">
            <div>&equiv;</div>
        </div>
    </div>
    <div class="note-text" onmousedown={stopPropagation(bubble('mousedown'))} onblur={textChanged} contenteditable="true" bind:innerText={data.text}></div>
</div>