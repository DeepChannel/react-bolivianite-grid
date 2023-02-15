export class RenderThrottler {
    constructor() {
        this._ids = 0;
        this._tasks = {};
        this._active = true;
        this._step = () => {
            let c = 0;
            for (let id of Object.keys(this._tasks)) {
                let f = this._tasks[id];
                if (f) {
                    f();
                }
                delete this._tasks[id];
                c++;
            }
            if (!c) {
                this._active = false;
            }
            else {
                window.requestAnimationFrame(this._step);
            }
        };
        window.requestAnimationFrame(this._step);
    }
    create() {
        const id = this._ids++;
        return (fn) => {
            this._tasks[id] = fn;
            if (!this._active) {
                this._active = true;
                window.requestAnimationFrame(this._step);
            }
        };
    }
}
export default RenderThrottler;

//# sourceMappingURL=render-throttler.js.map
