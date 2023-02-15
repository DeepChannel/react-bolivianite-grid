export class ClipboardController {
    constructor(props) {
        this.props = props;
        this.onCopy = ({ cells, repository, data, withHeaders, focus }) => {
            let table = this._getValidatedTable(cells);
            if (!table) {
                if (this.props.onInvalidSelection) {
                    this.props.onInvalidSelection();
                }
                return;
            }
            let out = table.map(r => r.map(c => this.props.renderCell({ data, repository, cell: c })));
            if (withHeaders && (repository.offsetWidth || repository.offsetHeight)) {
                let lock = new Set();
                let top = [];
                let left = [];
                let columnLine = table[0];
                let rowLine = table.map(r => r[0]);
                let columnLen = columnLine.length;
                let rowLen = rowLine.length;
                // render column headers
                if (repository.offsetHeight) {
                    columnLine.forEach(({ column }, c) => {
                        let h = repository.columns[column];
                        let level = repository.getLevel(h);
                        do {
                            top[level] = top[level] || new Array(columnLen).fill('');
                            top[level][c] = this._renderHeader(h, repository.getHeaderType(h), lock);
                        } while (level--, h = repository.getParent(h));
                    });
                }
                // render row headers
                if (repository.offsetWidth) {
                    rowLine.forEach(({ row }, r) => {
                        let h = repository.rows[row];
                        let level = repository.getLevel(h);
                        do {
                            left[level] = left[level] || new Array(rowLen).fill('');
                            left[level][r] = this._renderHeader(h, repository.getHeaderType(h), lock);
                        } while (level--, h = repository.getParent(h));
                    });
                }
                // insert padding for top headers
                let paddingLeft = left.length;
                left = this._transpose(left);
                top = top.map((line) => [...(new Array(paddingLeft).fill('')), ...line]);
                // insert left headers
                out = out.map((line, r) => [...(left[r] || []), ...(line || [])]);
                out = [...top, ...out];
            }
            this.props.onCopy({ table: out, focus });
        };
        this.onPaste = ({ clipboard, target, isReadOnly }) => {
            let table = this.props.clipboardParser(clipboard);
            if (!Array.isArray(table) || !table.length || !Array.isArray(table[0]) || !table[0].length) {
                return;
            }
            let changes = [];
            for (let r = 0, rLen = table.length; r < rLen; r++) {
                for (let c = 0, cLen = table[r].length; c < cLen; c++) {
                    let column = target.column + c;
                    let row = target.row + r;
                    if (isReadOnly({ row, column })) {
                        continue;
                    }
                    changes.push({
                        column,
                        row,
                        value: this.props.cellParser({
                            column,
                            row,
                            value: table[r][c]
                        })
                    });
                }
            }
            if (changes.length) {
                this.props.onPaste({ changes });
            }
        };
    }
    _getValidatedTable(cells) {
        let table = [];
        cells.forEach((cell) => {
            if (!table[cell.row]) {
                table[cell.row] = [];
            }
            table[cell.row][cell.column] = cell;
        });
        let first = null;
        let firstLen = -1;
        let validated = table.every((r) => {
            if (!first) {
                firstLen = (first = r).filter(v => !!v).length;
                return true;
            }
            return firstLen === r.filter(v => !!v).length && first.every((c, j) => r[j] && r[j].column === c.column);
        });
        if (!validated) {
            return null;
        }
        return table.filter(v => !!v).map(r => r.filter(c => !!c));
    }
    _renderHeader(header, type, lock) {
        if (lock.has(header.$id)) {
            return '';
        }
        lock.add(header.$id);
        return this.props.renderHeader({ header, type });
    }
    _transpose(table) {
        let out = [];
        for (let r = 0, rLen = table.length; r < rLen; r++) {
            for (let c = 0, cLen = table[r].length; c < cLen; c++) {
                (out[c] = out[c] || [])[r] = table[r][c];
            }
        }
        return out;
    }
}

//# sourceMappingURL=clipboard-controller.js.map
