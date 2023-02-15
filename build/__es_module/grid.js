import * as React from 'react';
import * as PropType from 'prop-types';
import FallbackScrollView from './scroll-view';
import KeyboardController from './keyboard-controller';
import MouseController from './mouse-controller';
import RenderThrottler from './render-throttler';
import debounce from './debounce';
import { HeaderRepository } from './header-repository';
import { HeaderType } from './types';
import Context from './context';
const DUMMY_CELL_ADDRESS = { row: -1, column: -1 };
export class Grid extends React.PureComponent {
    //#endregion
    constructor(p, c) {
        super(p, c);
        //#region properties
        this._detached = false;
        this._blockContextMenu = false;
        this._onContextMenuListener = null;
        this._rt = new RenderThrottler();
        this._scrollUpdateTrottled = this._rt.create();
        this._ref = null;
        this._refView = null;
        this._scrollerStyle = { willChange: 'transform', zIndex: 0 };
        this._lastView = null;
        this._lastOverscan = null;
        this._focused = false;
        this._kbCtr = null;
        this._msCtr = null;
        this._currentEdit = null;
        this.state = {
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
        this._chromeFix = {
            row: -1,
            column: -1
        };
        //#endregion
        //#region root handlers
        this._onRef = (r) => {
            this._ref = r;
        };
        this._onRefView = (r) => {
            this._refView = r;
        };
        this._onBlur = () => {
            this._focused = false;
        };
        this._onFocus = () => {
            this._focused = true;
        };
        this._onRootMouseLeave = (e) => {
            e.persist();
            let x = e.clientX;
            let y = e.clientY;
            let rect = this._ref.getBoundingClientRect();
            this._msCtr.rootleave(x, y, rect);
        };
        this._onKeyDown = (e) => {
            e.persist();
            this._kbCtr.keydown(e);
        };
        this._onRootMouseEnter = () => {
            this._msCtr.rootenter();
        };
        this._onRootMouseDown = (e) => {
            this.focus();
            if (e.button === 2) {
                this._blockContextMenu = true;
            }
        };
        this._onScrollViewUpdate = (e) => {
            this._scrollUpdateTrottled(() => {
                if (this.state.viewWidth !== e.clientWidth
                    || this.state.viewHeight !== e.clientHeight
                    || this.state.scrollLeft !== e.scrollLeft
                    || this.state.scrollTop !== e.scrollTop) {
                    this.setState({
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
        this._ctrlGetState = () => {
            return {
                enabled: !!this.props.onRenderSelection,
                active: this._active,
                selection: this._selection,
                editor: this.state.edit,
                focused: this._focused,
                columns: this._columnCount,
                rows: this._rowCount,
                view: this._lastView,
                readOnly: this.props.readOnly
            };
        };
        this._ctrlRightClick = (cell, event, select, inside) => {
            if (this.props.onRightClick) {
                this.props.onRightClick({ cell, event, select, inside });
            }
        };
        this._ctrlCopy = (cells, withHeaders) => {
            if (this.props.onCopy) {
                this.props.onCopy({
                    withHeaders, cells,
                    repository: this.props.repository,
                    data: this.props.data,
                    focus: () => { this.focus(); }
                });
            }
        };
        this._ctrlPaste = ({ clipboard, getAllSelectedCells, getLastSelectedCells, isReadOnly }) => {
            if (this.props.onPaste) {
                this.props.onPaste({
                    clipboard,
                    getAllSelectedCells,
                    getLastSelectedCells,
                    isReadOnly,
                    repository: this.props.repository,
                    data: this.props.data,
                    target: Object.assign({}, this._active)
                });
            }
        };
        this._ctrlNullify = (cells) => {
            if (this.props.onNullify) {
                this.props.onNullify({ cells: this._ctrlOnReadOnlyFilter(cells, 'nullify') });
            }
        };
        this._ctrlRemove = (event) => {
            if (this.props.onRemove) {
                this.props.onRemove(event);
            }
        };
        this._ctrlSpace = (cells) => {
            if (this.props.onSpace) {
                this.props.onSpace({ cells });
            }
        };
        this._ctrlIsCellReadOnly = ({ row, column }, source) => {
            let ch = this.props.repository.columns[column];
            let rh = this.props.repository.rows[row];
            return ch && rh && this._ctrlIsReadOnly({ row: rh, column: ch, source });
        };
        this._ctrlOnReadOnlyFilter = (cells, source) => {
            return cells.filter(e => !this._ctrlIsCellReadOnly(e, source));
        };
        //#endregion
        //#region elements handlers
        this._onCellMouseDown = (e) => {
            e.persist();
            let row = Number(e.currentTarget.getAttribute('x-row'));
            let column = Number(e.currentTarget.getAttribute('x-col'));
            if (e.button === 1) {
                this._chromeFix = { row, column };
            }
            this.focus();
            this._msCtr.mousedown(e, row, column);
        };
        this._onCellTouchStart = (e) => {
            let row = Number(e.currentTarget.getAttribute('x-row'));
            let column = Number(e.currentTarget.getAttribute('x-col'));
            this._chromeFix = { row, column };
            this.focus();
        };
        this._onHeaderMouseDownHeader = (e) => {
            e.persist();
            let type = Number(e.currentTarget.getAttribute('x-type'));
            let id = e.currentTarget.getAttribute('x-id');
            let h = this.props.repository.getHeader(id);
            this.focus();
            if (!h) {
                return;
            }
            if (this.props.onHeaderRightClick) {
                this.props.onHeaderRightClick({ header: h, event: e });
                if (e.defaultPrevented) {
                    return;
                }
            }
            let leaves = this.props.repository.getHeaderLeaves(h);
            let indices = leaves.map(v => this.props.repository.getViewIndex(v));
            if (!indices.length) {
                return;
            }
            let min = Math.min(...indices);
            let max = Math.max(...indices);
            this._msCtr.headerdown(e, type, min, max);
        };
        this._onCornerMouseDown = (e) => {
            if (!this.props.onRenderSelection || e.button !== 0 || e.defaultPrevented) {
                return;
            }
            const select = () => {
                this.setState({
                    selection: [{
                            row: 0,
                            column: 0,
                            width: this._columnCount - 1,
                            height: this._rowCount - 1
                        }]
                });
            };
            if (this.state.edit) {
                this.closeEditor(true, select);
                return;
            }
            select();
        };
        this._onCellMouseEnter = (e) => {
            let row = Number(e.currentTarget.getAttribute('x-row'));
            let column = Number(e.currentTarget.getAttribute('x-col'));
            this._msCtr.mouseenter(row, column);
        };
        this._renderHeadersLayer = (event) => {
            const { clientWidth, clientHeight, scrollLeft, scrollTop } = event;
            const cornerJsx = (this.props.onRenderHeaderCorner
                ? this.props.onRenderHeaderCorner()
                : null);
            return (React.createElement("div", { style: {
                    width: clientWidth,
                    height: clientHeight,
                    pointerEvents: 'none',
                    zIndex: 1,
                    overflow: 'hidden',
                    position: 'absolute'
                } },
                !!this.props.repository.offsetHeight &&
                    React.createElement("div", { className: this._theme.classNameGridColumns, style: Object.assign({}, this._theme.styleGridColumns, { pointerEvents: 'initial', position: 'absolute', overflow: 'hidden', left: this.props.repository.offsetWidth, top: 0, right: 0, height: this.props.repository.offsetHeight }) }, this._renderHeaders(HeaderType.Column, scrollLeft)),
                !!this.props.repository.offsetWidth &&
                    React.createElement("div", { className: this._theme.classNameGridRows, style: Object.assign({}, this._theme.styleGridRows, { pointerEvents: 'initial', position: 'absolute', overflow: 'hidden', left: 0, top: this.props.repository.offsetHeight, bottom: 0, width: this.props.repository.offsetWidth }) }, this._renderHeaders(HeaderType.Row, scrollTop)),
                !!(this.props.repository.offsetHeight || this.props.repository.offsetWidth) &&
                    React.createElement("div", { className: this._theme.classNameGridCorner, style: Object.assign({}, this._theme.styleGridCorner, { pointerEvents: 'initial', position: 'absolute', overflow: 'hidden', left: 0, top: 0, height: this.props.repository.offsetHeight, width: this.props.repository.offsetWidth }), onMouseDown: this._onCornerMouseDown }, cornerJsx),
                this._renderResizing(event)));
        };
        this._bodyRenderer = () => {
            return (React.createElement(React.Fragment, null,
                React.createElement("div", { style: {
                        height: Math.max(1, this._lastView.rowsHeight),
                        width: Math.max(1, this._lastView.columnsWidth),
                        boxSizing: 'border-box',
                        position: 'relative',
                        marginLeft: this._headersWidth,
                        marginTop: this._headersHeight
                    } }, this._renderData()),
                React.createElement("div", { style: {
                        position: 'absolute',
                        pointerEvents: 'none',
                        zIndex: 1,
                        left: this._headersWidth,
                        top: this._headersHeight
                    } }, this._renderSelections())));
        };
        /** TODO: instead of using column index - use cell position and viewport minus scroll size */
        this.scrollTo = (cell) => {
            const ctr = this.props.repository;
            if (!this._refView || !ctr.columns.length || !ctr.rows.length) {
                return;
            }
            const { firstColumn, firstRow, lastColumn, lastRow } = this._lastView;
            let { column, row } = cell;
            if (row != null) {
                row = Math.min(Math.max(0, row), this._rowCount - 1);
                if (row <= firstRow || row >= lastRow) {
                    let rowPos = ctr.getPosition(ctr.rows[row]);
                    if (row <= firstRow) { // to top
                        this._refView.scrollTop = rowPos;
                    }
                    else { // to bottom
                        let rowSize = ctr.getSize(ctr.rows[row]);
                        this._refView.scrollTop = rowPos + rowSize - this.state.viewHeight + this._headersHeight;
                    }
                }
            }
            if (column != null) {
                column = Math.min(Math.max(0, column), this._columnCount - 1);
                if (column <= firstColumn || column >= lastColumn) {
                    let colPos = ctr.getPosition(ctr.columns[column]);
                    if (column <= firstColumn) { // to left
                        this._refView.scrollLeft = colPos;
                    }
                    else { // to right
                        let colSize = ctr.getSize(ctr.columns[column]);
                        this._refView.scrollLeft = colPos + colSize - this.state.viewWidth + this._headersWidth;
                    }
                }
            }
        };
        this.openEditor = (cell) => {
            if (this.props.readOnly) {
                return;
            }
            let e = this.state.edit;
            if (e) {
                if (e.row === cell.row && e.column === cell.column) {
                    return;
                }
                this.closeEditor(true, () => {
                    this.setState({ edit: cell });
                });
                return;
            }
            let ch = this.props.repository.columns[cell.column];
            let rh = this.props.repository.rows[cell.row];
            let hs = { column: ch, row: rh, source: 'editor' };
            if (ch && rh && !this._ctrlIsNoEditor(hs) && !this._ctrlIsReadOnly(hs)) {
                this.setState({ edit: cell });
            }
        };
        this.closeEditor = (commit, callback) => {
            if (!this.state.edit) {
                this._currentEdit = null;
                this.focus();
                if (callback) {
                    callback();
                }
                return;
            }
            this.setState({ edit: null }, () => {
                let e = this._currentEdit;
                this._currentEdit = null;
                this.focus();
                if (callback) {
                    callback();
                }
                if (this.props.onUpdate && e) {
                    let { col, row, nextValue, updatedValue } = e;
                    if (commit && updatedValue) {
                        this.props.onUpdate({ cell: { row, column: col }, value: nextValue });
                    }
                }
            });
        };
        this.updateSelection = ({ active, selection }, callback) => {
            if (!active && !selection) {
                return;
            }
            let nextActive = active || this._active;
            let nextSelection = selection || this._selection;
            let notifyActiveChanged = this._ctrlGetActiveNotifier(this._active, nextActive);
            let notifySelectionChanged = this._ctrlGetSelectionNotifier(this._selection, nextSelection);
            this.setState({
                active: nextActive,
                selection: nextSelection
            }, () => {
                if (callback) {
                    callback();
                }
                if (notifyActiveChanged || notifySelectionChanged) {
                    let e = {};
                    if (notifyActiveChanged) {
                        e.active = notifyActiveChanged;
                    }
                    if (notifySelectionChanged) {
                        e.selection = notifySelectionChanged;
                    }
                    this.props.onSelection(e);
                }
            });
        };
        this._onAfterUpdate = debounce(500, this._onAfterUpdate.bind(this));
        this._kbCtr = new (p.keyboardControllerConstructor ?  ? KeyboardController :  : )({
            getState: this._ctrlGetState,
            onCloseEditor: this.closeEditor,
            onOpenEditor: this.openEditor,
            onScroll: this.scrollTo,
            onUpdateSelection: this.updateSelection,
            onCopy: this._ctrlCopy,
            onPaste: this._ctrlPaste,
            onNullify: this._ctrlNullify,
            onRemove: this._ctrlRemove,
            onSpace: this._ctrlSpace,
            onReadOnly: this._ctrlIsCellReadOnly
        });
        this._msCtr = new MouseController({
            getState: this._ctrlGetState,
            onCloseEditor: this.closeEditor,
            onOpenEditor: this.openEditor,
            onScroll: this.scrollTo,
            onUpdateSelection: this.updateSelection,
            onRightClick: this._ctrlRightClick
        });
    }
    //#region getters
    get _theme() {
        return this.props.theme || {};
    }
    get _columnCount() {
        return this.props.repository ? this.props.repository.columns.length : 0;
    }
    get _rowCount() {
        return this.props.repository ? this.props.repository.rows.length : 0;
    }
    get _headersHeight() {
        return this.props.repository.offsetHeight || 0;
    }
    get _headersWidth() {
        return this.props.repository.offsetWidth || 0;
    }
    get _selection() {
        return this.props.selection || this.state.selection;
    }
    get _active() {
        return (this.props.onRenderSelection
            ? this.props.active || this.state.active
            : DUMMY_CELL_ADDRESS);
    }
    _ctrlGetActiveNotifier(prev, next) {
        if (!this.props.onSelection || prev == next || (prev && next && prev.column === next.column && prev.row === next.row)) {
            return null;
        }
        prev = prev ? Object.assign({}, prev) : null;
        next = next ? Object.assign({}, next) : null;
        return { previous: prev, current: next };
    }
    _ctrlGetSelectionNotifier(prev, next) {
        if (!this.props.onSelection || prev == next) {
            return null;
        }
        if (prev && next && prev.length === next.length && prev.every((a, i) => {
            return (a.column === next[i].column
                && a.height === next[i].height
                && a.row === next[i].row
                && a.width === next[i].width);
        })) {
            return null;
        }
        prev = prev ? prev.slice().map(a => (Object.assign({}, a))) : null;
        next = next ? next.slice().map(a => (Object.assign({}, a))) : null;
        return { previous: prev, current: next };
    }
    _ctrlIsReadOnly(e) {
        if (this.props.onReadOnly) {
            return this.props.onReadOnly(e);
        }
        return e.column.$readOnly || e.row.$readOnly;
    }
    _ctrlIsNoEditor(e) {
        return e.column.$noEditor || e.row.$noEditor;
    }
    //#endregion
    _onAutoMeasureApply({ cells, headers }, behavior, workType, headerType) {
        cells = (cells || []).filter(v => !!v);
        headers = (headers || []).filter(v => !!v);
        const ctr = this.props.repository;
        const isReset = behavior === 'reset';
        const combinedEvent = {
            behavior
        };
        if ((workType === 'all' || workType === 'cells')) {
            const columnHeaders = ctr.columns;
            const rowHeaders = ctr.rows;
            let columns = {};
            let rows = {};
            let headerColSizes = {};
            let headerRowSizes = {};
            headers.forEach(({ height, width, header }) => {
                let vi = ctr.getViewIndex(header);
                if (ctr.getHeaderType(header) === HeaderType.Row) {
                    headerRowSizes[vi] = Math.max(headerRowSizes[vi] || 0, height);
                }
                else {
                    headerColSizes[vi] = Math.max(headerColSizes[vi] || 0, width);
                }
            });
            if (!cells.length) {
                let { firstColumn, firstRow, lastRow, lastColumn } = this._lastView;
                if (firstRow !== -1 || firstColumn !== -1) {
                    if (firstRow === -1) {
                        firstRow = 0;
                        lastRow = 0;
                    }
                    else {
                        firstColumn = 0;
                        lastColumn = 0;
                    }
                    for (let r = firstRow; r <= lastRow; r++) {
                        for (let c = firstColumn; c <= lastColumn; c++) {
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
            for (let { row, column, height, width } of cells) {
                columns[column] = Math.max(headerColSizes[column] || 0, columns[column] == null ? width : Math.max(width, columns[column]));
                rows[row] = Math.max(headerRowSizes[row] || 0, rows[row] == null ? height : Math.max(height, rows[row]));
            }
            let ch = (headerType === 'all' || headerType === HeaderType.Column)
                ? Object
                    .keys(columns)
                    .map(k => ({ columnIndex: Number(k), width: Math.round(columns[k]) }))
                    .filter(({ width, columnIndex }) => {
                    let h = columnHeaders[columnIndex];
                    let size = this.props.repository.getSize(h);
                    return h && (isReset || !ctr.getManualResized(h) && Math.round(size) < width);
                })
                    .map(({ columnIndex, width }) => ({
                    header: columnHeaders[columnIndex],
                    size: width,
                    type: ctr.getHeaderType(columnHeaders[columnIndex])
                }))
                : [];
            let rh = (headerType === 'all' || headerType === HeaderType.Row)
                ? Object
                    .keys(rows)
                    .map(k => ({ rowIndex: Number(k), height: Math.round(rows[k]) }))
                    .filter(({ rowIndex, height }) => {
                    let h = rowHeaders[rowIndex];
                    let size = this.props.repository.getSize(h);
                    return h && (isReset || !ctr.getManualResized(h) && Math.round(size) < height);
                })
                    .map(({ rowIndex, height }) => ({
                    header: rowHeaders[rowIndex],
                    size: height,
                    type: ctr.getHeaderType(rowHeaders[rowIndex])
                }))
                : [];
            if (ch.length || rh.length) {
                combinedEvent.headers = [...ch, ...rh];
            }
        }
        if ((workType === 'all' || workType === 'levels') && headers.length) {
            const topLevels = {};
            const leftLevels = {};
            for (let { header: h, height, width } of headers) {
                const type = ctr.getHeaderType(h);
                const level = ctr.getPositionLevel(h);
                if (ctr.getManualResizedLevel(type, level) && !isReset) {
                    return;
                }
                if (type === HeaderType.Column) {
                    topLevels[level] = (height > (topLevels[level] || 0)) ? height : topLevels[level];
                }
                else {
                    leftLevels[level] = (width > (leftLevels[level] || 0)) ? width : leftLevels[level];
                }
            }
            const top = (headerType === 'all' || headerType === HeaderType.Column)
                ? Object
                    .keys(topLevels)
                    .map((k) => {
                    const level = Number(k);
                    const size = topLevels[level];
                    if (size == null || !isReset && Math.round(size) <= Math.round(ctr.getTopLevelHeight(level))) {
                        return null;
                    }
                    return {
                        level, size,
                        type: HeaderType.Column
                    };
                })
                    .filter(v => !!v)
                : [];
            const left = (headerType === 'all' || headerType === HeaderType.Row)
                ? Object
                    .keys(leftLevels)
                    .map((k) => {
                    const level = Number(k);
                    const size = leftLevels[level];
                    if (size == null || !isReset && Math.round(size) <= Math.round(ctr.getLeftLevelWidth(level))) {
                        return null;
                    }
                    return {
                        level, size,
                        type: HeaderType.Row
                    };
                })
                    .filter(v => !!v)
                : [];
            if (top.length || left.length) {
                combinedEvent.levels = [...top, ...left];
            }
        }
        if (combinedEvent.headers || combinedEvent.levels) {
            this.props.onHeaderResize(combinedEvent);
        }
    }
    _onAutoMeasure() {
        if (this.state.edit || !this.props.onAutoMeasure || !this.props.onHeaderResize || !this._lastView) {
            return;
        }
        const { firstColumn, firstRow, lastRow, lastColumn } = this._lastView;
        const ctr = this.props.repository;
        const { columns, rows } = ctr;
        const cells = [];
        for (let r = firstRow; r <= lastRow; r++) {
            for (let c = firstColumn; c <= lastColumn; c++) {
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
        const columnHeaders = ctr.getNodesBottomUp(columns.slice(firstColumn, lastColumn + 1));
        const rowHeaders = ctr.getNodesBottomUp(rows.slice(firstRow, lastRow + 1));
        const headers = [...columnHeaders, ...rowHeaders].map((h) => {
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
            cells,
            headers,
            data: this.props.data,
            callback: (result) => {
                this._onAutoMeasureApply(result, 'auto', 'all', 'all');
            }
        });
    }
    _onAfterUpdate() {
        this._onAutoMeasure();
        if (this._refView) {
            let style = this._refView.scrollerStyle;
            style.willChange = '';
            setTimeout(() => {
                if (this._detached) {
                    return;
                }
                style.willChange = 'transform';
            }, 500);
        }
    }
    _createView() {
        const sl = this.state.scrollLeft;
        const st = this.state.scrollTop;
        const vw = this.state.viewWidth - this._headersWidth;
        const vh = this.state.viewHeight - this._headersHeight;
        let rowsHeight = 0;
        let firstRow = -1;
        let lastRow = -1;
        let rowIndex = 0;
        for (let rh of this.props.repository.rows) {
            let hsize = this.props.repository.getSize(rh);
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
        let columnsWidth = 0;
        let firstColumn = -1;
        let lastColumn = -1;
        let colIndex = 0;
        for (let ch of this.props.repository.columns) {
            let csize = this.props.repository.getSize(ch);
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
        let rhLast = this.props.repository.rows[this.props.repository.rows.length - 1];
        let chLast = this.props.repository.columns[this.props.repository.columns.length - 1];
        if (rhLast) {
            rowsHeight = this.props.repository.getPosition(rhLast) + this.props.repository.getSize(rhLast);
        }
        if (chLast) {
            columnsWidth = this.props.repository.getPosition(chLast) + this.props.repository.getSize(chLast);
        }
        this._lastView = { firstRow, lastRow, firstColumn, lastColumn, rowsHeight, columnsWidth };
    }
    _createOverscan() {
        if (!this._lastView) {
            return;
        }
        let { firstColumn, firstRow, lastColumn, lastRow } = this._lastView;
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
            firstRow, lastRow, firstColumn, lastColumn
        };
    }
    _prepareCellProps(row, col) {
        let rh = this.props.repository.rows[row];
        let ch = this.props.repository.columns[col];
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
    }
    _renderCell(row, col) {
        const props = this._prepareCellProps(row, col);
        if (!props) {
            return null;
        }
        const cell = this.props.onRenderCell(props);
        let eventHandlers = null;
        if (this.props.onRenderSelection) {
            eventHandlers = {
                onMouseDown: this._onCellMouseDown,
                onMouseEnter: this._onCellMouseEnter,
                onTouchStart: this._onCellTouchStart
            };
        }
        return React.cloneElement(React.Children.only(cell), Object.assign({ 'x-row': row, 'x-col': col, key: `C${row}x${col}` }, eventHandlers));
    }
    _renderEditor(row, col) {
        if (!this.props.onRenderEditor) {
            return this._renderCell(row, col);
        }
        if (!this._currentEdit || (this._currentEdit.row !== row || this._currentEdit.col !== col)) {
            this._currentEdit = {
                row, col,
                nextValue: null,
                updatedValue: false
            };
        }
        const props = this._prepareCellProps(row, col);
        if (!props) {
            return null;
        }
        const cell = this.props.onRenderEditor(Object.assign({}, props, { close: (commit) => {
                this.closeEditor(commit);
            }, update: (nextValue) => {
                this._currentEdit.nextValue = nextValue;
                this._currentEdit.updatedValue = true;
            } }));
        return React.cloneElement(React.Children.only(cell), {
            'x-row': row,
            'x-col': col,
            key: `E${row}x${col}`
        });
    }
    _renderData() {
        if (!this._lastOverscan) {
            return;
        }
        const { firstColumn, firstRow, lastColumn, lastRow } = this._lastOverscan;
        const columnCount = this._columnCount;
        const rowCount = this._rowCount;
        if (!columnCount || !rowCount) {
            return null;
        }
        let irlen = Math.max(0, Math.min(rowCount - firstRow, 1 + lastRow - firstRow));
        let iclen = Math.max(0, Math.min(columnCount - firstColumn, 1 + lastColumn - firstColumn));
        let jsx = new Array(irlen * iclen);
        let i = 0;
        let { edit } = this.state;
        for (let ir = 0; ir < irlen; ir++) {
            for (let ic = 0; ic < iclen; ic++) {
                let r = ir + firstRow;
                let c = ic + firstColumn;
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
        let wkfix = this._chromeFix;
        if (wkfix.column !== -1 && wkfix.row !== -1 && ((wkfix.column < firstColumn) || (wkfix.column > lastColumn) ||
            (wkfix.row < firstRow) || (wkfix.row > lastRow))) {
            jsx.push(this._renderCell(wkfix.row, wkfix.column));
        }
        return jsx;
    }
    _renderHeader(out, type, index, header, scrollPos, lock, parent) {
        let { $id, $children } = header;
        if (lock.has($id)) {
            return;
        }
        lock.add($id);
        let style = {
            position: 'absolute',
            zIndex: 1
        };
        let level = this.props.repository.getLevel(header);
        let headerSize = this.props.repository.getSize(header);
        if (type === HeaderType.Row) {
            style.left = this.props.repository.getLeftLevelPosition(level); // 0;
            style.width = this.props.repository.getLeftLevelWidth(level, header.$collapsed); // headersWidth;
            style.top = this.props.repository.getPosition(header) - scrollPos;
            style.height = headerSize;
            let levels = this.props.repository.leftLevels;
            if (level < (levels - 1) && (!$children || !$children.length)) {
                style.width = this.props.repository.offsetWidth - style.left;
            }
        }
        else {
            style.top = this.props.repository.getTopLevelPosition(level);
            style.height = this.props.repository.getTopLevelHeight(level, header.$collapsed); // headersHeight;
            style.left = this.props.repository.getPosition(header) - scrollPos;
            style.width = headerSize;
            let levels = this.props.repository.topLevels;
            if (level < (levels - 1) && (!$children || !$children.length)) {
                style.height = this.props.repository.offsetHeight - style.top;
            }
        }
        let selection = false;
        if (this.props.onRenderSelection) {
            for (let s of this._selection) {
                if (type === HeaderType.Row) {
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
        let headerParent = this.props.repository.getParent(header);
        let cell = this.props.onRenderHeader({
            type, header, style, parent,
            selection: parent ? false : selection,
            parentHeader: headerParent,
            theme: this.props.theme,
            viewIndex: this.props.repository.getViewIndex(header)
        });
        let eventHandlers = null;
        if (this.props.onRenderSelection) {
            eventHandlers = {
                onMouseDown: this._onHeaderMouseDownHeader
            };
        }
        out.push(React.cloneElement(React.Children.only(cell), Object.assign({ 'x-type': type, 'x-id': $id, 'x-lvl': level, key: $id }, eventHandlers)));
        if (headerParent) {
            this._renderHeader(out, type, index, headerParent, scrollPos, lock, true);
        }
    }
    _renderHeaders(type, scrollPos) {
        if (!this._lastOverscan) {
            return;
        }
        const { firstColumn, firstRow, lastColumn, lastRow } = this._lastOverscan;
        const isRow = type === HeaderType.Row;
        const first = isRow ? firstRow : firstColumn;
        const last = isRow ? lastRow : lastColumn;
        const max = isRow ? this._rowCount : this._columnCount;
        const headers = isRow ? this.props.repository.rows : this.props.repository.columns;
        let len = Math.max(0, Math.min(max - first, 1 + last - first));
        let jsx = [];
        let lock = new Set();
        for (let i = 0; i < len; i++) {
            let ix = i + first;
            this._renderHeader(jsx, type, ix, headers[ix], scrollPos, lock, false);
        }
        return (React.createElement(React.Fragment, null, jsx));
    }
    _renderResizing({ scrollLeft, scrollTop }) {
        if (!this.props.onRenderResizer || !this.state.resizeHeaderPreview && !this.state.resizeLevelPreview) {
            return null;
        }
        let type;
        let orientation;
        let styleInitial = {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 100
        };
        let styleChanged = {
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 100
        };
        if (this.state.resizeHeaderPreview) {
            type = 'header';
            let { change, header } = this.state.resizeHeaderPreview;
            let headerType = this.props.repository.getHeaderType(header);
            let headerPosition = this.props.repository.getPosition(header);
            let headerSize = this.props.repository.getSize(header);
            if (headerType === HeaderType.Row) {
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
            let { change, header } = this.state.resizeLevelPreview;
            let headerType = this.props.repository.getHeaderType(header);
            let level = this.props.repository.getPositionLevel(header);
            if (headerType === HeaderType.Row) { // resizing left level
                orientation = 'vertical';
                let position = this.props.repository.getLeftLevelPosition(level);
                let size = this.props.repository.getLeftLevelWidth(level);
                styleChanged.top = styleInitial.top = 0;
                styleChanged.bottom = styleInitial.bottom = 0;
                styleChanged.left = styleInitial.left = position;
                styleInitial.width = size;
                styleChanged.width = size + change;
            }
            else { // resizing top level
                orientation = 'horizontal';
                let position = this.props.repository.getTopLevelPosition(level);
                let size = this.props.repository.getTopLevelHeight(level);
                styleChanged.left = styleInitial.left = 0;
                styleChanged.right = styleInitial.right = 0;
                styleChanged.top = styleInitial.top = position;
                styleInitial.height = size;
                styleChanged.height = size + change;
            }
        }
        if (this.state.resizeHeaderPreview || this.state.resizeLevelPreview) {
            return (React.createElement(React.Fragment, null,
                this.props.onRenderResizer({ type, orientation, style: styleInitial, resizer: 'initial', theme: this.props.theme }),
                this.props.onRenderResizer({ type, orientation, style: styleChanged, resizer: 'changed', theme: this.props.theme })));
        }
        return null;
    }
    _isAddressOutOfBounds(cell) {
        let lastRow = this.props.repository.rows.length - 1;
        let lastCol = this.props.repository.columns.length - 1;
        return cell.column < 0 || cell.column > lastCol || cell.row < 0 || cell.row > lastRow;
    }
    _getFilteredSelections() {
        let lastCol = this.props.repository.columns.length - 1;
        let lastRow = this.props.repository.rows.length - 1;
        return this._selection.filter(({ column, row }) => {
            return row <= lastRow && column <= lastCol;
        });
    }
    _renderSelections() {
        if (!this.props.onRenderSelection) {
            return null;
        }
        const ctr = this.props.repository;
        if (!ctr.columns.length || !ctr.rows.length) {
            return null;
        }
        let jsx = this._getFilteredSelections().map(({ row, column, width, height }, i) => {
            let l = ctr.getPosition(ctr.columns[column]);
            let t = ctr.getPosition(ctr.rows[row]);
            let w = ctr.columns.slice(column, column + width + 1).reduce((r, n) => r + ctr.getSize(n), 0);
            let h = ctr.rows.slice(row, row + height + 1).reduce((r, n) => r + ctr.getSize(n), 0);
            return this.props.onRenderSelection({
                key: i,
                active: false,
                edit: !!this.state.edit,
                theme: this.props.theme,
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
        let ax = jsx.length;
        if (!this._isAddressOutOfBounds(this._active)) {
            let rh = ctr.rows[this._active.row];
            let ch = ctr.columns[this._active.column];
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
    }
    focus() {
        if (this._ref) {
            this._ref.focus();
            this._focused = true;
        }
    }
    blur() {
        if (this._ref) {
            this._ref.blur();
        }
    }
    resizeHeaders(e) {
        if (this.props.onHeaderResize) {
            this.props.onHeaderResize(e);
        }
    }
    autoMeasure(headers, type = 'cells') {
        if (!headers || !headers.length || this.state.edit || !this.props.onAutoMeasure || !this.props.onHeaderResize || !this._lastView) {
            return;
        }
        const repository = this.props.repository;
        const { firstColumn, firstRow, lastRow, lastColumn } = this._lastView;
        if (firstColumn === -1 || firstRow === -1) {
            return;
        }
        const headerType = repository.getHeaderType(headers[0]);
        const diffHeaders = headers.filter(h => repository.getHeaderType(h) !== headerType);
        const cellNodes = [];
        headers = headers.filter(h => repository.getHeaderType(h) === headerType);
        if (diffHeaders.length) {
            this.autoMeasure(diffHeaders, type);
        }
        if (type === 'cells') {
            const batch = headers.map(h => repository.getHeaderLeaves(h));
            const { columns, rows } = repository;
            for (let list of batch) {
                for (let h of list) {
                    let t = repository.getHeaderType(h);
                    if (t === HeaderType.Column) {
                        let c = repository.getViewIndex(h);
                        for (let r = firstRow; r <= lastRow; r++) {
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
                        let r = repository.getViewIndex(h);
                        for (let c = firstColumn; c <= lastColumn; c++) {
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
            const levels = new Set();
            headers.forEach((h) => {
                levels.add(repository.getPositionLevel(h));
            });
            const list = (headerType === HeaderType.Column
                ? repository.columns.slice(firstColumn, lastColumn + 1)
                : repository.rows.slice(firstRow, lastRow + 1));
            headers = repository.getNodesBottomUp(list).filter(h => levels.has(repository.getPositionLevel(h)));
        }
        const headerNodes = headers.map((h) => {
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
            callback: (result) => {
                this._onAutoMeasureApply(result, 'reset', type, headerType);
            }
        });
    }
    previewResizeHeader(resizeHeaderPreview) {
        this.setState({ resizeHeaderPreview });
    }
    previewResizeLevel(resizeLevelPreview) {
        this.setState({ resizeLevelPreview });
    }
    componentDidMount() {
        document.body.addEventListener('contextmenu', this._onContextMenuListener = (e) => {
            if (this._blockContextMenu) {
                this._blockContextMenu = false;
                e.preventDefault();
            }
        });
    }
    componentDidUpdate(pp) {
        const isSourceChanged = pp.data !== this.props.data;
        const isHeadersChanged = pp.repository !== this.props.repository;
        if (this.state.edit && (isSourceChanged || isHeadersChanged)) {
            this.closeEditor(false);
        }
        this._onAfterUpdate();
    }
    componentWillUnmount() {
        this._detached = true;
        document.body.removeEventListener('contextmenu', this._onContextMenuListener);
        this._kbCtr.dispose();
        this._msCtr.dispose();
    }
    render() {
        this._createView();
        this._createOverscan();
        const ScrollView = this.props.scrollViewClass || FallbackScrollView;
        return (React.createElement(Context.Provider, { value: { grid: this, repository: this.props.repository } },
            React.createElement("div", { className: this._theme.classNameGrid, tabIndex: this.props.tabIndex, ref: this._onRef, onBlur: this._onBlur, onFocus: this._onFocus, style: Object.assign({ display: 'block', height: '100%', width: '100%', position: 'relative', userSelect: 'none', outline: 'none', overflow: 'hidden' }, this._theme.styleGrid), onKeyDown: this._onKeyDown, onMouseLeave: this._onRootMouseLeave, onMouseEnter: this._onRootMouseEnter, onMouseDown: this._onRootMouseDown },
                React.createElement(ScrollView, { className: this._theme.classNameScrollView, ref: this._onRefView, onScroll: this._onScrollViewUpdate, style: this._scrollerStyle, headersRenderer: this._renderHeadersLayer, bodyRenderer: this._bodyRenderer, preserveScrollbars: this.props.preserveScrollbars }))));
    }
}
Grid.propTypes = {
    tabIndex: PropType.number,
    preserveScrollbars: PropType.bool,
    repository: PropType.instanceOf(HeaderRepository).isRequired,
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
export default Grid;

//# sourceMappingURL=grid.js.map
