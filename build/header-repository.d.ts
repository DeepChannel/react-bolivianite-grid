import { IHeader, HeaderType, HeaderResizeBehavior, HeaderFilter, HeaderClampFunction } from './types';
import { IHeaderRepositoryCache } from './header-repository-cache';
export interface IHeaderRepositoryProps {
    cache?: IHeaderRepositoryCache;
    rows: IHeader[];
    columns: IHeader[];
    columnWidth: number;
    rowHeight: number;
    headersHeight: number;
    headersWidth: number;
    filter?: HeaderFilter;
}
export interface IHeaderRepositoryState extends IHeaderRepositoryProps {
    viewColumns: IHeader[];
    viewRows: IHeader[];
    offsetWidth: number;
    offsetHeight: number;
    /** header's type */
    types: {
        [headerId: string]: HeaderType;
    };
    /** header's parent */
    parents: {
        [headerId: string]: IHeader;
    };
    /** header's position */
    positions: {
        [headerId: string]: number;
    };
    /** header's index */
    indices: {
        [headerId: string]: number;
    };
    /** header's level */
    levels: {
        [headerId: string]: number;
    };
    /** maximum levels */
    viewLeftLevels: number;
    viewTopLevels: number;
    /** level sizes */
    leftLevels: {
        [level: number]: number;
    };
    topLevels: {
        [level: number]: number;
    };
    /** header manual resized flag */
    headerManualResized: Set<string | number>;
    /** level manual resized flag */
    levelManualResized: Set<string | number>;
}
export declare class HeaderRepository {
    private _idCounter;
    private _state;
    private _idMap;
    constructor(props: IHeaderRepositoryProps);
    readonly columnWidth: number;
    readonly rowHeight: number;
    readonly headersHeight: number;
    readonly headersWidth: number;
    /** Total width of row headers. */
    readonly offsetWidth: number;
    /** Total height of column headers. */
    readonly offsetHeight: number;
    readonly topLevels: number;
    readonly leftLevels: number;
    readonly columns: IHeader[];
    readonly rows: IHeader[];
    toJSON(): {
        source: {
            rows: IHeader[];
            columns: IHeader[];
        };
        view: {
            rows: IHeader[];
            columns: IHeader[];
        };
        settings: {
            columnWidth: number;
            rowHeight: number;
            headersHeight: number;
            headersWidth: number;
            canvasHeight: number;
            canvasWidth: number;
            topLevels: number;
            leftLevels: number;
            filter: boolean;
        };
    };
    private _create;
    private _createClone;
    private _applyHeaderLevel;
    private _applyParentPosition;
    private _proceedHeaders;
    private _calcLevels;
    private _calcPosition;
    private _getLevelPosition;
    private _getLeaves;
    private _getAllNodesByChildren;
    private _getAllNodesByParents;
    private _getResizeList;
    private _getHeaderAddress;
    private _mapBranch;
    private _recalcHeaders;
    private _updateHeaders;
    getHeader(id: number | string): IHeader;
    getHeaderType(h: IHeader): HeaderType;
    getViewIndex(h: IHeader): number;
    getPosition(h: IHeader): number;
    getManualResized(h: IHeader): boolean;
    getManualResizedLevel(type: HeaderType, level: number): boolean;
    /** Header level in logic tree. Used for positioning. */
    getLevel(h: IHeader): number;
    /** Header level in canvas. Used for measuring. */
    getPositionLevel(h: IHeader): number;
    getParent(h: IHeader): IHeader;
    getTopLevelPosition(level: number): number;
    getLeftLevelPosition(level: number): number;
    getSize(h: IHeader): number;
    getLeftLevelWidth(level: number, isCollapsed?: boolean): number;
    getTopLevelHeight(level: number, isCollapsed?: boolean): number;
    getHeaderLeaves(h: IHeader): IHeader[];
    /** top-down search */
    getNodesTopDown(h: IHeader[]): IHeader[];
    /** bottom-up search */
    getNodesBottomUp(h: IHeader[]): IHeader[];
    getSource(): IHeaderRepositoryProps;
    /** Create clone of repository with new applied filter. */
    updateFilter(filter: HeaderFilter): HeaderRepository;
    /** Update provided headers. Returns new perository. */
    updateHeaders(updates: {
        header: IHeader;
        update: IHeader;
    }[]): HeaderRepository;
    /**
     * Resize all headers.
     * @param list Array of headers.
     * @param clamp Size clamp function.
     * @param behavior Defines flag when header was resized by autosize or manually.
     * Header will not be autosized when it was manually resized. Default `"manual"`.
     */
    resizeHeaders({ headers, clamp, behavior }: {
        headers: {
            header: IHeader;
            size: number;
        }[];
        clamp?: HeaderClampFunction;
        behavior?: HeaderResizeBehavior;
    }): HeaderRepository;
    /** Resize header levels, returns new repository. */
    resizeLevels({ levels, behavior }: {
        levels: {
            type: HeaderType;
            level: number;
            size: number;
            min?: number;
            max?: number;
        }[];
        behavior?: HeaderResizeBehavior;
    }): HeaderRepository;
    /** Update repository with new state properties. Returns new repository. */
    update(props: IHeaderRepositoryProps): HeaderRepository;
}
export default HeaderRepository;
