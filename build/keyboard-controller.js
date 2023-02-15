"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var base_controller_1 = require("./base-controller");
var KeyboardController = /** @class */ (function (_super) {
    __extends(KeyboardController, _super);
    function KeyboardController(_props) {
        var _this = _super.call(this, _props) || this;
        _this._props = _props;
        _this._paste = function (e) {
            var _a = _this._props.getState(), enabled = _a.enabled, focused = _a.focused, readOnly = _a.readOnly, selection = _a.selection;
            if (!enabled || !focused || readOnly) {
                return;
            }
            _this._props.onPaste({
                clipboard: e.clipboardData,
                isReadOnly: function (a) {
                    return _this._props.onReadOnly(a, 'paste');
                },
                getAllSelectedCells: function () {
                    return _this._getSelectedCells(selection);
                },
                getLastSelectedCells: function () {
                    var last = _this._splitSelection(selection).last;
                    return _this._getSelectedCells([last]);
                }
            });
        };
        document.body.addEventListener('paste', _this._paste);
        return _this;
    }
    KeyboardController.prototype._isInput = function (e) {
        var keyCode = e.keyCode;
        var _a = this._getModifiers(e), ctrlKey = _a.ctrlKey, altKey = _a.altKey, macCmdKey = _a.macCmdKey;
        if (ctrlKey || altKey || macCmdKey) {
            return false;
        }
        return ((48 <= keyCode && keyCode <= 57) ||
            (65 <= keyCode && keyCode <= 90) ||
            (96 <= keyCode && keyCode <= 111) ||
            (186 <= keyCode && keyCode <= 222));
    };
    KeyboardController.prototype._moveSelection = function (shiftKey, cmdKey, direction, distance) {
        var _a = this._state, active = _a.active, rows = _a.rows, columns = _a.columns, selection = _a.selection;
        var nextScroll = null;
        var nextActive = null;
        var nextSelection = null;
        if (shiftKey && cmdKey) {
            var _b = this._splitSelection(selection), prev = _b.prev, last = _b.last;
            var next = null;
            switch (direction) {
                case 'left':
                    next = __assign({}, last, { column: 0, width: active.column });
                    nextScroll = {
                        row: null,
                        column: 0
                    };
                    break;
                case 'up':
                    next = __assign({}, last, { row: 0, height: active.row });
                    nextScroll = {
                        row: 0,
                        column: null
                    };
                    break;
                case 'right':
                    next = __assign({}, last, { column: active.column, width: columns - active.column - 1 });
                    nextScroll = {
                        row: null,
                        column: columns - 1
                    };
                    break;
                case 'down':
                    next = __assign({}, last, { row: active.row, height: rows - active.row - 1 });
                    nextScroll = {
                        row: rows - 1,
                        column: null
                    };
                    break;
            }
            if (next) {
                nextSelection = prev.concat([
                    next
                ]);
            }
        }
        else if (cmdKey) {
            switch (direction) {
                case 'left':
                    nextActive = this._clampAddress({ row: active.row, column: 0 });
                    break;
                case 'up':
                    nextActive = this._clampAddress({ row: 0, column: active.column });
                    break;
                case 'right':
                    nextActive = this._clampAddress({ row: active.row, column: columns - 1 });
                    break;
                case 'down':
                    nextActive = this._clampAddress({ row: rows - 1, column: active.column });
                    break;
            }
            nextScroll = nextActive;
            nextSelection = [__assign({}, nextActive, { width: 0, height: 0 })];
        }
        else if (shiftKey) {
            var _c = this._splitSelection(selection), prev = _c.prev, last = _c.last;
            var next = null;
            var delta = distance;
            switch (direction) {
                case 'left':
                    if (last.column + last.width === active.column) {
                        if (last.column) {
                            var newColumn = last.column - distance;
                            if (newColumn < 0) {
                                delta = distance + newColumn;
                                newColumn = 0;
                            }
                            next = __assign({}, last, { column: newColumn, width: last.width + delta });
                            nextScroll = {
                                column: next.column,
                                row: null
                            };
                        }
                    }
                    else if (last.width) {
                        var newWidth = last.width - distance;
                        if (newWidth < 0) {
                            delta = distance + newWidth;
                            newWidth = 0;
                        }
                        next = __assign({}, last, { column: last.column, width: newWidth });
                        nextScroll = {
                            column: next.column + last.width - delta,
                            row: null
                        };
                    }
                    break;
                case 'up':
                    if (last.row + last.height === active.row) {
                        if (last.row) {
                            var newRow = last.row - distance;
                            if (newRow < 0) {
                                delta = distance + newRow;
                                newRow = 0;
                            }
                            next = __assign({}, last, { row: newRow, height: last.height + delta });
                            nextScroll = {
                                column: null,
                                row: next.row
                            };
                        }
                    }
                    else if (last.height) {
                        var newHeight = last.height - distance;
                        if (newHeight < 0) {
                            delta = distance + newHeight;
                            newHeight = 0;
                        }
                        next = __assign({}, last, { row: last.row, height: newHeight });
                        nextScroll = {
                            column: null,
                            row: next.row + last.height - delta
                        };
                    }
                    break;
                case 'right':
                    if (last.column === active.column) {
                        var lastPos = last.column + last.width;
                        if (lastPos < columns - 1) {
                            if (lastPos + distance > columns - 1) {
                                delta = (distance >= columns - 1 - lastPos
                                    ? columns - 1 - last.column
                                    : last.width + distance - columns - 1);
                            }
                            next = __assign({}, last, { width: last.width + delta });
                            nextScroll = {
                                column: next.column + next.width,
                                row: null
                            };
                        }
                    }
                    else if (last.width) {
                        if (last.column + delta > active.column) {
                            delta = active.column - last.column;
                        }
                        next = __assign({}, last, { column: last.column + delta, width: last.width - delta });
                        nextScroll = {
                            column: next.column,
                            row: null
                        };
                    }
                    break;
                case 'down':
                    if (last.row === active.row) {
                        var lastPos = last.row + last.height;
                        if (lastPos < rows - 1) {
                            if (lastPos + distance > rows - 1) {
                                delta = (distance >= rows - 1 - lastPos
                                    ? rows - 1 - last.row
                                    : lastPos + distance - rows - 1);
                            }
                            next = __assign({}, last, { height: last.height + delta });
                            nextScroll = {
                                column: null,
                                row: next.row + next.height
                            };
                        }
                    }
                    else if (last.height) {
                        if (last.row + delta > active.row) {
                            delta = active.row - last.row;
                        }
                        next = __assign({}, last, { row: last.row + delta, height: last.height - delta });
                        nextScroll = {
                            column: null,
                            row: next.row
                        };
                    }
                    break;
            }
            if (next) {
                nextSelection = prev.concat([
                    next
                ]);
            }
        }
        else {
            switch (direction) {
                case 'left':
                    nextActive = this._clampAddress({ row: active.row, column: active.column - distance });
                    break;
                case 'up':
                    nextActive = this._clampAddress({ row: active.row - distance, column: active.column });
                    break;
                case 'right':
                    nextActive = this._clampAddress({ row: active.row, column: active.column + distance });
                    break;
                case 'down':
                    nextActive = this._clampAddress({ row: active.row + distance, column: active.column });
                    break;
            }
            nextScroll = nextActive;
            nextSelection = [__assign({}, nextActive, { width: 0, height: 0 })];
        }
        if (nextActive || nextSelection) {
            this._props.onUpdateSelection({
                active: nextActive,
                selection: nextSelection
            });
        }
        if (nextScroll) {
            this._props.onScroll(nextScroll);
        }
    };
    KeyboardController.prototype._onTab = function (e, callback) {
        var _this = this;
        e.preventDefault();
        var _a = this._getModifiers(e), shiftKey = _a.shiftKey, cmdKey = _a.cmdKey;
        var _b = this._state, active = _b.active, rows = _b.rows, columns = _b.columns, selection = _b.selection;
        if (cmdKey) {
            return;
        }
        var last = this._splitSelection(selection).last;
        var firstRow = 0;
        var firstColumn = 0;
        var lastRow = rows - 1;
        var lastColumn = columns - 1;
        var insideSelection = false;
        active = __assign({}, active);
        if (last.height || last.width) {
            insideSelection = true;
            firstRow = last.row;
            firstColumn = last.column;
            lastRow = firstRow + last.height;
            lastColumn = firstColumn + last.width;
        }
        if (shiftKey) {
            active.column--;
            if (active.column < firstColumn) {
                active.column = lastColumn;
                active.row--;
            }
            if (active.row < firstRow) {
                active.row = lastRow;
            }
        }
        else {
            active.column++;
            if (active.column > lastColumn) {
                active.column = firstColumn;
                active.row++;
            }
            if (active.row > lastRow) {
                active.row = firstRow;
            }
        }
        this._props.onUpdateSelection({
            active: active,
            selection: (insideSelection
                ? null
                : [__assign({}, active, { height: 0, width: 0 })])
        }, function () {
            _this._props.onScroll(active);
            if (callback) {
                callback();
            }
        });
    };
    KeyboardController.prototype._onEnter = function (e, callback) {
        var _this = this;
        e.preventDefault();
        var _a = this._getModifiers(e), shiftKey = _a.shiftKey, cmdKey = _a.cmdKey;
        var _b = this._state, active = _b.active, rows = _b.rows, selection = _b.selection;
        if (cmdKey) {
            this._props.onOpenEditor(active);
            return;
        }
        var last = this._splitSelection(selection).last;
        var firstRow = 0;
        var firstColumn = active.column;
        var lastRow = rows - 1;
        var lastColumn = active.column;
        var insideSelection = false;
        active = __assign({}, active);
        if (last.height || last.width) {
            insideSelection = true;
            firstRow = last.row;
            firstColumn = last.column;
            lastRow = firstRow + last.height;
            lastColumn = firstColumn + last.width;
        }
        if (shiftKey) {
            active.row--;
            if (insideSelection) {
                if (active.row < firstRow) {
                    active.row = lastRow;
                    active.column--;
                }
                if (active.column < firstColumn) {
                    active.column = lastColumn;
                }
            }
            else if (active.row < 0) {
                active.row = 0;
            }
        }
        else {
            active.row++;
            if (insideSelection) {
                if (active.row > lastRow) {
                    active.row = firstRow;
                    active.column++;
                }
                if (active.column > lastColumn) {
                    active.column = firstColumn;
                }
            }
            else if (active.row > rows - 1) {
                active.row = rows - 1;
            }
        }
        this._props.onUpdateSelection({
            active: active,
            selection: (insideSelection
                ? null
                : [__assign({}, active, { height: 0, width: 0 })])
        }, function () {
            _this._props.onScroll(active);
            if (callback) {
                callback();
            }
        });
    };
    KeyboardController.prototype._onSpace = function (e) {
        e.preventDefault();
        if (this._state.readOnly) {
            return;
        }
        var cells = this._getSelectedCells(this._state.selection);
        this._props.onSpace(cells);
    };
    KeyboardController.prototype._onPageUpDown = function (e) {
        e.preventDefault();
        var _a = this._getModifiers(e), shiftKey = _a.shiftKey, cmdKey = _a.cmdKey, altKey = _a.altKey;
        var view = this._state.view;
        var direction = (e.keyCode === 33
            ? altKey
                ? 'left'
                : 'up'
            : altKey
                ? 'right'
                : 'down');
        var pageColumns = view.lastColumn - view.firstColumn;
        var pageRows = view.lastRow - view.firstRow;
        switch (e.keyCode) {
            case 37:
                direction = 'left';
                break;
            case 38:
                direction = 'up';
                break;
            case 39:
                direction = 'right';
                break;
            case 40:
                direction = 'down';
                break;
        }
        this._moveSelection(shiftKey, cmdKey, direction, altKey ? pageColumns : pageRows);
    };
    KeyboardController.prototype._onHomeEnd = function (e) {
        var _a = this._getModifiers(e), shiftKey = _a.shiftKey, cmdKey = _a.cmdKey, altKey = _a.altKey;
        if (altKey) {
            return;
        }
        e.preventDefault();
        var direction = e.keyCode === 36 ? 'home' : 'end';
        var _b = this._state, active = _b.active, rows = _b.rows, columns = _b.columns, selection = _b.selection;
        var nextActive = null;
        var nextSelection = null;
        var nextScroll = {
            row: cmdKey ? direction === 'home' ? 0 : (rows - 1) : active.row,
            column: direction === 'home' ? 0 : (columns - 1)
        };
        if (shiftKey) {
            var prev = this._splitSelection(selection).prev;
            nextSelection = prev.concat([
                {
                    row: cmdKey && direction === 'home' ? 0 : active.row,
                    column: direction === 'home' ? 0 : active.column,
                    height: cmdKey ? (direction === 'home' ? active.row : rows - active.row - 1) : 0,
                    width: direction === 'home' ? active.column : columns - active.column - 1
                }
            ]);
        }
        else {
            nextActive = nextScroll;
            nextSelection = [__assign({}, nextActive, { width: 0, height: 0 })];
        }
        this._props.onUpdateSelection({
            active: nextActive,
            selection: nextSelection
        });
        this._props.onScroll(nextScroll);
    };
    KeyboardController.prototype._onArrows = function (e) {
        e.preventDefault();
        var _a = this._getModifiers(e), shiftKey = _a.shiftKey, cmdKey = _a.cmdKey;
        var direction;
        switch (e.keyCode) {
            case 37:
                direction = 'left';
                break;
            case 38:
                direction = 'up';
                break;
            case 39:
                direction = 'right';
                break;
            case 40:
                direction = 'down';
                break;
        }
        this._moveSelection(shiftKey, cmdKey, direction, 1);
    };
    KeyboardController.prototype._onCopy = function (withHeaders) {
        var cells = this._getSelectedCells(this._state.selection);
        this._props.onCopy(cells, withHeaders);
    };
    KeyboardController.prototype._onNullify = function () {
        if (this._state.readOnly) {
            return;
        }
        var cells = this._getSelectedCells(this._state.selection);
        this._props.onNullify(cells);
    };
    KeyboardController.prototype._onRemove = function () {
        if (this._state.readOnly) {
            return;
        }
        var rowMap = new Set();
        var colMap = new Set();
        this._getSelectedCells(this._state.selection).forEach(function (_a) {
            var column = _a.column, row = _a.row;
            rowMap.add(row);
            colMap.add(column);
        });
        this._props.onRemove({
            rows: Array.from(rowMap).sort(),
            columns: Array.from(colMap).sort()
        });
    };
    KeyboardController.prototype._onSelectAll = function (e) {
        e.preventDefault();
        var cmdKey = this._getModifiers(e).cmdKey;
        if (!cmdKey) {
            return;
        }
        var _a = this._state, rows = _a.rows, columns = _a.columns;
        this._props.onUpdateSelection({
            selection: [{
                    row: 0,
                    column: 0,
                    width: columns - 1,
                    height: rows - 1
                }]
        });
    };
    KeyboardController.prototype._onData = function (e) {
        var _a = this._getModifiers(e), cmdKey = _a.cmdKey, altKey = _a.altKey, shiftKey = _a.shiftKey;
        switch (e.keyCode) {
            case 45: // insert
                if (!cmdKey) {
                    break;
                }
                e.preventDefault();
                this._onCopy(shiftKey || altKey);
                break;
            case 8: // backspace
            case 46: // delete
                e.preventDefault();
                if (shiftKey && !cmdKey) {
                    this._onCopy(false);
                    this._onNullify();
                }
                else if (!shiftKey && cmdKey) {
                    this._onRemove();
                }
                else if (!shiftKey && !cmdKey) {
                    this._onNullify();
                }
                break;
            case 67: // c
                if (!cmdKey) {
                    break;
                }
                e.preventDefault();
                this._onCopy(shiftKey || altKey);
                break;
            case 86: // v
                if (!cmdKey) {
                    break;
                }
                // this._onPaste();
                break;
            case 88: // x
                if (!cmdKey) {
                    break;
                }
                e.preventDefault();
                this._onCopy(false);
                this._onNullify();
                break;
        }
    };
    KeyboardController.prototype.keydown = function (e) {
        var _this = this;
        var _a = this._request(), enabled = _a.enabled, editor = _a.editor, active = _a.active, focused = _a.focused, rows = _a.rows, columns = _a.columns;
        if (!enabled || !rows || !columns) {
            return;
        }
        if (editor) {
            switch (e.keyCode) {
                case 9: // tab
                    this._props.onCloseEditor(true, function () {
                        _this._onTab(e, function () {
                            _this._props.onOpenEditor(_this._request().active);
                        });
                    });
                    break;
                case 13: // enter
                    this._props.onCloseEditor(true, function () {
                        _this._onEnter(e, function () {
                            _this._props.onOpenEditor(_this._request().active);
                        });
                    });
                    break;
                case 27: // esc
                    this._props.onCloseEditor(false);
                    break;
            }
            return;
        }
        if (!focused) {
            return;
        }
        if (this._isInput(e)) {
            this._props.onOpenEditor(active);
            return;
        }
        switch (e.keyCode) {
            case 9: // tab
                this._onTab(e);
                break;
            case 13: // enter
                this._onEnter(e);
                break;
            case 32: // space
                this._onSpace(e);
                break;
            case 33: // page up
            case 34: // page down
                this._onPageUpDown(e);
                break;
            case 35: // end
            case 36: // home
                this._onHomeEnd(e);
                break;
            case 37: // left
            case 38: // up
            case 39: // right
            case 40: // down
                this._onArrows(e);
                break;
            case 65: // a
                this._onSelectAll(e);
                break;
            case 8: // backspace
            case 45: // insert
            case 46: // delete
            case 67: // c
            case 86: // v
            case 88: // x
                this._onData(e);
                break;
            case 113: // F2
                this._props.onOpenEditor(__assign({}, active));
                break;
        }
    };
    KeyboardController.prototype.dispose = function () {
        document.body.removeEventListener('paste', this._paste);
    };
    return KeyboardController;
}(base_controller_1.Controller));
exports.KeyboardController = KeyboardController;
exports.default = KeyboardController;

//# sourceMappingURL=keyboard-controller.js.map
