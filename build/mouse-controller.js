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
var types_1 = require("./types");
var base_controller_1 = require("./base-controller");
var MouseController = /** @class */ (function (_super) {
    __extends(MouseController, _super);
    function MouseController(_props) {
        var _this = _super.call(this, _props) || this;
        _this._props = _props;
        _this._lastMouseDown = {
            time: 0,
            row: -1,
            column: -1
        };
        _this._down = null;
        _this._scrollBySelect = null;
        _this._scrollTask = null;
        _this._autoscroll = function () {
            if (!_this._scrollBySelect) {
                return;
            }
            var _a = _this._request(), rows = _a.rows, columns = _a.columns, view = _a.view;
            var _b = _this._scrollBySelect, h = _b.h, v = _b.v;
            var scroll = {
                row: null,
                column: null
            };
            if (h === 'L') {
                if (view.firstColumn) {
                    scroll.column = view.firstColumn - 1;
                }
            }
            else if (h === 'R') {
                if (view.lastColumn !== columns - 1) {
                    scroll.column = view.lastColumn + 1;
                }
            }
            if (v === 'T') {
                if (view.firstRow) {
                    scroll.row = view.firstRow - 1;
                }
            }
            else if (v === 'B') {
                if (view.lastRow !== rows - 1) {
                    scroll.row = view.lastRow + 1;
                }
            }
            _this._props.onScroll(scroll);
        };
        _this._mouseup = function () {
            _this._down = null;
            _this.rootenter();
        };
        window.addEventListener('mouseup', _this._mouseup);
        return _this;
    }
    MouseController.prototype._mouseSelectFromActive = function (row, column) {
        var _a = this._state, selection = _a.selection, active = _a.active;
        var prev = this._splitSelection(selection).prev;
        var last = { row: row, column: column, width: 0, height: 0 };
        if (column <= active.column) {
            last.width = active.column - column;
        }
        else {
            last.column = active.column;
            last.width = column - active.column;
        }
        if (row <= active.row) {
            last.height = active.row - row;
        }
        else {
            last.row = active.row;
            last.height = row - active.row;
        }
        this._props.onUpdateSelection({
            selection: prev.concat([
                last
            ])
        });
    };
    MouseController.prototype.rootleave = function (x, y, rect) {
        if (!this._down) {
            return;
        }
        this._request();
        this._scrollBySelect = {
            h: null,
            v: null
        };
        if (x <= rect.left) {
            this._scrollBySelect.h = 'L';
        }
        else if (x >= rect.left + rect.width) {
            this._scrollBySelect.h = 'R';
        }
        if (y <= rect.top) {
            this._scrollBySelect.v = 'T';
        }
        else if (y >= rect.top + rect.height) {
            this._scrollBySelect.v = 'B';
        }
        this._scrollTask = setInterval(this._autoscroll, 50);
    };
    MouseController.prototype.rootenter = function () {
        if (this._scrollTask) {
            clearInterval(this._scrollTask);
            this._scrollTask = null;
        }
        this._scrollBySelect = null;
    };
    MouseController.prototype.mouseenter = function (row, column) {
        if (!this._down) {
            return;
        }
        this._request();
        this._mouseSelectFromActive(row, column);
    };
    MouseController.prototype.headerdown = function (e, type, first, last) {
        if (last === void 0) { last = first; }
        if (e.defaultPrevented) {
            return;
        }
        e.preventDefault();
        if (e.button !== 0) {
            return;
        }
        var _a = this._request(), enabled = _a.enabled, editor = _a.editor, rows = _a.rows, columns = _a.columns;
        if (!enabled || editor) {
            return;
        }
        var active = {
            row: type === types_1.HeaderType.Column ? 0 : first,
            column: type === types_1.HeaderType.Column ? first : 0
        };
        this._props.onUpdateSelection({
            active: active,
            selection: [__assign({}, active, { height: type === types_1.HeaderType.Column ? rows - 1 : last - first, width: type === types_1.HeaderType.Column ? last - first : columns - 1 })]
        });
    };
    MouseController.prototype.mousedown = function (e, row, column) {
        var _this = this;
        var _a = this._request(), enabled = _a.enabled, selection = _a.selection, editor = _a.editor;
        if (!enabled) {
            return;
        }
        var _b = this._getModifiers(e), cmdKey = _b.cmdKey, shiftKey = _b.shiftKey;
        var clickInEditor = editor && editor.row === row && editor.column === column;
        if (!clickInEditor && e.button !== 1) {
            e.preventDefault();
        }
        if (editor && !clickInEditor && e.button !== 1) {
            this._props.onCloseEditor(true);
        }
        if (!cmdKey && shiftKey && e.button === 0) {
            this._mouseSelectFromActive(row, column);
            this._down = { row: row, column: column };
        }
        else if (cmdKey && !shiftKey && e.button == 0) {
            this._props.onUpdateSelection({
                active: { row: row, column: column },
                selection: selection.concat([
                    { row: row, column: column, height: 0, width: 0 }
                ])
            });
            this._down = { row: row, column: column };
        }
        else if (e.button === 0) {
            this._props.onUpdateSelection({
                active: { row: row, column: column },
                selection: [{ row: row, column: column, height: 0, width: 0 }]
            });
            var t = Date.now();
            var openEditor = (!clickInEditor &&
                t - this._lastMouseDown.time < 500 &&
                this._lastMouseDown.row === row &&
                this._lastMouseDown.column === column);
            this._lastMouseDown.time = t;
            this._lastMouseDown.row = row;
            this._lastMouseDown.column = column;
            if (openEditor) {
                this._down = null;
                if (editor) {
                    this._props.onCloseEditor(true, function () {
                        _this._props.onOpenEditor({ row: row, column: column });
                    });
                }
                else {
                    this._props.onOpenEditor({ row: row, column: column });
                }
            }
            else {
                this._down = { row: row, column: column };
            }
        }
        else if (e.button === 2) {
            e.persist();
            var cell = { row: row, column: column };
            var inside = this._isInsideSelection(cell, selection);
            var select = function () {
                _this._props.onUpdateSelection({
                    active: { row: row, column: column },
                    selection: [{ row: row, column: column, height: 0, width: 0 }]
                });
            };
            this._props.onRightClick(cell, e, select, inside);
        }
    };
    MouseController.prototype.dispose = function () {
        this.rootenter();
        window.removeEventListener('mouseup', this._mouseup);
    };
    return MouseController;
}(base_controller_1.Controller));
exports.MouseController = MouseController;
exports.default = MouseController;

//# sourceMappingURL=mouse-controller.js.map
