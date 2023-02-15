import { KeyboardEvent } from 'react';
import { IGridAddress, TGridReadOnlyEventSource } from './types';
import { Controller, IControllerProps } from './base-controller';
export interface IKeyboardControllerRemoveEvent {
    rows: number[];
    columns: number[];
}
export interface IKeyboardControllerPasteEvent {
    clipboard: DataTransfer;
    getAllSelectedCells: () => IGridAddress[];
    getLastSelectedCells: () => IGridAddress[];
    isReadOnly: (cell: IGridAddress) => boolean;
}
export interface IKeyboardControllerProps extends IControllerProps {
    onNullify: (cells: IGridAddress[]) => void;
    onRemove: (props: IKeyboardControllerRemoveEvent) => void;
    onSpace: (cells: IGridAddress[]) => void;
    onCopy: (cells: IGridAddress[], withHeaders: boolean) => void;
    onPaste: (event: IKeyboardControllerPasteEvent) => void;
    onReadOnly: (cell: IGridAddress, source: TGridReadOnlyEventSource) => boolean;
}
export interface IKeyboardController {
    keydown: (e: KeyboardEvent<HTMLDivElement>) => void;
    dispose: () => void;
}
export interface IKeyboardControllerConstructor {
    new (props: IKeyboardControllerProps): IKeyboardController;
}
export declare class KeyboardController extends Controller implements IKeyboardController {
    protected _props: IKeyboardControllerProps;
    constructor(_props: IKeyboardControllerProps);
    protected _isInput(e: KeyboardEvent<HTMLDivElement>): boolean;
    protected _moveSelection(shiftKey: boolean, cmdKey: boolean, direction: 'left' | 'up' | 'right' | 'down', distance: number): void;
    protected _onTab(e: KeyboardEvent<HTMLDivElement>, callback?: () => void): void;
    protected _onEnter(e: KeyboardEvent<HTMLDivElement>, callback?: () => void): void;
    protected _onSpace(e: KeyboardEvent<HTMLDivElement>): void;
    protected _onPageUpDown(e: KeyboardEvent<HTMLDivElement>): void;
    protected _onHomeEnd(e: KeyboardEvent<HTMLDivElement>): void;
    protected _onArrows(e: KeyboardEvent<HTMLDivElement>): void;
    protected _onCopy(withHeaders: boolean): void;
    protected _onNullify(): void;
    protected _onRemove(): void;
    protected _onSelectAll(e: KeyboardEvent<HTMLDivElement>): void;
    protected _onData(e: KeyboardEvent<HTMLDivElement>): void;
    protected _paste: (e: ClipboardEvent) => void;
    keydown(e: KeyboardEvent<HTMLDivElement>): void;
    dispose(): void;
}
export default KeyboardController;
