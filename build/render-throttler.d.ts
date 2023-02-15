export declare class RenderThrottler {
    private _ids;
    private _tasks;
    private _active;
    constructor();
    private _step;
    create(): (fn: Function) => void;
}
export default RenderThrottler;
