import * as React from 'react';
export class ScrollView extends React.Component {
    constructor(p, c) {
        super(p, c);
        this._taskResize = null;
        this._onRef = (r) => {
            this._r = r;
        };
        this._onScroll = (e) => {
            if (!this.props.onScroll || e && this._r !== e.target) {
                return;
            }
            // Calling forceUpdate to prevent browser freeze.
            this.forceUpdate(() => {
                if (this.props.onScroll) {
                    this.props.onScroll(this._getView());
                }
            });
        };
    }
    get scrollerStyle() {
        return this._r.style;
    }
    get scrollLeft() {
        return this._r.scrollLeft;
    }
    set scrollLeft(v) {
        this._r.scrollLeft = v;
    }
    get scrollTop() {
        return this._r.scrollTop;
    }
    set scrollTop(v) {
        this._r.scrollTop = v;
    }
    _getView() {
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
    }
    componentDidMount() {
        let w = this._r.clientWidth;
        let h = this._r.clientHeight;
        this._taskResize = setInterval(() => {
            let nw = this._r.clientWidth;
            let nh = this._r.clientHeight;
            if (nw !== w || nh !== h) {
                w = nw;
                h = nh;
                this._onScroll(null);
            }
        }, 100);
        if (this.props.onScroll) {
            this.props.onScroll(this._getView());
        }
    }
    componentWillUnmount() {
        clearInterval(this._taskResize);
    }
    render() {
        const view = this._getView();
        return (React.createElement("div", { style: {
                height: '100%',
                width: '100%',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden'
            } },
            React.createElement("div", { className: this.props.className, ref: this._onRef, onScroll: this._onScroll, style: Object.assign({}, this.props.style, { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: this.props.preserveScrollbars ? 'scroll' : 'auto' }) }, this.props.bodyRenderer(view)),
            this.props.headersRenderer(view)));
    }
}
export default ScrollView;

//# sourceMappingURL=scroll-view.js.map
