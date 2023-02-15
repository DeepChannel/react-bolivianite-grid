export function debounce(time, fn) {
    let task = null;
    return (...args) => {
        if (task) {
            clearTimeout(task);
        }
        task = setTimeout(() => {
            task = null;
            fn(...args);
        }, time);
    };
}
export default debounce;

//# sourceMappingURL=debounce.js.map
