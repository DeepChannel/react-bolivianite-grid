import { Controller } from './base-controller';
export class KeyboardController extends Controller {
    constructor(_props) {
        super(_props);
        this._props = _props;
        this._paste = (e) => {
            const { enabled, focused, readOnly, selection } = this._props.getState();
            if (!enabled || !focused || readOnly) {
                return;
            }
            this._props.onPaste({
                clipboard: e.clipboardData,
                isReadOnly: (a) => {
                    return this._props.onReadOnly(a, 'paste');
                },
                getAllSelectedCells: () => {
                    return this._getSelectedCells(selection);
                },
                getLastSelectedCells: () => {
                    let { last } = this._splitSelection(selection);
                    return this._getSelectedCells([last]);
                }
            });
        };
        document.body.addEventListener('paste', this._paste);
    }
    _isInput(e) {
        const { keyCode } = e;
        const { ctrlKey, altKey, macCmdKey } = this._getModifiers(e);
        if (ctrlKey || altKey || macCmdKey) {
            return false;
        }
        return ((48 <= keyCode && keyCode <= 57) ||
            (65 <= keyCode && keyCode <= 90) ||
            (96 <= keyCode && keyCode <= 111) ||
            (186 <= keyCode && keyCode <= 222));
    }
    _moveSelection(shiftKey, cmdKey, direction, distance) {
        const { active, rows, columns, selection } = this._state;
        let nextScroll = null;
        let nextActive = null;
        let nextSelection = null;
        if (shiftKey && cmdKey) {
            let { prev, last } = this._splitSelection(selection);
            let next = null;
            switch (direction) {
                case 'left':
                    next = Object.assign({}, last, { column: 0, width: active.column });
                    nextScroll = {
                        row: null,
                        column: 0
                    };
                    break;
                case 'up':
                    next = Object.assign({}, last, { row: 0, height: active.row });
                    nextScroll = {
                        row: 0,
                        column: null
                    };
                    break;
                case 'right':
                    next = Object.assign({}, last, { column: active.column, width: columns - active.column - 1 });
                    nextScroll = {
                        row: null,
                        column: columns - 1
                    };
                    break;
                case 'down':
                    next = Object.assign({}, last, { row: active.row, height: rows - active.row - 1 });
                    nextScroll = {
                        row: rows - 1,
                        column: null
                    };
                    break;
            }
            if (next) {
                nextSelection = [
                    ...prev,
                    next
                ];
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
            nextSelection = [Object.assign({}, nextActive, { width: 0, height: 0 })];
        }
        else if (shiftKey) {
            let { prev, last } = this._splitSelection(selection);
            let next = null;
            let delta = distance;
            switch (direction) {
                case 'left':
                    if (last.column + last.width === active.column) {
                        if (last.column) {
                            let newColumn = last.column - distance;
                            if (newColumn < 0) {
                                delta = distance + newColumn;
                                newColumn = 0;
                            }
                            next = Object.assign({}, last, { column: newColumn, width: last.width + delta });
                            nextScroll = {
                                column: next.column,
                                row: null
                            };
                        }
                    }
                    else if (last.width) {
                        let newWidth = last.width - distance;
                        if (newWidth < 0) {
                            delta = distance + newWidth;
                            newWidth = 0;
                        }
                        next = Object.assign({}, last, { column: last.column, width: newWidth });
                        nextScroll = {
                            column: next.column + last.width - delta,
                            row: null
                        };
                    }
                    break;
                case 'up':
                    if (last.row + last.height === active.row) {
                        if (last.row) {
                            let newRow = last.row - distance;
                            if (newRow < 0) {
                                delta = distance + newRow;
                                newRow = 0;
                            }
                            next = Object.assign({}, last, { row: newRow, height: last.height + delta });
                            nextScroll = {
                                column: null,
                                row: next.row
                            };
                        }
                    }
                    else if (last.height) {
                        let newHeight = last.height - distance;
                        if (newHeight < 0) {
                            delta = distance + newHeight;
                            newHeight = 0;
                        }
                        next = Object.assign({}, last, { row: last.row, height: newHeight });
                        nextScroll = {
                            column: null,
                            row: next.row + last.height - delta
                        };
                    }
                    break;
                case 'right':
                    if (last.column === active.column) {
                        let lastPos = last.column + last.width;
                        if (lastPos < columns - 1) {
                            if (lastPos + distance > columns - 1) {
                                delta = (distance >= columns - 1 - lastPos
                                    ? columns - 1 - last.column
                                    : last.width + distance - columns - 1);
                            }
                            next = Object.assign({}, last, { width: last.width + delta });
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
                        next = Object.assign({}, last, { column: last.column + delta, width: last.width - delta });
                        nextScroll = {
                            column: next.column,
                            row: null
                        };
                    }
                    break;
                case 'down':
                    if (last.row === active.row) {
                        let lastPos = last.row + last.height;
                        if (lastPos < rows - 1) {
                            if (lastPos + distance > rows - 1) {
                                delta = (distance >= rows - 1 - lastPos
                                    ? rows - 1 - last.row
                                    : lastPos + distance - rows - 1);
                            }
                            next = Object.assign({}, last, { height: last.height + delta });
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
                        next = Object.assign({}, last, { row: last.row + delta, height: last.height - delta });
                        nextScroll = {
                            column: null,
                            row: next.row
                        };
                    }
                    break;
            }
            if (next) {
                nextSelection = [
                    ...prev,
                    next
                ];
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
            nextSelection = [Object.assign({}, nextActive, { width: 0, height: 0 })];
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
    }
    _onTab(e, callback) {
        e.preventDefault();
        const { shiftKey, cmdKey } = this._getModifiers(e);
        let { active, rows, columns, selection } = this._state;
        if (cmdKey) {
            return;
        }
        let { last } = this._splitSelection(selection);
        let firstRow = 0;
        let firstColumn = 0;
        let lastRow = rows - 1;
        let lastColumn = columns - 1;
        let insideSelection = false;
        active = Object.assign({}, active);
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
                : [Object.assign({}, active, { height: 0, width: 0 })])
        }, () => {
            this._props.onScroll(active);
            if (callback) {
                callback();
            }
        });
    }
    _onEnter(e, callback) {
        e.preventDefault();
        const { shiftKey, cmdKey } = this._getModifiers(e);
        let { active, rows, selection } = this._state;
        if (cmdKey) {
            this._props.onOpenEditor(active);
            return;
        }
        let { last } = this._splitSelection(selection);
        let firstRow = 0;
        let firstColumn = active.column;
        let lastRow = rows - 1;
        let lastColumn = active.column;
        let insideSelection = false;
        active = Object.assign({}, active);
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
                : [Object.assign({}, active, { height: 0, width: 0 })])
        }, () => {
            this._props.onScroll(active);
            if (callback) {
                callback();
            }
        });
    }
    _onSpace(e) {
        e.preventDefault();
        if (this._state.readOnly) {
            return;
        }
        const cells = this._getSelectedCells(this._state.selection);
        this._props.onSpace(cells);
    }
    _onPageUpDown(e) {
        e.preventDefault();
        const { shiftKey, cmdKey, altKey } = this._getModifiers(e);
        let { view } = this._state;
        let direction = (e.keyCode === 33
            ? altKey
                ? 'left'
                : 'up'
            : altKey
                ? 'right'
                : 'down');
        let pageColumns = view.lastColumn - view.firstColumn;
        let pageRows = view.lastRow - view.firstRow;
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
    }
    _onHomeEnd(e) {
        const { shiftKey, cmdKey, altKey } = this._getModifiers(e);
        if (altKey) {
            return;
        }
        e.preventDefault();
        let direction = e.keyCode === 36 ? 'home' : 'end';
        let { active, rows, columns, selection } = this._state;
        let nextActive = null;
        let nextSelection = null;
        let nextScroll = {
            row: cmdKey ? direction === 'home' ? 0 : (rows - 1) : active.row,
            column: direction === 'home' ? 0 : (columns - 1)
        };
        if (shiftKey) {
            let { prev } = this._splitSelection(selection);
            nextSelection = [
                ...prev,
                {
                    row: cmdKey && direction === 'home' ? 0 : active.row,
                    column: direction === 'home' ? 0 : active.column,
                    height: cmdKey ? (direction === 'home' ? active.row : rows - active.row - 1) : 0,
                    width: direction === 'home' ? active.column : columns - active.column - 1
                }
            ];
        }
        else {
            nextActive = nextScroll;
            nextSelection = [Object.assign({}, nextActive, { width: 0, height: 0 })];
        }
        this._props.onUpdateSelection({
            active: nextActive,
            selection: nextSelection
        });
        this._props.onScroll(nextScroll);
    }
    _onArrows(e) {
        e.preventDefault();
        const { shiftKey, cmdKey } = this._getModifiers(e);
        let direction;
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
    }
    _onCopy(withHeaders) {
        const cells = this._getSelectedCells(this._state.selection);
        this._props.onCopy(cells, withHeaders);
    }
    _onNullify() {
        if (this._state.readOnly) {
            return;
        }
        const cells = this._getSelectedCells(this._state.selection);
        this._props.onNullify(cells);
    }
    _onRemove() {
        if (this._state.readOnly) {
            return;
        }
        let rowMap = new Set();
        let colMap = new Set();
        this._getSelectedCells(this._state.selection).forEach(({ column, row }) => {
            rowMap.add(row);
            colMap.add(column);
        });
        this._props.onRemove({
            rows: Array.from(rowMap).sort(),
            columns: Array.from(colMap).sort()
        });
    }
    _onSelectAll(e) {
        e.preventDefault();
        const { cmdKey } = this._getModifiers(e);
        if (!cmdKey) {
            return;
        }
        let { rows, columns } = this._state;
        this._props.onUpdateSelection({
            selection: [{
                    row: 0,
                    column: 0,
                    width: columns - 1,
                    height: rows - 1
                }]
        });
    }
    _onData(e) {
        const { cmdKey, altKey, shiftKey } = this._getModifiers(e);
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
    }
    keydown(e) {
        const { enabled, editor, active, focused, rows, columns } = this._request();
        if (!enabled || !rows || !columns) {
            return;
        }
        if (editor) {
            switch (e.keyCode) {
                case 9: // tab
                    this._props.onCloseEditor(true, () => {
                        this._onTab(e, () => {
                            this._props.onOpenEditor(this._request().active);
                        });
                    });
                    break;
                case 13: // enter
                    this._props.onCloseEditor(true, () => {
                        this._onEnter(e, () => {
                            this._props.onOpenEditor(this._request().active);
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
                this._props.onOpenEditor(Object.assign({}, active));
                break;
        }
    }
    dispose() {
        document.body.removeEventListener('paste', this._paste);
    }
}
export default KeyboardController;

//# sourceMappingURL=keyboard-controller.js.map
