import * as React from 'react';
import { IHeader } from './types';
export interface IResizerProps {
    header: IHeader;
}
export declare class Resizer extends React.PureComponent<IResizerProps, any> {
    private static _r;
    private static _b;
    private _moving;
    private _lastClick;
    private _moveListener;
    private _upListener;
    private _escListener;
    private _moved;
    private _grid;
    private _repository;
    private _unbind;
    private _onMove;
    private _onChange;
    private _onMouseDown;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
export default Resizer;
