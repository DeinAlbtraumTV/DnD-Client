<script>
    import InlineSVG from "svelte-inline-svg"
    import { stopTyping } from "../../util/nodeExtensions"

    export let data
    export let onDrop
    export let onBlur
    export let onClick = null
    export let onFocus = null
    export let onStopTyping = null
</script>

{#if !data.type}
    <div class="{data.class ? data.class : ''}" id="{data.id}">
        {#if typeof data.data === 'string' || data.data instanceof String }
            {data.data}
        {:else if Array.isArray(data.data)}
            {#each data.data as elem}
                <svelte:self data="{elem}" onDrop={onDrop} onBlur={onBlur} onClick={onClick} onFocus={onFocus} onStopTyping={onStopTyping}/>
            {/each}
        {:else}
            <svelte:self data="{data.data}" onDrop={onDrop} onBlur={onBlur} onClick={onClick} onFocus={onFocus} onStopTyping={onStopTyping}/>
        {/if}
    </div>
{:else if data.type == "svg"}
    <InlineSVG class="{data.class ? data.class : ''}" id="{data.id}" src="{data.src}" width="935" height="1210" style="width:935px; height:1210px; -moz-transform:scale(1); transform: scale(1); z-index: 0; outline: none;"></InlineSVG>
{:else if data.type == "text"}
    <input class="{data.class ? data.class : ''}" id="{data.id}" type="text" data-field-name="{data.id}" on:drop="{onDrop}" on:blur="{onBlur}" data-initiative="{data.initiative}"/>
{:else if data.type == "spell"}
    <input class="{data.class ? data.class : ''}" id="{data.id}" type="text" data-field-name="S{data.id}" on:blur="{onBlur}" on:drop="{onDrop}" on:focus="{onFocus}" use:stopTyping on:stopTyping="{onFocus}"/>
{:else if data.type == "check"}
    <input class="{data.class ? data.class : ''}" id="{data.id}" type="checkbox" data-field-name="{data.id}" on:change="{onClick}"/>
{:else if data.type == "text-multiline"}
    <textarea class="{data.class ? data.class : ''}" id="{data.id}" data-field-name="{data.id}" on:drop="{onDrop}" on:blur="{onBlur}"></textarea>
{/if}