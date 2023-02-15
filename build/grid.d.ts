import * as React from 'react';
import * as PropType from 'prop-types';
import { IUpdateSelectionEvent } from './base-controller';
import { HeaderRepository } from './header-repository';
import { IGridProps, IGridResizeCombinedEvent, IGridAddress, IGridSelection, IHeader } from './types';
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'react-bolivianite-grid': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        }
    }
}
export declare class Grid extends React.PureComponent<IGridProps, any> {
    static propTypes: {
        tabIndex: PropType.Requireable<number>;
        preserveScrollbars: PropType.Requireable<boolean>;
        repository: PropType.Validator<HeaderRepository>;
        data: PropType.Requireable<any>;
        readOnly: PropType.Requireable<boolean>;
        overscanRows: PropType.Requireable<number>;
        overscanColumns: PropType.Requireable<number>;
        theme: PropType.Requireable<object>;
        active: PropType.Requireable<object>;
        selection: PropType.Requireable<any[]>;
        onRenderCell: PropType.Validator<(...args: any[]) => any>;
        onRenderHeader: PropType.Validator<(...args: any[]) => any>;
        onRenderHeaderCorner: PropType.Requireable<(...args: any[]) => any>;
        onRenderSelection: PropType.Requireable<(...args: any[]) => any>;
        onRenderEditor: PropType.Requireable<(...args: any[]) => any>;
        onRenderResizer: PropType.Requireable<(...args: any[]) => any>;
        onAutoMeasure: PropType.Requireable<(...args: any[]) => any>;
        onSpace: PropType.Requireable<(...args: any[]) => any>;
        onRemove: PropType.Requireable<(...args: any[]) => any>;
        onNullify: PropType.Requireable<(...args: any[]) => any>;
        onCopy: PropType.Requireable<(...args: any[]) => any>;
        onPaste: PropType.Requireable<(...args: any[]) => any>;
        onRightClick: PropType.Requireable<(...args: any[]) => any>;
        onHeaderRightClick: PropType.Requireable<(...args: any[]) => any>;
        onUpdate: PropType.Requireable<(...args: any[]) => any>;
        onSelection: PropType.Requireable<(...args: any[]) => any>;
        onHeaderResize: PropType.Requireable<(...args: any[]) => any>;
        onReadOnly: PropType.Requireable<(...args: any[]) => any>;
        scrollViewClass: PropType.Requireable<any>;
    };
    static defaultProps: {
        tabIndex: number;
        preserveScrollbars: boolean;
        readOnly: boolean;
        overscanRows: number;
        overscanColumns: number;
    };
    private _detached;
    private _blockContextMenu;
    private _onContextMenuListener;
    private _rt;
    private _scrollUpdateTrottled;
    private _ref;
    private _refView;
    private _scrollerStyle;
    private _lastView;
    private _lastOverscan;
    private _focused;
    private _kbCtr;
    private _msCtr;
    private _currentEdit;
    state: {
        scrollLeft: number;
        scrollTop: number;
        viewHeight: number;
        viewWidth: number;
        active: IGridAddress;
        edit: IGridAddress;
        selection: IGridSelection[];
        resizeHeaderPreview: {
            header: IHeader;
            change: number;
        };
        resizeLevelPreview: {
            header: IHeader;
            change: number;
        };
    };
    private _chromeFix;
    constructor(p: IGridProps, c: any);
    private readonly _theme;
    private readonly _columnCount;
    private readonly _rowCount;
    private readonly _headersHeight;
    private readonly _headersWidth;
    private readonly _selection;
    private readonly _active;
    private _onRef;
    private _onRefView;
    private _onBlur;
    private _onFocus;
    private _onRootMouseLeave;
    private _onKeyDown;
    private _onRootMouseEnter;
    private _onRootMouseDown;
    private _onScrollViewUpdate;
    private _ctrlGetState;
    private _ctrlGetActiveNotifier;
    private _ctrlGetSelectionNotifier;
    private _ctrlRightClick;
    private _ctrlCopy;
    private _ctrlPaste;
    private _ctrlNullify;
    private _ctrlRemove;
    private _ctrlSpace;
    private _ctrlIsReadOnly;
    private _ctrlIsNoEditor;
    private _ctrlIsCellReadOnly;
    private _ctrlOnReadOnlyFilter;
    private _onCellMouseDown;
    private _onCellTouchStart;
    private _onHeaderMouseDownHeader;
    private _onCornerMouseDown;
    private _onCellMouseEnter;
    private _onAutoMeasureApply;
    private _onAutoMeasure;
    private _onAfterUpdate;
    private _createView;
    private _createOverscan;
    private _prepareCellProps;
    private _renderCell;
    private _renderEditor;
    private _renderData;
    private _renderHeader;
    private _renderHeaders;
    private _renderResizing;
    private _isAddressOutOfBounds;
    private _getFilteredSelections;
    private _renderSelections;
    private _renderHeadersLayer;
    private _bodyRenderer;
    focus(): void;
    blur(): void;
    /** TODO: instead of using column index - use cell position and viewport minus scroll size */
    scrollTo: (cell: {
        column?: number;
        row?: number;
    }) => void;
    openEditor: (cell: IGridAddress) => void;
    closeEditor: (commit: boolean, callback?: () => void) => void;
    resizeHeaders(e: IGridResizeCombinedEvent): void;
    updateSelection: ({ active, selection }: IUpdateSelectionEvent, callback?: () => void) => void;
    autoMeasure(headers: IHeader[], type?: 'levels' | 'cells'): void;
    previewResizeHeader(resizeHeaderPreview: {
        header: IHeader;
        change: number;
    }): void;
    previewResizeLevel(resizeLevelPreview: {
        header: IHeader;
        change: number;
    }): void;
    componentDidMount(): void;
    componentDidUpdate(pp: IGridProps): void;
    componentWillUnmount(): void;
    render(): JSX.Element;
}
export default Grid;
