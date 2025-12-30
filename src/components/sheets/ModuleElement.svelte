<script>
    import ModuleElement from './ModuleElement.svelte';
    import { inlineSvg } from "@svelte-put/inline-svg"
    import { stopTyping } from "../../util/nodeExtensions"

    let {
        sheet,
        data,
        onDrop,
        onBlur,
        onClick = null,
        onFocus = null,
        onStopTyping = null
    } = $props();

    function clearIfNotEdited(event) {
        if (!(event.target instanceof HTMLInputElement)) {
            return;
        }

        if (!event.target.getAttribute("user-edited")) {
            event.target.value = ""
        }

        if (onFocus && event.target.getAttribute("data-field-name") && event.target.getAttribute("data-field-name") == "S" + data.id) {
            onFocus(event)
        }
    }
</script>

{#if !data.type}
    <div class="{data.class ? data.class : ''}" id="{data.id}" data-id="{sheet}:{data.id}">
        {#if typeof data.data === 'string' || data.data instanceof String}
            {data.data}
        {:else if Array.isArray(data.data)}
            {#each data.data as elem (elem.id)}
                <ModuleElement sheet={sheet} data={elem} onDrop={onDrop} onBlur={onBlur} onClick={onClick} onFocus={onFocus} onStopTyping={onStopTyping}/>
            {/each}
        {:else}
            <ModuleElement sheet={sheet} data={data.data} onDrop={onDrop} onBlur={onBlur} onClick={onClick} onFocus={onFocus} onStopTyping={onStopTyping}/>
        {/if}
    </div>
{:else if data.type == "svg"}
    <svg use:inlineSvg={data.src ?? ""} class={data.class ? data.class : ''} id={data.id} data-id="{sheet}:{data.id}" width="935" height="1210" style="width:935px; height:1210px; -moz-transform:scale(1); transform: scale(1); z-index: 0; outline: none;"></svg>
{:else if data.type == "text"}
    <input class="{data.class ? data.class : ''}" id="{data.id}" data-id="{sheet}:{data.id}" type="text" data-field-name="{data.id}" ondrop={onDrop} onblur={onBlur} onfocus={clearIfNotEdited} data-initiative="{data.initiative}"/>
{:else if data.type == "spell"}
    <input class="{data.class ? data.class : ''}" id="{data.id}" data-id="{sheet}:{data.id}" type="text" data-field-name="S{data.id}" ondrop={onDrop} onblur={onBlur} onfocus={clearIfNotEdited} use:stopTyping onstopTyping={onStopTyping}/>
{:else if data.type == "check"}
    <input class="{data.class ? data.class : ''}" id="{data.id}" data-id="{sheet}:{data.id}" type="checkbox" data-field-name="{data.id}" onchange={onClick}/>
{:else if data.type == "text-multiline"}
    <textarea class="{data.class ? data.class : ''}" id="{data.id}" data-id="{sheet}:{data.id}" data-field-name="{data.id}" ondrop={onDrop} onblur={onBlur} onfocus={clearIfNotEdited}></textarea>
{/if}