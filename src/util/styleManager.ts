const cssVars = new Map();

function refresh() {
    const values = [];
    for(const [key, value] of cssVars) {
        values.push(`--${key}:${value}`);
    }
    document.documentElement.style.cssText = values.join(';');
}

export function set(name: string, value: string) {
    cssVars.set(name, value);
    refresh();
}

export function del(name: string) {
    cssVars.delete(name);
    refresh();
}