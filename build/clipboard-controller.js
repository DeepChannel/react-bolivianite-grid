"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ClipboardController = /** @class */ (function () {
    function ClipboardController(props) {
        var _this = this;
        this.props = props;
        this.onCopy = function (_a) {
            var cells = _a.cells, repository = _a.repository, data = _a.data, withHeaders = _a.withHeaders, focus = _a.focus;
            var table = _this._getValidatedTable(cells);
            if (!table) {
                if (_this.props.onInvalidSelection) {
                    _this.props.onInvalidSelection();
                }
                return;
            }
            var out = table.map(function (r) { return r.map(function (c) { return _this.props.renderCell({ data: data, repository: repository, cell: c }); }); });
            if (withHeaders && (repository.offsetWidth || repository.offsetHeight)) {
                var lock_1 = new Set();
                var top_1 = [];
                var left_1 = [];
                var columnLine = table[0];
                var rowLine = table.map(function (r) { return r[0]; });
                var columnLen_1 = columnLine.length;
                var rowLen_1 = rowLine.length;
                // render column headers
                if (repository.offsetHeight) {
                    columnLine.forEach(function (_a, c) {
                        var column = _a.column;
                        var h = repository.columns[column];
                        var level = repository.getLevel(h);
                        do {
                            top_1[level] = top_1[level] || new Array(columnLen_1).fill('');
                            top_1[level][c] = _this._renderHeader(h, repository.getHeaderType(h), lock_1);
                        } while (level--, h = repository.getParent(h));
                    });
                }
                // render row headers
                if (repository.offsetWidth) {
                    rowLine.forEach(function (_a, r) {
                        var row = _a.row;
                        var h = repository.rows[row];
                        var level = repository.getLevel(h);
                        do {
                            left_1[level] = left_1[level] || new Array(rowLen_1).fill('');
                            left_1[level][r] = _this._renderHeader(h, repository.getHeaderType(h), lock_1);
                        } while (level--, h = repository.getParent(h));
                    });
                }
                // insert padding for top headers
                var paddingLeft_1 = left_1.length;
                left_1 = _this._transpose(left_1);
                top_1 = top_1.map(function (line) { return (new Array(paddingLeft_1).fill('')).concat(line); });
                // insert left headers
                out = out.map(function (line, r) { return (left_1[r] || []).concat((line || [])); });
                out = top_1.concat(out);
            }
            _this.props.onCopy({ table: out, focus: focus });
        };
        this.onPaste = function (_a) {
            var clipboard = _a.clipboard, target = _a.target, isReadOnly = _a.isReadOnly;
            var table = _this.props.clipboardParser(clipboard);
            if (!Array.isArray(table) || !table.length || !Array.isArray(table[0]) || !table[0].length) {
                return;
            }
            var changes = [];
            for (var r = 0, rLen = table.length; r < rLen; r++) {
                for (var c = 0, cLen = table[r].length; c < cLen; c++) {
                    var column = target.column + c;
                    var row = target.row + r;
                    if (isReadOnly({ row: row, column: column })) {
                        continue;
                    }
                    changes.push({
                        column: column,
                        row: row,
                        value: _this.props.cellParser({
                            column: column,
                            row: row,
                            value: table[r][c]
                        })
                    });
                }
            }
            if (changes.length) {
                _this.props.onPaste({ changes: changes });
            }
        };
    }
    ClipboardController.prototype._getValidatedTable = function (cells) {
        var table = [];
        cells.forEach(function (cell) {
            if (!table[cell.row]) {
                table[cell.row] = [];
            }
            table[cell.row][cell.column] = cell;
        });
        var first = null;
        var firstLen = -1;
        var validated = table.every(function (r) {
            if (!first) {
                firstLen = (first = r).filter(function (v) { return !!v; }).length;
                return true;
            }
            return firstLen === r.filter(function (v) { return !!v; }).length && first.every(function (c, j) { return r[j] && r[j].column === c.column; });
        });
        if (!validated) {
            return null;
        }
        return table.filter(function (v) { return !!v; }).map(function (r) { return r.filter(function (c) { return !!c; }); });
    };
    ClipboardController.prototype._renderHeader = function (header, type, lock) {
        if (lock.has(header.$id)) {
            return '';
        }
        lock.add(header.$id);
        return this.props.renderHeader({ header: header, type: type });
    };
    ClipboardController.prototype._transpose = function (table) {
        var out = [];
        for (var r = 0, rLen = table.length; r < rLen; r++) {
            for (var c = 0, cLen = table[r].length; c < cLen; c++) {
                (out[c] = out[c] || [])[r] = table[r][c];
            }
        }
        return out;
    };
    return ClipboardController;
}());
exports.ClipboardController = ClipboardController;

//# sourceMappingURL=clipboard-controller.js.map
