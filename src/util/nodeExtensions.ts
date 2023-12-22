export function stopTyping(node: HTMLInputElement) {
    const handleKeyup = debounce((event: { target: any; }) => {
        if (node.contains(event.target)) {
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

function debounce(inputFunction: Function, timeToWaitBeforeFiringInMs = 500) {
    let timer: NodeJS.Timeout;
    return function(this: Function, ...args: any) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            inputFunction.apply(this, args);
        }, timeToWaitBeforeFiringInMs);
    };
}