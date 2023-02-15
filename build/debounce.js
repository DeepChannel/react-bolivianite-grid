"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function debounce(time, fn) {
    var task = null;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (task) {
            clearTimeout(task);
        }
        task = setTimeout(function () {
            task = null;
            fn.apply(void 0, args);
        }, time);
    };
}
exports.debounce = debounce;
exports.default = debounce;

//# sourceMappingURL=debounce.js.map
