<script lang="ts">
    import { stopPropagation } from '../../util/eventExtensions';

    import { sheetZoom } from "../../stores/persistentSettingsStore";
    import type { NoteData } from '../../types/types';

    let { data = $bindable(), dragStart, dragEnd, dataUpdate }: {
        data: NoteData,
        dragStart: () => void,
        dragEnd: (id: number) => void,
        dataUpdate: (data: NoteData) => void
    } = $props();

    let isMouseDown = false;

    let startX = 0, startY = 0, nowX = 0, nowY = 0;

    function mouseDown(event: MouseEvent) {
        let zoomFactor = $sheetZoom / 100;

        startX = event.clientX / zoomFactor;
        startY = event.clientY / zoomFactor;

        isMouseDown = true;
        dragStart()
    }

    function mouseMove(event: MouseEvent) {
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
            dragEnd(data.id)
            dataUpdate(data)

            isMouseDown = false;
        }
    }

    function textChanged(event: FocusEvent) {
        if (!(event.target instanceof HTMLDivElement)) {
            return
        }

        data.text = event.target.innerText;
        dataUpdate(data)
    }

    function noteExpanderClicked(event: MouseEvent) {
        event.stopPropagation();
        isMouseDown = false;
        data.expanded = !data.expanded;
        dataUpdate(data);
    }

    function noteExpanderKeydown(event: KeyboardEvent) {
        if (event.key == "Enter") {
            event.stopPropagation();
            isMouseDown = false;
            data.expanded = !data.expanded;
            dataUpdate(data);
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
<div role="none" class="note" class:expanded={data.expanded == true} onmousedown={mouseDown} style={`top:${data.y}px; left:${data.x}px;`} bind:clientHeight={data.height} bind:clientWidth={data.width}>
    <div class="note-row">
        <div role="button" tabindex=0 class="note-expander" onkeydown={noteExpanderKeydown} onclick={noteExpanderClicked} onmousedown={stopPropagation()}>
            <div>{data.expanded ? "-" : "+"}</div>
        </div>
        <div class="note-mover">
            <div>&equiv;</div>
        </div>
    </div>
    <div role="textbox" tabindex=0 class="note-text" onmousedown={stopPropagation()} onblur={textChanged} contenteditable="true" bind:innerText={data.text}></div>
</div>