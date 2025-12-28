export function stopPropagation(fn: (event: Event, ...args: Array<unknown>) => void = () => {}): (event: Event, ...args: unknown[]) => void {
    return function (event, args) {
      event.stopPropagation();
      fn(event, args);
    };
}