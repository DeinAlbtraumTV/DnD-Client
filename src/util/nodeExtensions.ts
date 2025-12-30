export function stopTyping(node: HTMLInputElement) {
    const handleKeyup = debounce((event: KeyboardEvent) => {
        if (!event.target) {
            return;
        }

        if (node.contains(event.target as Node)) {
            node.dispatchEvent(new CustomEvent('stopTyping'));
        }
    }, 500);

    document.addEventListener('keyup', handleKeyup, true);

    return {
        destroy() {
            document.removeEventListener('keyup', handleKeyup, true);
        }
    };
}

function debounce <U extends unknown[]>(inputFunction: (...args: U) => void, timeToWaitBeforeFiringInMs = 500) {
    let timer: NodeJS.Timeout;
    return function(this: Document, ...args: U) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            inputFunction.apply(this, args);
        }, timeToWaitBeforeFiringInMs);
    };
}