"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RenderThrottler = /** @class */ (function () {
    function RenderThrottler() {
        var _this = this;
        this._ids = 0;
        this._tasks = {};
        this._active = true;
        this._step = function () {
            var c = 0;
            for (var _i = 0, _a = Object.keys(_this._tasks); _i < _a.length; _i++) {
                var id = _a[_i];
                var f = _this._tasks[id];
                if (f) {
                    f();
                }
                delete _this._tasks[id];
                c++;
            }
            if (!c) {
                _this._active = false;
            }
            else {
                window.requestAnimationFrame(_this._step);
            }
        };
        window.requestAnimationFrame(this._step);
    }
    RenderThrottler.prototype.create = function () {
        var _this = this;
        var id = this._ids++;
        return function (fn) {
            _this._tasks[id] = fn;
            if (!_this._active) {
                _this._active = true;
                window.requestAnimationFrame(_this._step);
            }
        };
    };
    return RenderThrottler;
}());
exports.RenderThrottler = RenderThrottler;
exports.default = RenderThrottler;

//# sourceMappingURL=render-throttler.js.map
