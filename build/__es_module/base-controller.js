const IS_MACOS = navigator.platform.slice(0, 3) === 'Mac';
export class Controller {
    constructor(_props) {
        this._props = _props;
        this._state = null;
    }
    _getModifiers(e) {
        const { ctrlKey, altKey, shiftKey } = e;
        const cmdKey = e.getModifierState('Meta'); // Command key for Mac OS
        return {
            ctrlKey,
            macCmdKey: cmdKey,
            cmdKey: IS_MACOS ? cmdKey : ctrlKey,
            shiftKey,
            altKey
        };
    }
    _clampAddress({ column, row }) {
        const { rows, columns } = this._state;
        return {
            column: Math.min(Math.max(0, column), columns - 1),
            row: Math.min(Math.max(0, row), rows - 1)
        };
    }
    _splitSelection(selection) {
        let prev = selection.slice();
        let last = prev.pop();
        return {
            prev, last
        };
    }
    _getSelectedCells(selection) {
        let lock = new Set();
        let list = [];
        for (const { column, row, height, width } of selection) {
            for (let r = row, rLast = row + height; r <= rLast; r++) {
                for (let c = column, cLast = column + width; c <= cLast; c++) {
                    let key = `${r}x${c}`;
                    if (lock.has(key)) {
                        continue;
                    }
                    lock.add(key);
                    list.push({ row: r, column: c });
                }
            }
        }
        return list;
    }
    _isInsideSelection({ column: c, row: r }, selection) {
        return selection.findIndex(({ row, column, height, width }) => {
            return row <= r && r <= (row + height) && column <= c && c <= (column + width);
        }) !== -1;
    }
    _request() {
        return this._state = this._props.getState();
    }
}

//# sourceMappingURL=base-controller.js.map
