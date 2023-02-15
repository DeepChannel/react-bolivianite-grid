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
var ScrollView = /** @class */ (function (_super) {
    __extends(ScrollView, _super);
    function ScrollView(p, c) {
        var _this = _super.call(this, p, c) || this;
        _this._taskResize = null;
        _this._onRef = function (r) {
            _this._r = r;
        };
        _this._onScroll = function (e) {
            if (!_this.props.onScroll || e && _this._r !== e.target) {
                return;
            }
            // Calling forceUpdate to prevent browser freeze.
            _this.forceUpdate(function () {
                if (_this.props.onScroll) {
                    _this.props.onScroll(_this._getView());
                }
            });
        };
        return _this;
    }
    Object.defineProperty(ScrollView.prototype, "scrollerStyle", {
        get: function () {
            return this._r.style;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ScrollView.prototype, "scrollLeft", {
        get: function () {
            return this._r.scrollLeft;
        },
        set: function (v) {
            this._r.scrollLeft = v;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ScrollView.prototype, "scrollTop", {
        get: function () {
            return this._r.scrollTop;
        },
        set: function (v) {
            this._r.scrollTop = v;
        },
        enumerable: true,
        configurable: true
    });
    ScrollView.prototype._getView = function () {
        if (!this._r) {
            return {
                scrollLeft: 0,
                scrollTop: 0,
                scrollWidth: 0,
                scrollHeight: 0,
                clientWidth: 0,
                clientHeight: 0
            };
        }
        return {
            scrollLeft: this._r.scrollLeft,
            scrollTop: this._r.scrollTop,
            scrollWidth: this._r.scrollWidth,
            scrollHeight: this._r.scrollHeight,
            clientWidth: this._r.clientWidth,
            clientHeight: this._r.clientHeight
        };
    };
    ScrollView.prototype.componentDidMount = function () {
        var _this = this;
        var w = this._r.clientWidth;
        var h = this._r.clientHeight;
        this._taskResize = setInterval(function () {
            var nw = _this._r.clientWidth;
            var nh = _this._r.clientHeight;
            if (nw !== w || nh !== h) {
                w = nw;
                h = nh;
                _this._onScroll(null);
            }
        }, 100);
        if (this.props.onScroll) {
            this.props.onScroll(this._getView());
        }
    };
    ScrollView.prototype.componentWillUnmount = function () {
        clearInterval(this._taskResize);
    };
    ScrollView.prototype.render = function () {
        var view = this._getView();
        return (React.createElement("div", { style: {
                height: '100%',
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden'
            } },
            React.createElement("div", { className: this.props.className, ref: this._onRef, onScroll: this._onScroll, style: __assign({}, this.props.style, { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: this.props.preserveScrollbars ? 'scroll' : 'auto' }) }, this.props.bodyRenderer(view)),
            this.props.headersRenderer(view)));
    };
    return ScrollView;
}(React.Component));
exports.ScrollView = ScrollView;
exports.default = ScrollView;

//# sourceMappingURL=scroll-view.js.map
