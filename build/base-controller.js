"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IS_MACOS = navigator.platform.slice(0, 3) === 'Mac';
var Controller = /** @class */ (function () {
    function Controller(_props) {
        this._props = _props;
        this._state = null;
    }
    Controller.prototype._getModifiers = function (e) {
        var ctrlKey = e.ctrlKey, altKey = e.altKey, shiftKey = e.shiftKey;
        var cmdKey = e.getModifierState('Meta'); // Command key for Mac OS
        return {
            ctrlKey: ctrlKey,
            macCmdKey: cmdKey,
            cmdKey: IS_MACOS ? cmdKey : ctrlKey,
            shiftKey: shiftKey,
            altKey: altKey
        };
    };
    Controller.prototype._clampAddress = function (_a) {
        var column = _a.column, row = _a.row;
        var _b = this._state, rows = _b.rows, columns = _b.columns;
        return {
            column: Math.min(Math.max(0, column), columns - 1),
            row: Math.min(Math.max(0, row), rows - 1)
        };
    };
    Controller.prototype._splitSelection = function (selection) {
        var prev = selection.slice();
        var last = prev.pop();
        return {
            prev: prev, last: last
        };
    };
    Controller.prototype._getSelectedCells = function (selection) {
        var lock = new Set();
        var list = [];
        for (var _i = 0, selection_1 = selection; _i < selection_1.length; _i++) {
            var _a = selection_1[_i], column = _a.column, row = _a.row, height = _a.height, width = _a.width;
            for (var r = row, rLast = row + height; r <= rLast; r++) {
                for (var c = column, cLast = column + width; c <= cLast; c++) {
                    var key = r + "x" + c;
                    if (lock.has(key)) {
                        continue;
                    }
                    lock.add(key);
                    list.push({ row: r, column: c });
                }
            }
        }
        return list;
    };
    Controller.prototype._isInsideSelection = function (_a, selection) {
        var c = _a.column, r = _a.row;
        return selection.findIndex(function (_a) {
            var row = _a.row, column = _a.column, height = _a.height, width = _a.width;
            return row <= r && r <= (row + height) && column <= c && c <= (column + width);
        }) !== -1;
    };
    Controller.prototype._request = function () {
        return this._state = this._props.getState();
    };
    return Controller;
}());
exports.Controller = Controller;

//# sourceMappingURL=base-controller.js.map
