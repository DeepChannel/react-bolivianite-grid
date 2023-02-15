import { HeaderType } from './types';
import { Controller } from './base-controller';
export class MouseController extends Controller {
    constructor(_props) {
        super(_props);
        this._props = _props;
        this._lastMouseDown = {
            time: 0,
            row: -1,
            column: -1
        };
        this._down = null;
        this._scrollBySelect = null;
        this._scrollTask = null;
        this._autoscroll = () => {
            if (!this._scrollBySelect) {
                return;
            }
            let { rows, columns, view } = this._request();
            let { h, v } = this._scrollBySelect;
            let scroll = {
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
            this._props.onScroll(scroll);
        };
        this._mouseup = () => {
            this._down = null;
            this.rootenter();
        };
        window.addEventListener('mouseup', this._mouseup);
    }
    _mouseSelectFromActive(row, column) {
        let { selection, active } = this._state;
        let { prev } = this._splitSelection(selection);
        let last = { row, column, width: 0, height: 0 };
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
            selection: [
                ...prev,
                last
            ]
        });
    }
    rootleave(x, y, rect) {
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
    }
    rootenter() {
        if (this._scrollTask) {
            clearInterval(this._scrollTask);
            this._scrollTask = null;
        }
        this._scrollBySelect = null;
    }
    mouseenter(row, column) {
        if (!this._down) {
            return;
        }
        this._request();
        this._mouseSelectFromActive(row, column);
    }
    headerdown(e, type, first, last = first) {
        if (e.defaultPrevented) {
            return;
        }
        e.preventDefault();
        if (e.button !== 0) {
            return;
        }
        const { enabled, editor, rows, columns } = this._request();
        if (!enabled || editor) {
            return;
        }
        let active = {
            row: type === HeaderType.Column ? 0 : first,
            column: type === HeaderType.Column ? first : 0
        };
        this._props.onUpdateSelection({
            active,
            selection: [Object.assign({}, active, { height: type === HeaderType.Column ? rows - 1 : last - first, width: type === HeaderType.Column ? last - first : columns - 1 })]
        });
    }
    mousedown(e, row, column) {
        const { enabled, selection, editor } = this._request();
        if (!enabled) {
            return;
        }
        const { cmdKey, shiftKey } = this._getModifiers(e);
        const clickInEditor = editor && editor.row === row && editor.column === column;
        if (!clickInEditor && e.button !== 1) {
            e.preventDefault();
        }
        if (editor && !clickInEditor && e.button !== 1) {
            this._props.onCloseEditor(true);
        }
        if (!cmdKey && shiftKey && e.button === 0) {
            this._mouseSelectFromActive(row, column);
            this._down = { row, column };
        }
        else if (cmdKey && !shiftKey && e.button == 0) {
            this._props.onUpdateSelection({
                active: { row, column },
                selection: [
                    ...selection,
                    { row, column, height: 0, width: 0 }
                ]
            });
            this._down = { row, column };
        }
        else if (e.button === 0) {
            this._props.onUpdateSelection({
                active: { row, column },
                selection: [{ row, column, height: 0, width: 0 }]
            });
            let t = Date.now();
            let openEditor = (!clickInEditor &&
                t - this._lastMouseDown.time < 500 &&
                this._lastMouseDown.row === row &&
                this._lastMouseDown.column === column);
            this._lastMouseDown.time = t;
            this._lastMouseDown.row = row;
            this._lastMouseDown.column = column;
            if (openEditor) {
                this._down = null;
                if (editor) {
                    this._props.onCloseEditor(true, () => {
                        this._props.onOpenEditor({ row, column });
                    });
                }
                else {
                    this._props.onOpenEditor({ row, column });
                }
            }
            else {
                this._down = { row, column };
            }
        }
        else if (e.button === 2) {
            e.persist();
            let cell = { row, column };
            let inside = this._isInsideSelection(cell, selection);
            let select = () => {
                this._props.onUpdateSelection({
                    active: { row, column },
                    selection: [{ row, column, height: 0, width: 0 }]
                });
            };
            this._props.onRightClick(cell, e, select, inside);
        }
    }
    dispose() {
        this.rootenter();
        window.removeEventListener('mouseup', this._mouseup);
    }
}
export default MouseController;

//# sourceMappingURL=mouse-controller.js.map
