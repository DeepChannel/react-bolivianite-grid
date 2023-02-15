import * as React from 'react';
import { HeaderType } from './types';
import Context from './context';
export class Resizer extends React.PureComponent {
    constructor() {
        super(...arguments);
        this._moving = null;
        this._moveListener = null;
        this._upListener = null;
        this._escListener = null;
        this._moved = false;
        this._onMouseDown = (e) => {
            this._moved = false;
            e.preventDefault();
            if (e.button !== 0) {
                return;
            }
            let type = e.currentTarget.getAttribute('x-type');
            let p = type === 'r' ? e.pageX : e.pageY;
            let headerType = this._repository.getHeaderType(this.props.header);
            let isRow = headerType === HeaderType.Row;
            this._unbind();
            let now = Date.now();
            let movingType = (type === 'r'
                ? isRow
                    ? 'left-level'
                    : 'column'
                : isRow
                    ? 'row'
                    : 'top-level');
            if (this._lastClick && this._lastClick.type === movingType && (now - this._lastClick.time < 500)) {
                this._grid.previewResizeHeader(null);
                this._grid.previewResizeLevel(null);
                this._unbind();
                const workType = movingType === 'column' || movingType === 'row' ? 'cells' : 'levels';
                this._grid.autoMeasure([this.props.header], workType);
                return;
            }
            this._moving = {
                type: movingType,
                start: p
            };
            this._lastClick = {
                type: movingType,
                time: now
            };
            let change = 0;
            window.addEventListener('mouseup', this._upListener = () => {
                this._onChange(change);
                this._moved = false;
                this._grid.previewResizeHeader(null);
                this._grid.previewResizeLevel(null);
                this._unbind();
            });
            window.addEventListener('keydown', this._escListener = (ev) => {
                if (ev.keyCode === 27) { // esc
                    this._unbind();
                }
            });
            document.body.addEventListener('mousemove', this._moveListener = (ev) => {
                if (!this._moving) {
                    return;
                }
                this._moved = true;
                let m = type === 'r' ? ev.pageX : ev.pageY;
                change = m - this._moving.start;
                this._onMove(change);
            });
        };
    }
    _unbind() {
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
    }
    _onMove(change) {
        if (!this._moving) {
            return;
        }
        let { type } = this._moving;
        let { header } = this.props;
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
    }
    _onChange(change) {
        if (!this._moving || !this._moved) {
            return;
        }
        let { type } = this._moving;
        let { header } = this.props;
        switch (type) {
            case 'column':
            case 'row':
                this._grid.resizeHeaders({
                    behavior: 'manual',
                    headers: [{
                            type: type === 'row' ? HeaderType.Row : HeaderType.Column,
                            header: header,
                            size: this._repository.getSize(header) + change
                        }]
                });
                break;
            case 'left-level':
            case 'top-level':
                let start = (type === 'left-level'
                    ? this._repository.getLeftLevelWidth(this._repository.getPositionLevel(header))
                    : this._repository.getTopLevelHeight(this._repository.getPositionLevel(header)));
                this._grid.resizeHeaders({
                    behavior: 'manual',
                    levels: [{
                            type: type === 'left-level' ? HeaderType.Row : HeaderType.Column,
                            level: this._repository.getPositionLevel(header),
                            size: start + change
                        }]
                });
                break;
        }
    }
    componentWillUnmount() {
        this._unbind();
    }
    render() {
        return (React.createElement(Context.Consumer, null, ({ grid, repository }) => {
            this._grid = grid;
            this._repository = repository;
            return (React.createElement(React.Fragment, null,
                React.createElement("div", { "x-type": "r", style: Resizer._r, onMouseDown: this._onMouseDown }),
                React.createElement("div", { "x-type": "b", style: Resizer._b, onMouseDown: this._onMouseDown })));
        }));
    }
}
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
export default Resizer;

//# sourceMappingURL=resizer.js.map
