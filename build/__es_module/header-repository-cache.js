export class HeaderRepositoryCache {
    constructor() {
        this._level = {
            top: {},
            left: {}
        };
        this._levels = {
            left: 0,
            top: 0
        };
        this._offset = {
            left: 0,
            top: 0
        };
        this._levelLock = new Set();
    }
    getHeaderSize(_header, _type) {
        throw new Error('HeaderRepositoryCache.getSize is not implemented.');
    }
    setHeaderSize(_size, _header, _type) {
        throw new Error('HeaderRepositoryCache.setSize is not implemented.');
    }
    getHeaderLock(_header, _type) {
        throw new Error('HeaderRepositoryCache.getHeaderLock is not implemented.');
    }
    setHeaderLock(_locked, _header, _type) {
        throw new Error('HeaderRepositoryCache.setHeaderLock is not implemented.');
    }
    getLevelSize(level, type) {
        return this._level[type][level] || 0;
    }
    setLevelSize(size, level, type) {
        this._level[type][level] = size;
    }
    getLevels(type) {
        return this._levels[type] || 0;
    }
    setLevels(levels, type) {
        this._levels[type] = levels;
    }
    getOffset(type) {
        return this._offset[type] || 0;
    }
    setOffset(size, type) {
        this._offset[type] = size;
    }
    getLevelLock(level, type) {
        return this._levelLock.has(`${type}:${level}`);
    }
    setLevelLock(locked, level, type) {
        this._levelLock[locked ? 'add' : 'delete'](`${type}:${level}`);
    }
}

//# sourceMappingURL=header-repository-cache.js.map
