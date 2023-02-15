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
var React = require("react");
var PropType = require("prop-types");
var scroll_view_1 = require("./scroll-view");
var keyboard_controller_1 = require("./keyboard-controller");
var mouse_controller_1 = require("./mouse-controller");
var render_throttler_1 = require("./render-throttler");
var debounce_1 = require("./debounce");
var header_repository_1 = require("./header-repository");
var types_1 = require("./types");
var context_1 = require("./context");
var DUMMY_CELL_ADDRESS = { row: -1, column: -1 };
var Grid = /** @class */ (function (_super) {
    __extends(Grid, _super);
    //#endregion
    function Grid(p, c) {
        var _this = _super.call(this, p, c) || this;
        //#region properties
        _this._detached = false;
        _this._blockContextMenu = false;
        _this._onContextMenuListener = null;
        _this._rt = new render_throttler_1.default();
        _this._scrollUpdateTrottled = _this._rt.create();
        _this._ref = null;
        _this._refView = null;
        _this._scrollerStyle = { willChange: 'transform', zIndex: 0 };
        _this._lastView = null;
        _this._lastOverscan = null;
        _this._focused = false;
        _this._kbCtr = null;
        _this._msCtr = null;
        _this._currentEdit = null;
        _this.state = {
            scrollLeft: 0,
            scrollTop: 0,
            viewHeight: 0,
            viewWidth: 0,
            active: {
                row: 0,
                column: 0
            },
            edit: null,
            selection: [{
                    row: 0,
                    column: 0,
                    width: 0,
                    height: 0
                }],
            resizeHeaderPreview: null,
            resizeLevelPreview: null
        };
        // https://bugs.chromium.org/p/chromium/issues/detail?id=769390
        _this._chromeFix = {
            row: -1,
            column: -1
        };
        //#endregion
        //#region root handlers
        _this._onRef = function (r) {
            _this._ref = r;
        };
        _this._onRefView = function (r) {
            _this._refView = r;
        };
        _this._onBlur = function () {
            _this._focused = false;
        };
        _this._onFocus = function () {
            _this._focused = true;
        };
        _this._onRootMouseLeave = function (e) {
            e.persist();
            var x = e.clientX;
            var y = e.clientY;
            var rect = _this._ref.getBoundingClientRect();
            _this._msCtr.rootleave(x, y, rect);
        };
        _this._onKeyDown = function (e) {
            e.persist();
            _this._kbCtr.keydown(e);
        };
        _this._onRootMouseEnter = function () {
            _this._msCtr.rootenter();
        };
        _this._onRootMouseDown = function (e) {
            _this.focus();
            if (e.button === 2) {
                _this._blockContextMenu = true;
            }
        };
        _this._onScrollViewUpdate = function (e) {
            _this._scrollUpdateTrottled(function () {
                if (_this.state.viewWidth !== e.clientWidth
                    || _this.state.viewHeight !== e.clientHeight
                    || _this.state.scrollLeft !== e.scrollLeft
                    || _this.state.scrollTop !== e.scrollTop) {
                    _this.setState({
                        viewWidth: e.clientWidth,
                        viewHeight: e.clientHeight,
                        scrollLeft: e.scrollLeft,
                        scrollTop: e.scrollTop
                    });
                }
            });
        };
        //#endregion
        //#region controller handlers
        _this._ctrlGetState = function () {
            return {
                enabled: !!_this.props.onRenderSelection,
                active: _this._active,
                selection: _this._selection,
                editor: _this.state.edit,
                focused: _this._focused,
                columns: _this._columnCount,
                rows: _this._rowCount,
                view: _this._lastView,
                readOnly: _this.props.readOnly
            };
        };
        _this._ctrlRightClick = function (cell, event, select, inside) {
            if (_this.props.onRightClick) {
                _this.props.onRightClick({ cell: cell, event: event, select: select, inside: inside });
            }
        };
        _this._ctrlCopy = function (cells, withHeaders) {
            if (_this.props.onCopy) {
                _this.props.onCopy({
                    withHeaders: withHeaders, cells: cells,
                    repository: _this.props.repository,
                    data: _this.props.data,
                    focus: function () { _this.focus(); }
                });
            }
        };
        _this._ctrlPaste = function (_a) {
            var clipboard = _a.clipboard, getAllSelectedCells = _a.getAllSelectedCells, getLastSelectedCells = _a.getLastSelectedCells, isReadOnly = _a.isReadOnly;
            if (_this.props.onPaste) {
                _this.props.onPaste({
                    clipboard: clipboard,
                    getAllSelectedCells: getAllSelectedCells,
                    getLastSelectedCells: getLastSelectedCells,
                    isReadOnly: isReadOnly,
                    repository: _this.props.repository,
                    data: _this.props.data,
                    target: __assign({}, _this._active)
                });
            }
        };
        _this._ctrlNullify = function (cells) {
            if (_this.props.onNullify) {
                _this.props.onNullify({ cells: _this._ctrlOnReadOnlyFilter(cells, 'nullify') });
            }
        };
        _this._ctrlRemove = function (event) {
            if (_this.props.onRemove) {
                _this.props.onRemove(event);
            }
        };
        _this._ctrlSpace = function (cells) {
            if (_this.props.onSpace) {
                _this.props.onSpace({ cells: cells });
            }
        };
        _this._ctrlIsCellReadOnly = function (_a, source) {
            var row = _a.row, column = _a.column;
            var ch = _this.props.repository.columns[column];
            var rh = _this.props.repository.rows[row];
            return ch && rh && _this._ctrlIsReadOnly({ row: rh, column: ch, source: source });
        };
        _this._ctrlOnReadOnlyFilter = function (cells, source) {
            return cells.filter(function (e) { return !_this._ctrlIsCellReadOnly(e, source); });
        };
        //#endregion
        //#region elements handlers
        _this._onCellMouseDown = function (e) {
            e.persist();
            var row = Number(e.currentTarget.getAttribute('x-row'));
            var column = Number(e.currentTarget.getAttribute('x-col'));
            if (e.button === 1) {
                _this._chromeFix = { row: row, column: column };
            }
            _this.focus();
            _this._msCtr.mousedown(e, row, column);
        };
        _this._onCellTouchStart = function (e) {
            var row = Number(e.currentTarget.getAttribute('x-row'));
            var column = Number(e.currentTarget.getAttribute('x-col'));
            _this._chromeFix = { row: row, column: column };
            _this.focus();
        };
        _this._onHeaderMouseDownHeader = function (e) {
            e.persist();
            var type = Number(e.currentTarget.getAttribute('x-type'));
            var id = e.currentTarget.getAttribute('x-id');
            var h = _this.props.repository.getHeader(id);
            _this.focus();
            if (!h) {
                return;
            }
            if (_this.props.onHeaderRightClick) {
                _this.props.onHeaderRightClick({ header: h, event: e });
                if (e.defaultPrevented) {
                    return;
                }
            }
            var leaves = _this.props.repository.getHeaderLeaves(h);
            var indices = leaves.map(function (v) { return _this.props.repository.getViewIndex(v); });
            if (!indices.length) {
                return;
            }
            var min = Math.min.apply(Math, indices);
            var max = Math.max.apply(Math, indices);
            _this._msCtr.headerdown(e, type, min, max);
        };
        _this._onCornerMouseDown = function (e) {
            if (!_this.props.onRenderSelection || e.button !== 0 || e.defaultPrevented) {
                return;
            }
            var select = function () {
                _this.setState({
                    selection: [{
                            row: 0,
                            column: 0,
                            width: _this._columnCount - 1,
                            height: _this._rowCount - 1
                        }]
                });
            };
            if (_this.state.edit) {
                _this.closeEditor(true, select);
                return;
            }
            select();
        };
        _this._onCellMouseEnter = function (e) {
            var row = Number(e.currentTarget.getAttribute('x-row'));
            var column = Number(e.currentTarget.getAttribute('x-col'));
            _this._msCtr.mouseenter(row, column);
        };
        _this._renderHeadersLayer = function (event) {
            var clientWidth = event.clientWidth, clientHeight = event.clientHeight, scrollLeft = event.scrollLeft, scrollTop = event.scrollTop;
            var cornerJsx = (_this.props.onRenderHeaderCorner
                ? _this.props.onRenderHeaderCorner()
                : null);
            return (React.createElement("div", { style: {
                    width: clientWidth,
                    height: clientHeight,
                    pointerEvents: 'none',
                    zIndex: 1,
                    overflow: 'hidden',
                    position: 'absolute'
                } },
                !!_this.props.repository.offsetHeight &&
                    React.createElement("div", { className: _this._theme.classNameGridColumns, style: __assign({}, _this._theme.styleGridColumns, { pointerEvents: 'initial', position: 'absolute', overflow: 'hidden', left: _this.props.repository.offsetWidth, top: 0, right: 0, height: _this.props.repository.offsetHeight }) }, _this._renderHeaders(types_1.HeaderType.Column, scrollLeft)),
                !!_this.props.repository.offsetWidth &&
                    React.createElement("div", { className: _this._theme.classNameGridRows, style: __assign({}, _this._theme.styleGridRows, { pointerEvents: 'initial', position: 'absolute', overflow: 'hidden', left: 0, top: _this.props.repository.offsetHeight, bottom: 0, width: _this.props.repository.offsetWidth }) }, _this._renderHeaders(types_1.HeaderType.Row, scrollTop)),
                !!(_this.props.repository.offsetHeight || _this.props.repository.offsetWidth) &&
                    React.createElement("div", { className: _this._theme.classNameGridCorner, style: __assign({}, _this._theme.styleGridCorner, { pointerEvents: 'initial', position: 'absolute', overflow: 'hidden', left: 0, top: 0, height: _this.props.repository.offsetHeight, width: _this.props.repository.offsetWidth }), onMouseDown: _this._onCornerMouseDown }, cornerJsx),
                _this._renderResizing(event)));
        };
        _this._bodyRenderer = function () {
            return (React.createElement(React.Fragment, null,
                React.createElement("div", { style: {
                        height: Math.max(1, _this._lastView.rowsHeight),
                        width: Math.max(1, _this._lastView.columnsWidth),
                        boxSizing: 'border-box',
                        position: 'relative',
                        marginLeft: _this._headersWidth,
                        marginTop: _this._headersHeight
                    } }, _this._renderData()),
                React.createElement("div", { style: {
                        position: 'absolute',
                        pointerEvents: 'none',
                        zIndex: 1,
                        left: _this._headersWidth,
                        top: _this._headersHeight
                    } }, _this._renderSelections())));
        };
        /** TODO: instead of using column index - use cell position and viewport minus scroll size */
        _this.scrollTo = function (cell) {
            var ctr = _this.props.repository;
            if (!_this._refView || !ctr.columns.length || !ctr.rows.length) {
                return;
            }
            var _a = _this._lastView, firstColumn = _a.firstColumn, firstRow = _a.firstRow, lastColumn = _a.lastColumn, lastRow = _a.lastRow;
            var column = cell.column, row = cell.row;
            if (row != null) {
                row = Math.min(Math.max(0, row), _this._rowCount - 1);
                if (row <= firstRow || row >= lastRow) {
                    var rowPos = ctr.getPosition(ctr.rows[row]);
                    if (row <= firstRow) { // to top
                        _this._refView.scrollTop = rowPos;
                    }
                    else { // to bottom
                        var rowSize = ctr.getSize(ctr.rows[row]);
                        _this._refView.scrollTop = rowPos + rowSize - _this.state.viewHeight + _this._headersHeight;
                    }
                }
            }
            if (column != null) {
                column = Math.min(Math.max(0, column), _this._columnCount - 1);
                if (column <= firstColumn || column >= lastColumn) {
                    var colPos = ctr.getPosition(ctr.columns[column]);
                    if (column <= firstColumn) { // to left
                        _this._refView.scrollLeft = colPos;
                    }
                    else { // to right
                        var colSize = ctr.getSize(ctr.columns[column]);
                        _this._refView.scrollLeft = colPos + colSize - _this.state.viewWidth + _this._headersWidth;
                    }
                }
            }
        };
        _this.openEditor = function (cell) {
            if (_this.props.readOnly) {
                return;
            }
            var e = _this.state.edit;
            if (e) {
                if (e.row === cell.row && e.column === cell.column) {
                    return;
                }
                _this.closeEditor(true, function () {
                    _this.setState({ edit: cell });
                });
                return;
            }
            var ch = _this.props.repository.columns[cell.column];
            var rh = _this.props.repository.rows[cell.row];
            var hs = { column: ch, row: rh, source: 'editor' };
            if (ch && rh && !_this._ctrlIsNoEditor(hs) && !_this._ctrlIsReadOnly(hs)) {
                _this.setState({ edit: cell });
            }
        };
        _this.closeEditor = function (commit, callback) {
            if (!_this.state.edit) {
                _this._currentEdit = null;
                _this.focus();
                if (callback) {
                    callback();
                }
                return;
            }
            _this.setState({ edit: null }, function () {
                var e = _this._currentEdit;
                _this._currentEdit = null;
                _this.focus();
                if (callback) {
                    callback();
                }
                if (_this.props.onUpdate && e) {
                    var col = e.col, row = e.row, nextValue = e.nextValue, updatedValue = e.updatedValue;
                    if (commit && updatedValue) {
                        _this.props.onUpdate({ cell: { row: row, column: col }, value: nextValue });
                    }
                }
            });
        };
        _this.updateSelection = function (_a, callback) {
            var active = _a.active, selection = _a.selection;
            if (!active && !selection) {
                return;
            }
            var nextActive = active || _this._active;
            var nextSelection = selection || _this._selection;
            var notifyActiveChanged = _this._ctrlGetActiveNotifier(_this._active, nextActive);
            var notifySelectionChanged = _this._ctrlGetSelectionNotifier(_this._selection, nextSelection);
            _this.setState({
                active: nextActive,
                selection: nextSelection
            }, function () {
                if (callback) {
                    callback();
                }
                if (notifyActiveChanged || notifySelectionChanged) {
                    var e = {};
                    if (notifyActiveChanged) {
                        e.active = notifyActiveChanged;
                    }
                    if (notifySelectionChanged) {
                        e.selection = notifySelectionChanged;
                    }
                    _this.props.onSelection(e);
                }
            });
        };
        _this._onAfterUpdate = debounce_1.default(500, _this._onAfterUpdate.bind(_this));
        _this._kbCtr = new (p.keyboardControllerConstructor !== undefined
            ? p.keyboardControllerConstructor : keyboard_controller_1.default)({
            getState: _this._ctrlGetState,
            onCloseEditor: _this.closeEditor,
            onOpenEditor: _this.openEditor,
            onScroll: _this.scrollTo,
            onUpdateSelection: _this.updateSelection,
            onCopy: _this._ctrlCopy,
            onPaste: _this._ctrlPaste,
            onNullify: _this._ctrlNullify,
            onRemove: _this._ctrlRemove,
            onSpace: _this._ctrlSpace,
            onReadOnly: _this._ctrlIsCellReadOnly
        });
        _this._msCtr = new mouse_controller_1.default({
            getState: _this._ctrlGetState,
            onCloseEditor: _this.closeEditor,
            onOpenEditor: _this.openEditor,
            onScroll: _this.scrollTo,
            onUpdateSelection: _this.updateSelection,
            onRightClick: _this._ctrlRightClick
        });
        return _this;
    }
    Object.defineProperty(Grid.prototype, "_theme", {
        //#region getters
        get: function () {
            return this.props.theme || {};
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "_columnCount", {
        get: function () {
            return this.props.repository ? this.props.repository.columns.length : 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "_rowCount", {
        get: function () {
            return this.props.repository ? this.props.repository.rows.length : 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "_headersHeight", {
        get: function () {
            return this.props.repository.offsetHeight || 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "_headersWidth", {
        get: function () {
            return this.props.repository.offsetWidth || 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "_selection", {
        get: function () {
            return this.props.selection || this.state.selection;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Grid.prototype, "_active", {
        get: function () {
            return (this.props.onRenderSelection
                ? this.props.active || this.state.active
                : DUMMY_CELL_ADDRESS);
        },
        enumerable: true,
        configurable: true
    });
    Grid.prototype._ctrlGetActiveNotifier = function (prev, next) {
        if (!this.props.onSelection || prev == next || (prev && next && prev.column === next.column && prev.row === next.row)) {
            return null;
        }
        prev = prev ? __assign({}, prev) : null;
        next = next ? __assign({}, next) : null;
        return { previous: prev, current: next };
    };
    Grid.prototype._ctrlGetSelectionNotifier = function (prev, next) {
        if (!this.props.onSelection || prev == next) {
            return null;
        }
        if (prev && next && prev.length === next.length && prev.every(function (a, i) {
            return (a.column === next[i].column
                && a.height === next[i].height
                && a.row === next[i].row
                && a.width === next[i].width);
        })) {
            return null;
        }
        prev = prev ? prev.slice().map(function (a) { return (__assign({}, a)); }) : null;
        next = next ? next.slice().map(function (a) { return (__assign({}, a)); }) : null;
        return { previous: prev, current: next };
    };
    Grid.prototype._ctrlIsReadOnly = function (e) {
        if (this.props.onReadOnly) {
            return this.props.onReadOnly(e);
        }
        return e.column.$readOnly || e.row.$readOnly;
    };
    Grid.prototype._ctrlIsNoEditor = function (e) {
        return e.column.$noEditor || e.row.$noEditor;
    };
    //#endregion
    Grid.prototype._onAutoMeasureApply = function (_a, behavior, workType, headerType) {
        var _this = this;
        var cells = _a.cells, headers = _a.headers;
        cells = (cells || []).filter(function (v) { return !!v; });
        headers = (headers || []).filter(function (v) { return !!v; });
        var ctr = this.props.repository;
        var isReset = behavior === 'reset';
        var combinedEvent = {
            behavior: behavior
        };
        if ((workType === 'all' || workType === 'cells')) {
            var columnHeaders_1 = ctr.columns;
            var rowHeaders_1 = ctr.rows;
            var columns_1 = {};
            var rows_1 = {};
            var headerColSizes_1 = {};
            var headerRowSizes_1 = {};
            headers.forEach(function (_a) {
                var height = _a.height, width = _a.width, header = _a.header;
                var vi = ctr.getViewIndex(header);
                if (ctr.getHeaderType(header) === types_1.HeaderType.Row) {
                    headerRowSizes_1[vi] = Math.max(headerRowSizes_1[vi] || 0, height);
                }
                else {
                    headerColSizes_1[vi] = Math.max(headerColSizes_1[vi] || 0, width);
                }
            });
            if (!cells.length) {
                var _b = this._lastView, firstColumn = _b.firstColumn, firstRow = _b.firstRow, lastRow = _b.lastRow, lastColumn = _b.lastColumn;
                if (firstRow !== -1 || firstColumn !== -1) {
                    if (firstRow === -1) {
                        firstRow = 0;
                        lastRow = 0;
                    }
                    else {
                        firstColumn = 0;
                        lastColumn = 0;
                    }
                    for (var r = firstRow; r <= lastRow; r++) {
                        for (var c = firstColumn; c <= lastColumn; c++) {
                            cells.push({
                                column: c,
                                row: r,
                                height: 0,
                                width: 0
                            });
                        }
                    }
                }
            }
            for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
                var _c = cells_1[_i], row = _c.row, column = _c.column, height = _c.height, width = _c.width;
                columns_1[column] = Math.max(headerColSizes_1[column] || 0, columns_1[column] == null ? width : Math.max(width, columns_1[column]));
                rows_1[row] = Math.max(headerRowSizes_1[row] || 0, rows_1[row] == null ? height : Math.max(height, rows_1[row]));
            }
            var ch = (headerType === 'all' || headerType === types_1.HeaderType.Column)
                ? Object
                    .keys(columns_1)
                    .map(function (k) { return ({ columnIndex: Number(k), width: Math.round(columns_1[k]) }); })
                    .filter(function (_a) {
                    var width = _a.width, columnIndex = _a.columnIndex;
                    var h = columnHeaders_1[columnIndex];
                    var size = _this.props.repository.getSize(h);
                    return h && (isReset || !ctr.getManualResized(h) && Math.round(size) < width);
                })
                    .map(function (_a) {
                    var columnIndex = _a.columnIndex, width = _a.width;
                    return ({
                        header: columnHeaders_1[columnIndex],
                        size: width,
                        type: ctr.getHeaderType(columnHeaders_1[columnIndex])
                    });
                })
                : [];
            var rh = (headerType === 'all' || headerType === types_1.HeaderType.Row)
                ? Object
                    .keys(rows_1)
                    .map(function (k) { return ({ rowIndex: Number(k), height: Math.round(rows_1[k]) }); })
                    .filter(function (_a) {
                    var rowIndex = _a.rowIndex, height = _a.height;
                    var h = rowHeaders_1[rowIndex];
                    var size = _this.props.repository.getSize(h);
                    return h && (isReset || !ctr.getManualResized(h) && Math.round(size) < height);
                })
                    .map(function (_a) {
                    var rowIndex = _a.rowIndex, height = _a.height;
                    return ({
                        header: rowHeaders_1[rowIndex],
                        size: height,
                        type: ctr.getHeaderType(rowHeaders_1[rowIndex])
                    });
                })
                : [];
            if (ch.length || rh.length) {
                combinedEvent.headers = ch.concat(rh);
            }
        }
        if ((workType === 'all' || workType === 'levels') && headers.length) {
            var topLevels_1 = {};
            var leftLevels_1 = {};
            for (var _d = 0, headers_1 = headers; _d < headers_1.length; _d++) {
                var _e = headers_1[_d], h = _e.header, height = _e.height, width = _e.width;
                var type = ctr.getHeaderType(h);
                var level = ctr.getPositionLevel(h);
                if (ctr.getManualResizedLevel(type, level) && !isReset) {
                    return;
                }
                if (type === types_1.HeaderType.Column) {
                    topLevels_1[level] = (height > (topLevels_1[level] || 0)) ? height : topLevels_1[level];
                }
                else {
                    leftLevels_1[level] = (width > (leftLevels_1[level] || 0)) ? width : leftLevels_1[level];
                }
            }
            var top_1 = (headerType === 'all' || headerType === types_1.HeaderType.Column)
                ? Object
                    .keys(topLevels_1)
                    .map(function (k) {
                    var level = Number(k);
                    var size = topLevels_1[level];
                    if (size == null || !isReset && Math.round(size) <= Math.round(ctr.getTopLevelHeight(level))) {
                        return null;
                    }
                    return {
                        level: level, size: size,
                        type: types_1.HeaderType.Column
                    };
                })
                    .filter(function (v) { return !!v; })
                : [];
            var left = (headerType === 'all' || headerType === types_1.HeaderType.Row)
                ? Object
                    .keys(leftLevels_1)
                    .map(function (k) {
                    var level = Number(k);
                    var size = leftLevels_1[level];
                    if (size == null || !isReset && Math.round(size) <= Math.round(ctr.getLeftLevelWidth(level))) {
                        return null;
                    }
                    return {
                        level: level, size: size,
                        type: types_1.HeaderType.Row
                    };
                })
                    .filter(function (v) { return !!v; })
                : [];
            if (top_1.length || left.length) {
                combinedEvent.levels = top_1.concat(left);
            }
        }
        if (combinedEvent.headers || combinedEvent.levels) {
            this.props.onHeaderResize(combinedEvent);
        }
    };
    Grid.prototype._onAutoMeasure = function () {
        var _this = this;
        if (this.state.edit || !this.props.onAutoMeasure || !this.props.onHeaderResize || !this._lastView) {
            return;
        }
        var _a = this._lastView, firstColumn = _a.firstColumn, firstRow = _a.firstRow, lastRow = _a.lastRow, lastColumn = _a.lastColumn;
        var ctr = this.props.repository;
        var columns = ctr.columns, rows = ctr.rows;
        var cells = [];
        for (var r = firstRow; r <= lastRow; r++) {
            for (var c = firstColumn; c <= lastColumn; c++) {
                if (columns[c] && rows[r]) {
                    cells.push({
                        column: c,
                        row: r,
                        columnHeader: columns[c],
                        rowHeader: rows[r]
                    });
                }
            }
        }
        var columnHeaders = ctr.getNodesBottomUp(columns.slice(firstColumn, lastColumn + 1));
        var rowHeaders = ctr.getNodesBottomUp(rows.slice(firstRow, lastRow + 1));
        var headers = columnHeaders.concat(rowHeaders).map(function (h) {
            return {
                index: ctr.getViewIndex(h),
                type: ctr.getHeaderType(h),
                level: ctr.getPositionLevel(h),
                header: h
            };
        });
        if (!cells.length && !headers.length) {
            return;
        }
        this.props.onAutoMeasure({
            cells: cells,
            headers: headers,
            data: this.props.data,
            callback: function (result) {
                _this._onAutoMeasureApply(result, 'auto', 'all', 'all');
            }
        });
    };
    Grid.prototype._onAfterUpdate = function () {
        var _this = this;
        this._onAutoMeasure();
        if (this._refView) {
            var style_1 = this._refView.scrollerStyle;
            style_1.willChange = '';
            setTimeout(function () {
                if (_this._detached) {
                    return;
                }
                style_1.willChange = 'transform';
            }, 500);
        }
    };
    Grid.prototype._createView = function () {
        var sl = this.state.scrollLeft;
        var st = this.state.scrollTop;
        var vw = this.state.viewWidth - this._headersWidth;
        var vh = this.state.viewHeight - this._headersHeight;
        var rowsHeight = 0;
        var firstRow = -1;
        var lastRow = -1;
        var rowIndex = 0;
        for (var _i = 0, _a = this.props.repository.rows; _i < _a.length; _i++) {
            var rh = _a[_i];
            var hsize = this.props.repository.getSize(rh);
            if (firstRow === -1 && rowsHeight >= st - hsize) {
                firstRow = rowIndex;
            }
            rowsHeight += hsize;
            if (lastRow === -1 && rowsHeight >= st + vh) {
                lastRow = rowIndex;
                break;
            }
            rowIndex++;
        }
        if (lastRow === -1 && firstRow !== -1) {
            lastRow = rowIndex;
        }
        var columnsWidth = 0;
        var firstColumn = -1;
        var lastColumn = -1;
        var colIndex = 0;
        for (var _b = 0, _c = this.props.repository.columns; _b < _c.length; _b++) {
            var ch = _c[_b];
            var csize = this.props.repository.getSize(ch);
            if (firstColumn === -1 && columnsWidth >= sl - csize) {
                firstColumn = colIndex;
            }
            columnsWidth += csize;
            if (lastColumn === -1 && columnsWidth >= sl + vw) {
                lastColumn = colIndex;
                break;
            }
            colIndex++;
        }
        if (lastColumn === -1 && firstColumn !== -1) {
            lastColumn = colIndex;
        }
        var rhLast = this.props.repository.rows[this.props.repository.rows.length - 1];
        var chLast = this.props.repository.columns[this.props.repository.columns.length - 1];
        if (rhLast) {
            rowsHeight = this.props.repository.getPosition(rhLast) + this.props.repository.getSize(rhLast);
        }
        if (chLast) {
            columnsWidth = this.props.repository.getPosition(chLast) + this.props.repository.getSize(chLast);
        }
        this._lastView = { firstRow: firstRow, lastRow: lastRow, firstColumn: firstColumn, lastColumn: lastColumn, rowsHeight: rowsHeight, columnsWidth: columnsWidth };
    };
    Grid.prototype._createOverscan = function () {
        if (!this._lastView) {
            return;
        }
        var _a = this._lastView, firstColumn = _a.firstColumn, firstRow = _a.firstRow, lastColumn = _a.lastColumn, lastRow = _a.lastRow;
        if (this.props.overscanRows) {
            firstRow = Math.max(0, firstRow - this.props.overscanRows);
            lastRow = Math.min(Math.max(0, this._rowCount - 1), lastRow + this.props.overscanRows);
        }
        else {
            firstRow = Math.max(0, firstRow);
        }
        if (this.props.overscanColumns) {
            firstColumn = Math.max(0, firstColumn - this.props.overscanColumns);
            lastColumn = Math.min(Math.max(0, this._columnCount - 1), lastColumn + this.props.overscanColumns);
        }
        else {
            firstColumn = Math.max(0, firstColumn);
        }
        this._lastOverscan = {
            firstRow: firstRow, lastRow: lastRow, firstColumn: firstColumn, lastColumn: lastColumn
        };
    };
    Grid.prototype._prepareCellProps = function (row, col) {
        var rh = this.props.repository.rows[row];
        var ch = this.props.repository.columns[col];
        if (!rh || !ch) {
            return null;
        }
        return {
            row: row,
            column: col,
            rowHeader: rh,
            columnHeader: ch,
            active: row === this._active.row && col === this._active.column,
            data: this.props.data,
            theme: this.props.theme,
            style: {
                top: this.props.repository.getPosition(rh),
                left: this.props.repository.getPosition(ch),
                height: this.props.repository.getSize(rh),
                width: this.props.repository.getSize(ch),
                position: 'absolute',
                zIndex: 1
            }
        };
    };
    Grid.prototype._renderCell = function (row, col) {
        var props = this._prepareCellProps(row, col);
        if (!props) {
            return null;
        }
        var cell = this.props.onRenderCell(props);
        var eventHandlers = null;
        if (this.props.onRenderSelection) {
            eventHandlers = {
                onMouseDown: this._onCellMouseDown,
                onMouseEnter: this._onCellMouseEnter,
                onTouchStart: this._onCellTouchStart
            };
        }
        return React.cloneElement(React.Children.only(cell), __assign({ 'x-row': row, 'x-col': col, key: "C" + row + "x" + col }, eventHandlers));
    };
    Grid.prototype._renderEditor = function (row, col) {
        var _this = this;
        if (!this.props.onRenderEditor) {
            return this._renderCell(row, col);
        }
        if (!this._currentEdit || (this._currentEdit.row !== row || this._currentEdit.col !== col)) {
            this._currentEdit = {
                row: row, col: col,
                nextValue: null,
                updatedValue: false
            };
        }
        var props = this._prepareCellProps(row, col);
        if (!props) {
            return null;
        }
        var cell = this.props.onRenderEditor(__assign({}, props, { close: function (commit) {
                _this.closeEditor(commit);
            }, update: function (nextValue) {
                _this._currentEdit.nextValue = nextValue;
                _this._currentEdit.updatedValue = true;
            } }));
        return React.cloneElement(React.Children.only(cell), {
            'x-row': row,
            'x-col': col,
            key: "E" + row + "x" + col
        });
    };
    Grid.prototype._renderData = function () {
        if (!this._lastOverscan) {
            return;
        }
        var _a = this._lastOverscan, firstColumn = _a.firstColumn, firstRow = _a.firstRow, lastColumn = _a.lastColumn, lastRow = _a.lastRow;
        var columnCount = this._columnCount;
        var rowCount = this._rowCount;
        if (!columnCount || !rowCount) {
            return null;
        }
        var irlen = Math.max(0, Math.min(rowCount - firstRow, 1 + lastRow - firstRow));
        var iclen = Math.max(0, Math.min(columnCount - firstColumn, 1 + lastColumn - firstColumn));
        var jsx = new Array(irlen * iclen);
        var i = 0;
        var edit = this.state.edit;
        for (var ir = 0; ir < irlen; ir++) {
            for (var ic = 0; ic < iclen; ic++) {
                var r = ir + firstRow;
                var c = ic + firstColumn;
                if (edit && edit.column === c && edit.row === r) {
                    jsx[i++] = this._renderEditor(r, c);
                }
                else {
                    jsx[i++] = this._renderCell(r, c);
                }
            }
        }
        if (edit && ((edit.column < firstColumn) || (edit.column > lastColumn) ||
            (edit.row < firstRow) || (edit.row > lastRow))) {
            jsx.push(this._renderEditor(edit.row, edit.column));
        }
        var wkfix = this._chromeFix;
        if (wkfix.column !== -1 && wkfix.row !== -1 && ((wkfix.column < firstColumn) || (wkfix.column > lastColumn) ||
            (wkfix.row < firstRow) || (wkfix.row > lastRow))) {
            jsx.push(this._renderCell(wkfix.row, wkfix.column));
        }
        return jsx;
    };
    Grid.prototype._renderHeader = function (out, type, index, header, scrollPos, lock, parent) {
        var $id = header.$id, $children = header.$children;
        if (lock.has($id)) {
            return;
        }
        lock.add($id);
        var style = {
            position: 'absolute',
            zIndex: 1
        };
        var level = this.props.repository.getLevel(header);
        var headerSize = this.props.repository.getSize(header);
        if (type === types_1.HeaderType.Row) {
            style.left = this.props.repository.getLeftLevelPosition(level); // 0;
            style.width = this.props.repository.getLeftLevelWidth(level, header.$collapsed); // headersWidth;
            style.top = this.props.repository.getPosition(header) - scrollPos;
            style.height = headerSize;
            var levels = this.props.repository.leftLevels;
            if (level < (levels - 1) && (!$children || !$children.length)) {
                style.width = this.props.repository.offsetWidth - style.left;
            }
        }
        else {
            style.top = this.props.repository.getTopLevelPosition(level);
            style.height = this.props.repository.getTopLevelHeight(level, header.$collapsed); // headersHeight;
            style.left = this.props.repository.getPosition(header) - scrollPos;
            style.width = headerSize;
            var levels = this.props.repository.topLevels;
            if (level < (levels - 1) && (!$children || !$children.length)) {
                style.height = this.props.repository.offsetHeight - style.top;
            }
        }
        var selection = false;
        if (this.props.onRenderSelection) {
            for (var _i = 0, _a = this._selection; _i < _a.length; _i++) {
                var s = _a[_i];
                if (type === types_1.HeaderType.Row) {
                    if (index >= s.row && index <= (s.row + s.height)) {
                        selection = true;
                        break;
                    }
                }
                else {
                    if (index >= s.column && index <= (s.column + s.width)) {
                        selection = true;
                        break;
                    }
                }
            }
        }
        var headerParent = this.props.repository.getParent(header);
        var cell = this.props.onRenderHeader({
            type: type, header: header, style: style, parent: parent,
            selection: parent ? false : selection,
            parentHeader: headerParent,
            theme: this.props.theme,
            viewIndex: this.props.repository.getViewIndex(header)
        });
        var eventHandlers = null;
        if (this.props.onRenderSelection) {
            eventHandlers = {
                onMouseDown: this._onHeaderMouseDownHeader
            };
        }
        out.push(React.cloneElement(React.Children.only(cell), __assign({ 'x-type': type, 'x-id': $id, 'x-lvl': level, key: $id }, eventHandlers)));
        if (headerParent) {
            this._renderHeader(out, type, index, headerParent, scrollPos, lock, true);
        }
    };
    Grid.prototype._renderHeaders = function (type, scrollPos) {
        if (!this._lastOverscan) {
            return;
        }
        var _a = this._lastOverscan, firstColumn = _a.firstColumn, firstRow = _a.firstRow, lastColumn = _a.lastColumn, lastRow = _a.lastRow;
        var isRow = type === types_1.HeaderType.Row;
        var first = isRow ? firstRow : firstColumn;
        var last = isRow ? lastRow : lastColumn;
        var max = isRow ? this._rowCount : this._columnCount;
        var headers = isRow ? this.props.repository.rows : this.props.repository.columns;
        var len = Math.max(0, Math.min(max - first, 1 + last - first));
        var jsx = [];
        var lock = new Set();
        for (var i = 0; i < len; i++) {
            var ix = i + first;
            this._renderHeader(jsx, type, ix, headers[ix], scrollPos, lock, false);
        }
        return (React.createElement(React.Fragment, null, jsx));
    };
    Grid.prototype._renderResizing = function (_a) {
        var scrollLeft = _a.scrollLeft, scrollTop = _a.scrollTop;
        if (!this.props.onRenderResizer || !this.state.resizeHeaderPreview && !this.state.resizeLevelPreview) {
            return null;
        }
        var type;
        var orientation;
        var styleInitial = {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 100
        };
        var styleChanged = {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 100
        };
        if (this.state.resizeHeaderPreview) {
            type = 'header';
            var _b = this.state.resizeHeaderPreview, change = _b.change, header = _b.header;
            var headerType = this.props.repository.getHeaderType(header);
            var headerPosition = this.props.repository.getPosition(header);
            var headerSize = this.props.repository.getSize(header);
            if (headerType === types_1.HeaderType.Row) {
                orientation = 'horizontal';
                styleChanged.left = styleInitial.left = 0;
                styleChanged.right = styleInitial.right = 0;
                styleChanged.top = styleInitial.top = this.props.repository.offsetHeight + headerPosition - scrollTop;
                styleInitial.height = headerSize;
                styleChanged.height = headerSize + change;
            }
            else {
                orientation = 'vertical';
                styleChanged.top = styleInitial.top = 0;
                styleChanged.bottom = styleInitial.bottom = 0;
                styleChanged.left = styleInitial.left = this.props.repository.offsetWidth + headerPosition - scrollLeft;
                styleInitial.width = headerSize;
                styleChanged.width = headerSize + change;
            }
        }
        if (this.state.resizeLevelPreview) {
            type = 'level';
            var _c = this.state.resizeLevelPreview, change = _c.change, header = _c.header;
            var headerType = this.props.repository.getHeaderType(header);
            var level = this.props.repository.getPositionLevel(header);
            if (headerType === types_1.HeaderType.Row) { // resizing left level
                orientation = 'vertical';
                var position = this.props.repository.getLeftLevelPosition(level);
                var size = this.props.repository.getLeftLevelWidth(level);
                styleChanged.top = styleInitial.top = 0;
                styleChanged.bottom = styleInitial.bottom = 0;
                styleChanged.left = styleInitial.left = position;
                styleInitial.width = size;
                styleChanged.width = size + change;
            }
            else { // resizing top level
                orientation = 'horizontal';
                var position = this.props.repository.getTopLevelPosition(level);
                var size = this.props.repository.getTopLevelHeight(level);
                styleChanged.left = styleInitial.left = 0;
                styleChanged.right = styleInitial.right = 0;
                styleChanged.top = styleInitial.top = position;
                styleInitial.height = size;
                styleChanged.height = size + change;
            }
        }
        if (this.state.resizeHeaderPreview || this.state.resizeLevelPreview) {
            return (React.createElement(React.Fragment, null,
                this.props.onRenderResizer({ type: type, orientation: orientation, style: styleInitial, resizer: 'initial', theme: this.props.theme }),
                this.props.onRenderResizer({ type: type, orientation: orientation, style: styleChanged, resizer: 'changed', theme: this.props.theme })));
        }
        return null;
    };
    Grid.prototype._isAddressOutOfBounds = function (cell) {
        var lastRow = this.props.repository.rows.length - 1;
        var lastCol = this.props.repository.columns.length - 1;
        return cell.column < 0 || cell.column > lastCol || cell.row < 0 || cell.row > lastRow;
    };
    Grid.prototype._getFilteredSelections = function () {
        var lastCol = this.props.repository.columns.length - 1;
        var lastRow = this.props.repository.rows.length - 1;
        return this._selection.filter(function (_a) {
            var column = _a.column, row = _a.row;
            return row <= lastRow && column <= lastCol;
        });
    };
    Grid.prototype._renderSelections = function () {
        var _this = this;
        if (!this.props.onRenderSelection) {
            return null;
        }
        var ctr = this.props.repository;
        if (!ctr.columns.length || !ctr.rows.length) {
            return null;
        }
        var jsx = this._getFilteredSelections().map(function (_a, i) {
            var row = _a.row, column = _a.column, width = _a.width, height = _a.height;
            var l = ctr.getPosition(ctr.columns[column]);
            var t = ctr.getPosition(ctr.rows[row]);
            var w = ctr.columns.slice(column, column + width + 1).reduce(function (r, n) { return r + ctr.getSize(n); }, 0);
            var h = ctr.rows.slice(row, row + height + 1).reduce(function (r, n) { return r + ctr.getSize(n); }, 0);
            return _this.props.onRenderSelection({
                key: i,
                active: false,
                edit: !!_this.state.edit,
                theme: _this.props.theme,
                style: {
                    position: 'absolute',
                    zIndex: i,
                    left: l,
                    top: t,
                    width: w,
                    height: h
                }
            });
        });
        var ax = jsx.length;
        if (!this._isAddressOutOfBounds(this._active)) {
            var rh = ctr.rows[this._active.row];
            var ch = ctr.columns[this._active.column];
            jsx.push(this.props.onRenderSelection({
                key: ax,
                active: true,
                edit: !!this.state.edit,
                theme: this.props.theme,
                style: {
                    position: 'absolute',
                    zIndex: ax,
                    left: ctr.getPosition(ch),
                    top: ctr.getPosition(rh),
                    width: ctr.getSize(ch),
                    height: ctr.getSize(rh)
                }
            }));
        }
        return jsx;
    };
    Grid.prototype.focus = function () {
        if (this._ref) {
            this._ref.focus();
            this._focused = true;
        }
    };
    Grid.prototype.blur = function () {
        if (this._ref) {
            this._ref.blur();
        }
    };
    Grid.prototype.resizeHeaders = function (e) {
        if (this.props.onHeaderResize) {
            this.props.onHeaderResize(e);
        }
    };
    Grid.prototype.autoMeasure = function (headers, type) {
        var _this = this;
        if (type === void 0) { type = 'cells'; }
        if (!headers || !headers.length || this.state.edit || !this.props.onAutoMeasure || !this.props.onHeaderResize || !this._lastView) {
            return;
        }
        var repository = this.props.repository;
        var _a = this._lastView, firstColumn = _a.firstColumn, firstRow = _a.firstRow, lastRow = _a.lastRow, lastColumn = _a.lastColumn;
        if (firstColumn === -1 || firstRow === -1) {
            return;
        }
        var headerType = repository.getHeaderType(headers[0]);
        var diffHeaders = headers.filter(function (h) { return repository.getHeaderType(h) !== headerType; });
        var cellNodes = [];
        headers = headers.filter(function (h) { return repository.getHeaderType(h) === headerType; });
        if (diffHeaders.length) {
            this.autoMeasure(diffHeaders, type);
        }
        if (type === 'cells') {
            var batch = headers.map(function (h) { return repository.getHeaderLeaves(h); });
            var columns = repository.columns, rows = repository.rows;
            for (var _i = 0, batch_1 = batch; _i < batch_1.length; _i++) {
                var list = batch_1[_i];
                for (var _b = 0, list_1 = list; _b < list_1.length; _b++) {
                    var h = list_1[_b];
                    var t = repository.getHeaderType(h);
                    if (t === types_1.HeaderType.Column) {
                        var c = repository.getViewIndex(h);
                        for (var r = firstRow; r <= lastRow; r++) {
                            if (columns[c] && rows[r]) {
                                cellNodes.push({
                                    column: c,
                                    row: r,
                                    columnHeader: columns[c],
                                    rowHeader: rows[r]
                                });
                            }
                        }
                    }
                    else {
                        var r = repository.getViewIndex(h);
                        for (var c = firstColumn; c <= lastColumn; c++) {
                            if (columns[c] && rows[r]) {
                                cellNodes.push({
                                    column: c,
                                    row: r,
                                    columnHeader: columns[c],
                                    rowHeader: rows[r]
                                });
                            }
                        }
                    }
                }
            }
        }
        if (type === 'cells') {
            headers = repository.getNodesTopDown(headers);
        }
        else {
            var levels_1 = new Set();
            headers.forEach(function (h) {
                levels_1.add(repository.getPositionLevel(h));
            });
            var list = (headerType === types_1.HeaderType.Column
                ? repository.columns.slice(firstColumn, lastColumn + 1)
                : repository.rows.slice(firstRow, lastRow + 1));
            headers = repository.getNodesBottomUp(list).filter(function (h) { return levels_1.has(repository.getPositionLevel(h)); });
        }
        var headerNodes = headers.map(function (h) {
            return {
                index: repository.getViewIndex(h),
                type: repository.getHeaderType(h),
                level: repository.getPositionLevel(h),
                header: h
            };
        });
        this.props.onAutoMeasure({
            cells: cellNodes,
            headers: headerNodes,
            data: this.props.data,
            callback: function (result) {
                _this._onAutoMeasureApply(result, 'reset', type, headerType);
            }
        });
    };
    Grid.prototype.previewResizeHeader = function (resizeHeaderPreview) {
        this.setState({ resizeHeaderPreview: resizeHeaderPreview });
    };
    Grid.prototype.previewResizeLevel = function (resizeLevelPreview) {
        this.setState({ resizeLevelPreview: resizeLevelPreview });
    };
    Grid.prototype.componentDidMount = function () {
        var _this = this;
        document.body.addEventListener('contextmenu', this._onContextMenuListener = function (e) {
            if (_this._blockContextMenu) {
                _this._blockContextMenu = false;
                e.preventDefault();
            }
        });
    };
    Grid.prototype.componentDidUpdate = function (pp) {
        var isSourceChanged = pp.data !== this.props.data;
        var isHeadersChanged = pp.repository !== this.props.repository;
        if (this.state.edit && (isSourceChanged || isHeadersChanged)) {
            this.closeEditor(false);
        }
        this._onAfterUpdate();
    };
    Grid.prototype.componentWillUnmount = function () {
        this._detached = true;
        document.body.removeEventListener('contextmenu', this._onContextMenuListener);
        this._kbCtr.dispose();
        this._msCtr.dispose();
    };
    Grid.prototype.render = function () {
        this._createView();
        this._createOverscan();
        var ScrollView = this.props.scrollViewClass || scroll_view_1.default;
        return (React.createElement(context_1.default.Provider, { value: { grid: this, repository: this.props.repository } },
            React.createElement("div", { className: this._theme.classNameGrid, tabIndex: this.props.tabIndex, ref: this._onRef, onBlur: this._onBlur, onFocus: this._onFocus, style: __assign({ display: 'block', height: '100%', width: '100%', position: 'relative', userSelect: 'none', outline: 'none', overflow: 'hidden' }, this._theme.styleGrid), onKeyDown: this._onKeyDown, onMouseLeave: this._onRootMouseLeave, onMouseEnter: this._onRootMouseEnter, onMouseDown: this._onRootMouseDown },
                React.createElement(ScrollView, { className: this._theme.classNameScrollView, ref: this._onRefView, onScroll: this._onScrollViewUpdate, style: this._scrollerStyle, headersRenderer: this._renderHeadersLayer, bodyRenderer: this._bodyRenderer, preserveScrollbars: this.props.preserveScrollbars }))));
    };
    Grid.propTypes = {
        tabIndex: PropType.number,
        preserveScrollbars: PropType.bool,
        repository: PropType.instanceOf(header_repository_1.HeaderRepository).isRequired,
        data: PropType.any,
        readOnly: PropType.bool,
        overscanRows: PropType.number,
        overscanColumns: PropType.number,
        theme: PropType.object,
        active: PropType.object,
        selection: PropType.array,
        onRenderCell: PropType.func.isRequired,
        onRenderHeader: PropType.func.isRequired,
        onRenderHeaderCorner: PropType.func,
        onRenderSelection: PropType.func,
        onRenderEditor: PropType.func,
        onRenderResizer: PropType.func,
        onAutoMeasure: PropType.func,
        onSpace: PropType.func,
        onRemove: PropType.func,
        onNullify: PropType.func,
        onCopy: PropType.func,
        onPaste: PropType.func,
        onRightClick: PropType.func,
        onHeaderRightClick: PropType.func,
        onUpdate: PropType.func,
        onSelection: PropType.func,
        onHeaderResize: PropType.func,
        onReadOnly: PropType.func,
        scrollViewClass: PropType.any
    };
    Grid.defaultProps = {
        tabIndex: -1,
        preserveScrollbars: false,
        readOnly: false,
        overscanRows: 0,
        overscanColumns: 0
    };
    return Grid;
}(React.PureComponent));
exports.Grid = Grid;
exports.default = Grid;

//# sourceMappingURL=grid.js.map
