import { IHeader, HeaderType } from './types';
export interface IHeaderRepositoryCache {
    /** Set size to header. Note if header in $collapsed = true state. */
    getHeaderSize(header: IHeader, type: HeaderType): number;
    /** Get size assigned to header. Note if header in $collapsed = true state. */
    setHeaderSize(size: number, header: IHeader, type: HeaderType): void;
    /** Set header level size. */
    getLevelSize(level: number, type: 'top' | 'left'): number;
    /** Get header level size. */
    setLevelSize(size: number, level: number, type: 'top' | 'left'): void;
    /** Set total number of levels. */
    getLevels(type: 'top' | 'left'): number;
    /** Get total number of levels. */
    setLevels(levels: number, type: 'top' | 'left'): void;
    /** Set total size of all levels. */
    getOffset(type: 'top' | 'left'): number;
    /** Get total size of all levels. */
    setOffset(size: number, type: 'top' | 'left'): void;
    /** Get header autosize lock. If true - header will not be automatically expanded by cells content. */
    getHeaderLock(header: IHeader, type: HeaderType): boolean;
    /** Get header autosize lock. If true - header will not be automatically expanded by cells content. */
    setHeaderLock(locked: boolean, header: IHeader, type: HeaderType): void;
    /** Get level autosize lock. If true - level will not be automatically expanded by headers content. */
    getLevelLock(level: number, type: HeaderType): boolean;
    /** Set level autosize lock. If true - level will not be automatically expanded by headers content. */
    setLevelLock(locked: boolean, level: number, type: HeaderType): void;
}
export declare class HeaderRepositoryCache implements IHeaderRepositoryCache {
    protected _level: {
        top: {
            [i: string]: number;
        };
        left: {
            [i: string]: number;
        };
    };
    protected _levels: {
        left: number;
        top: number;
    };
    protected _offset: {
        left: number;
        top: number;
    };
    protected _levelLock: Set<string>;
    getHeaderSize(_header: IHeader, _type: HeaderType): number;
    setHeaderSize(_size: number, _header: IHeader, _type: HeaderType): void;
    getHeaderLock(_header: IHeader, _type: HeaderType): boolean;
    setHeaderLock(_locked: boolean, _header: IHeader, _type: HeaderType): void;
    getLevelSize(level: number, type: 'top' | 'left'): number;
    setLevelSize(size: number, level: number, type: 'top' | 'left'): void;
    getLevels(type: 'top' | 'left'): number;
    setLevels(levels: number, type: 'top' | 'left'): void;
    getOffset(type: 'top' | 'left'): number;
    setOffset(size: number, type: 'top' | 'left'): void;
    getLevelLock(level: number, type: HeaderType): boolean;
    setLevelLock(locked: boolean, level: number, type: HeaderType): void;
}
