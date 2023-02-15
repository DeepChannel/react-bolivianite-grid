import { MouseEvent } from 'react';
import { IGridAddress, HeaderType } from './types';
import { Controller, IControllerProps } from './base-controller';
export interface IMouseControllerProps extends IControllerProps {
    onRightClick: (cell: IGridAddress, event: React.MouseEvent<HTMLElement>, select: () => void, inside: boolean) => void;
}
export declare class MouseController extends Controller {
    protected _props: IMouseControllerProps;
    protected _lastMouseDown: {
        time: number;
        row: number;
        column: number;
    };
    protected _down: {
        row: number;
        column: number;
    };
    protected _scrollBySelect: {
        h: 'L' | 'R';
        v: 'T' | 'B';
    };
    protected _scrollTask: any;
    constructor(_props: IMouseControllerProps);
    protected _mouseSelectFromActive(row: number, column: number): void;
    protected _autoscroll: () => void;
    protected _mouseup: () => void;
    rootleave(x: number, y: number, rect: ClientRect): void;
    rootenter(): void;
    mouseenter(row: number, column: number): void;
    headerdown(e: MouseEvent<HTMLElement>, type: HeaderType, first: number, last?: number): void;
    mousedown(e: MouseEvent<HTMLElement>, row: number, column: number): void;
    dispose(): void;
}
export default MouseController;
