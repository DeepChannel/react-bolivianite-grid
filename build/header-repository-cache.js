"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HeaderRepositoryCache = /** @class */ (function () {
    function HeaderRepositoryCache() {
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
    HeaderRepositoryCache.prototype.getHeaderSize = function (_header, _type) {
        throw new Error('HeaderRepositoryCache.getSize is not implemented.');
    };
    HeaderRepositoryCache.prototype.setHeaderSize = function (_size, _header, _type) {
        throw new Error('HeaderRepositoryCache.setSize is not implemented.');
    };
    HeaderRepositoryCache.prototype.getHeaderLock = function (_header, _type) {
        throw new Error('HeaderRepositoryCache.getHeaderLock is not implemented.');
    };
    HeaderRepositoryCache.prototype.setHeaderLock = function (_locked, _header, _type) {
        throw new Error('HeaderRepositoryCache.setHeaderLock is not implemented.');
    };
    HeaderRepositoryCache.prototype.getLevelSize = function (level, type) {
        return this._level[type][level] || 0;
    };
    HeaderRepositoryCache.prototype.setLevelSize = function (size, level, type) {
        this._level[type][level] = size;
    };
    HeaderRepositoryCache.prototype.getLevels = function (type) {
        return this._levels[type] || 0;
    };
    HeaderRepositoryCache.prototype.setLevels = function (levels, type) {
        this._levels[type] = levels;
    };
    HeaderRepositoryCache.prototype.getOffset = function (type) {
        return this._offset[type] || 0;
    };
    HeaderRepositoryCache.prototype.setOffset = function (size, type) {
        this._offset[type] = size;
    };
    HeaderRepositoryCache.prototype.getLevelLock = function (level, type) {
        return this._levelLock.has(type + ":" + level);
    };
    HeaderRepositoryCache.prototype.setLevelLock = function (locked, level, type) {
        this._levelLock[locked ? 'add' : 'delete'](type + ":" + level);
    };
    return HeaderRepositoryCache;
}());
exports.HeaderRepositoryCache = HeaderRepositoryCache;

//# sourceMappingURL=header-repository-cache.js.map
