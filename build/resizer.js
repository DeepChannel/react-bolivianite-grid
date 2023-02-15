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
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var types_1 = require("./types");
var context_1 = require("./context");
var Resizer = /** @class */ (function (_super) {
    __extends(Resizer, _super);
    function Resizer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._moving = null;
        _this._moveListener = null;
        _this._upListener = null;
        _this._escListener = null;
        _this._moved = false;
        _this._onMouseDown = function (e) {
            _this._moved = false;
            e.preventDefault();
            if (e.button !== 0) {
                return;
            }
            var type = e.currentTarget.getAttribute('x-type');
            var p = type === 'r' ? e.pageX : e.pageY;
            var headerType = _this._repository.getHeaderType(_this.props.header);
            var isRow = headerType === types_1.HeaderType.Row;
            _this._unbind();
            var now = Date.now();
            var movingType = (type === 'r'
                ? isRow
                    ? 'left-level'
                    : 'column'
                : isRow
                    ? 'row'
                    : 'top-level');
            if (_this._lastClick && _this._lastClick.type === movingType && (now - _this._lastClick.time < 500)) {
                _this._grid.previewResizeHeader(null);
                _this._grid.previewResizeLevel(null);
                _this._unbind();
                var workType = movingType === 'column' || movingType === 'row' ? 'cells' : 'levels';
                _this._grid.autoMeasure([_this.props.header], workType);
                return;
            }
            _this._moving = {
                type: movingType,
                start: p
            };
            _this._lastClick = {
                type: movingType,
                time: now
            };
            var change = 0;
            window.addEventListener('mouseup', _this._upListener = function () {
                _this._onChange(change);
                _this._moved = false;
                _this._grid.previewResizeHeader(null);
                _this._grid.previewResizeLevel(null);
                _this._unbind();
            });
            window.addEventListener('keydown', _this._escListener = function (ev) {
                if (ev.keyCode === 27) { // esc
                    _this._unbind();
                }
            });
            document.body.addEventListener('mousemove', _this._moveListener = function (ev) {
                if (!_this._moving) {
                    return;
                }
                _this._moved = true;
                var m = type === 'r' ? ev.pageX : ev.pageY;
                change = m - _this._moving.start;
                _this._onMove(change);
            });
        };
        return _this;
    }
    Resizer.prototype._unbind = function () {
        if (this._moving) {
            this._grid.previewResizeHeader(null);
            this._grid.previewResizeLevel(null);
        }
        if (this._moveListener) {
            document.body.removeEventListener('mousemove', this._moveListener);
            this._moveListener = null;
        }
        if (this._upListener) {
            window.removeEventListener('mouseup', this._upListener);
            this._upListener = null;
        }
        if (this._escListener) {
            window.removeEventListener('keydown', this._escListener);
            this._escListener = null;
        }
        this._moving = null;
    };
    Resizer.prototype._onMove = function (change) {
        if (!this._moving) {
            return;
        }
        var type = this._moving.type;
        var header = this.props.header;
        switch (type) {
            case 'column':
            case 'row':
                this._grid.previewResizeHeader({
                    header: header,
                    change: change,
                });
                break;
            case 'left-level':
            case 'top-level':
                this._grid.previewResizeLevel({
                    header: header,
                    change: change,
                });
                break;
        }
    };
    Resizer.prototype._onChange = function (change) {
        if (!this._moving || !this._moved) {
            return;
        }
        var type = this._moving.type;
        var header = this.props.header;
        switch (type) {
            case 'column':
            case 'row':
                this._grid.resizeHeaders({
                    behavior: 'manual',
                    headers: [{
                            type: type === 'row' ? types_1.HeaderType.Row : types_1.HeaderType.Column,
                            header: header,
                            size: this._repository.getSize(header) + change
                        }]
                });
                break;
            case 'left-level':
            case 'top-level':
                var start = (type === 'left-level'
                    ? this._repository.getLeftLevelWidth(this._repository.getPositionLevel(header))
                    : this._repository.getTopLevelHeight(this._repository.getPositionLevel(header)));
                this._grid.resizeHeaders({
                    behavior: 'manual',
                    levels: [{
                            type: type === 'left-level' ? types_1.HeaderType.Row : types_1.HeaderType.Column,
                            level: this._repository.getPositionLevel(header),
                            size: start + change
                        }]
                });
                break;
        }
    };
    Resizer.prototype.componentWillUnmount = function () {
        this._unbind();
    };
    Resizer.prototype.render = function () {
        var _this = this;
        return (React.createElement(context_1.default.Consumer, null, function (_a) {
            var grid = _a.grid, repository = _a.repository;
            _this._grid = grid;
            _this._repository = repository;
            return (React.createElement(React.Fragment, null,
                React.createElement("div", { "x-type": "r", style: Resizer._r, onMouseDown: _this._onMouseDown }),
                React.createElement("div", { "x-type": "b", style: Resizer._b, onMouseDown: _this._onMouseDown })));
        }));
    };
    Resizer._r = {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 6,
        cursor: 'col-resize'
    };
    Resizer._b = {
        position: 'absolute',
        right: 0,
        height: 6,
        bottom: 0,
        left: 0,
        cursor: 'row-resize'
    };
    return Resizer;
}(React.PureComponent));
exports.Resizer = Resizer;
exports.default = Resizer;

//# sourceMappingURL=resizer.js.map
