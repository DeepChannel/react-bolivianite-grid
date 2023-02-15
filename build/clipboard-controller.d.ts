import { IGridAddress, IGridCopyEvent, IGridPasteEvent, IHeader, HeaderType } from './types';
import { HeaderRepository } from './header-repository';
export interface ICopyPasteRenderCellEvent {
    cell: IGridAddress;
    data: any;
    repository: HeaderRepository;
}
export interface ICopyPasteRenderHeaderEvent {
    header: IHeader;
    type: HeaderType;
}
export interface ICopyPasteResultEvent {
    table: any[][];
    focus: () => void;
}
export interface ICopyPasteParseEvent extends IGridAddress {
    value: string;
}
export interface ICopyPasteUpdateEvent {
    changes: (IGridAddress & {
        value: any;
    })[];
}
export interface ICopyPasteControllerProps {
    onInvalidSelection?: () => void;
    renderCell: (e: ICopyPasteRenderCellEvent) => string;
    renderHeader: (e: ICopyPasteRenderHeaderEvent) => string;
    clipboardParser: (data: DataTransfer) => string[][];
    cellParser: (e: ICopyPasteParseEvent) => any;
    onCopy: (e: ICopyPasteResultEvent) => void;
    onPaste: (e: ICopyPasteUpdateEvent) => void;
}
export declare class ClipboardController {
    props: ICopyPasteControllerProps;
    constructor(props: ICopyPasteControllerProps);
    private _getValidatedTable;
    private _renderHeader;
    private _transpose;
    onCopy: ({ cells, repository, data, withHeaders, focus }: IGridCopyEvent) => void;
    onPaste: ({ clipboard, target, isReadOnly }: IGridPasteEvent) => void;
}
