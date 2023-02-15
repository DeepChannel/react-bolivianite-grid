import { KeyboardEvent, MouseEvent } from 'react';
import { IGridAddress, IGridSelection, IGridView } from './types';
export interface IState {
    enabled: boolean;
    focused: boolean;
    editor: IGridAddress;
    active: IGridAddress;
    selection: IGridSelection[];
    view: IGridView;
    rows: number;
    columns: number;
    readOnly: boolean;
}
export interface IUpdateSelectionEvent {
    active?: IGridAddress;
    selection?: IGridSelection[];
}
export interface IControllerProps {
    getState: () => IState;
    onScroll: (cell: IGridAddress) => void;
    onUpdateSelection: (next: IUpdateSelectionEvent, callback?: () => void) => void;
    onCloseEditor: (commit: boolean, onClosed?: () => void) => void;
    onOpenEditor: (next: IGridAddress) => void;
}
export declare class Controller {
    protected _props: IControllerProps;
    protected _state: IState;
    constructor(_props: IControllerProps);
    protected _getModifiers(e: KeyboardEvent<HTMLElement> | MouseEvent<HTMLElement>): {
        ctrlKey: boolean;
        macCmdKey: boolean;
        cmdKey: boolean;
        shiftKey: boolean;
        altKey: boolean;
    };
    protected _clampAddress({ column, row }: IGridAddress): IGridAddress;
    protected _splitSelection(selection: IGridSelection[]): {
        prev: IGridSelection[];
        last: IGridSelection;
    };
    protected _getSelectedCells(selection: IGridSelection[]): IGridAddress[];
    protected _isInsideSelection({ column: c, row: r }: IGridAddress, selection: IGridSelection[]): boolean;
    protected _request(): IState;
}
