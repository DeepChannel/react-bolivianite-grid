"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
var HeaderRepository = /** @class */ (function () {
    function HeaderRepository(props) {
        this._idCounter = 0;
        this._idMap = {};
        if (!props) {
            return;
        }
        this._state = __assign({}, props, { offsetWidth: 0, offsetHeight: 0, viewColumns: null, viewRows: null, viewLeftLevels: 0, viewTopLevels: 0, leftLevels: {}, topLevels: {}, types: {}, indices: {}, positions: {}, levels: {}, parents: {}, headerManualResized: new Set(), levelManualResized: new Set() });
        this._state.viewColumns = this._create(props.columns, [], types_1.HeaderType.Column, props.filter);
        this._state.viewRows = this._create(props.rows, [], types_1.HeaderType.Row, props.filter);
        this._calcPosition();
        this._calcLevels();
    }
    Object.defineProperty(HeaderRepository.prototype, "columnWidth", {
        get: function () {
            return this._state.columnWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "rowHeight", {
        get: function () {
            return this._state.rowHeight;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "headersHeight", {
        get: function () {
            return this._state.headersHeight;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "headersWidth", {
        get: function () {
            return this._state.headersWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "offsetWidth", {
        /** Total width of row headers. */
        get: function () {
            return (this._state.cache
                ? this._state.cache.getOffset('left')
                : this._state.offsetWidth);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "offsetHeight", {
        /** Total height of column headers. */
        get: function () {
            return (this._state.cache
                ? this._state.cache.getOffset('top')
                : this._state.offsetHeight);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "topLevels", {
        get: function () {
            return (this._state.cache
                ? this._state.cache.getLevels('top')
                : this._state.viewTopLevels);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "leftLevels", {
        get: function () {
            return (this._state.cache
                ? this._state.cache.getLevels('left')
                : this._state.viewLeftLevels);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "columns", {
        get: function () {
            return this._state.viewColumns;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HeaderRepository.prototype, "rows", {
        get: function () {
            return this._state.viewRows;
        },
        enumerable: true,
        configurable: true
    });
    HeaderRepository.prototype.toJSON = function () {
        return {
            source: {
                rows: this._state.rows,
                columns: this._state.columns,
            },
            view: {
                rows: this.rows,
                columns: this.columns,
            },
            settings: {
                columnWidth: this.columnWidth,
                rowHeight: this.rowHeight,
                headersHeight: this.headersHeight,
                headersWidth: this.headersWidth,
                canvasHeight: this.offsetHeight,
                canvasWidth: this.offsetWidth,
                topLevels: this.topLevels,
                leftLevels: this.leftLevels,
                filter: !!this._state.filter
            }
        };
    };
    HeaderRepository.prototype._create = function (list, out, type, filter, assignParent) {
        var _this = this;
        list.forEach(function (h) {
            h.$id = h.$id || ++_this._idCounter;
            _this._state.positions[h.$id] = 0;
            if (assignParent) {
                _this._state.parents[h.$id] = assignParent;
            }
            if (filter && !filter({ header: h, type: type })) {
                return;
            }
            if (!h.$collapsed && h.$children && h.$children.length) {
                _this._create(h.$children, out, type, filter, h);
                return;
            }
            out.push(h);
        });
        return out;
    };
    HeaderRepository.prototype._createClone = function () {
        var c = new HeaderRepository(null);
        c._state = __assign({}, this._state, { leftLevels: __assign({}, this._state.leftLevels), topLevels: __assign({}, this._state.topLevels), types: __assign({}, this._state.types), indices: __assign({}, this._state.indices), positions: __assign({}, this._state.positions), levels: __assign({}, this._state.levels), parents: __assign({}, this._state.parents), headerManualResized: new Set(this._state.headerManualResized), levelManualResized: new Set(this._state.levelManualResized) });
        return c;
    };
    HeaderRepository.prototype._applyHeaderLevel = function (h) {
        var level = 0;
        var seek = h;
        while (this._state.parents[seek.$id]) {
            level++;
            seek = this._state.parents[seek.$id];
        }
        this._state.levels[h.$id] = level;
        if (this._state.parents[h.$id]) {
            this._applyHeaderLevel(this._state.parents[h.$id]);
        }
        return level;
    };
    HeaderRepository.prototype._applyParentPosition = function (list, type) {
        var _this = this;
        var lock = new Set();
        var parents = [];
        list.forEach(function (h) {
            _this._idMap[h.$id] = h;
            _this._state.types[h.$id] = type;
            var first = h.$children[0];
            var last = h.$children[h.$children.length - 1];
            _this._state.positions[h.$id] = _this._state.positions[first.$id];
            h.$size = _this._state.positions[last.$id] + _this.getSize(last) - _this._state.positions[first.$id];
            if (_this._state.cache) {
                _this._state.cache.setHeaderSize(h.$size, h, type);
            }
            var parent = _this._state.parents[h.$id];
            if (parent && !lock.has(parent.$id)) {
                lock.add(parent.$id);
                parents.push(parent);
            }
        });
        if (parents.length) {
            this._applyParentPosition(parents, type);
        }
    };
    HeaderRepository.prototype._proceedHeaders = function (list, from, size, type) {
        var len = list.length;
        if (!len) {
            return 0;
        }
        var cursor = this._state.positions[list[from].$id];
        var levels = 0;
        var lock = new Set();
        var parents = [];
        for (var i = from; i < len; i++) {
            var h = list[i];
            this._state.indices[h.$id] = (!h.$collapsed && h.$children && h.$children[0]) ? -1 : i;
            this._state.positions[h.$id] = cursor;
            this._state.types[h.$id] = type;
            this._idMap[h.$id] = h;
            for (var _i = 0, _a = ['$size', '$sizeCollapsed']; _i < _a.length; _i++) {
                var p = _a[_i];
                if (!h[p]) {
                    if (this._state.cache) {
                        var _h = __assign({}, h, { $collapsed: p === '$sizeCollapsed' });
                        var cachedSize = this._state.cache.getHeaderSize(_h, type);
                        h[p] = cachedSize || size;
                        if (!cachedSize) {
                            this._state.cache.setHeaderSize(h[p], _h, type);
                        }
                    }
                    else {
                        h[p] = size;
                    }
                }
            }
            cursor += this.getSize(h);
            var l = this._applyHeaderLevel(h);
            if (l > levels) {
                levels = l;
            }
            var parent_1 = this._state.parents[h.$id];
            if (parent_1 && !lock.has(parent_1.$id)) {
                lock.add(parent_1.$id);
                parents.push(parent_1);
            }
        }
        if (parents.length) {
            this._applyParentPosition(parents, type);
        }
        return levels + 1;
    };
    HeaderRepository.prototype._calcLevels = function () {
        var w = 0, h = 0;
        for (var i = 0; i < this.leftLevels; i++) {
            w += this.getLeftLevelWidth(i);
        }
        for (var i = 0; i < this.topLevels; i++) {
            h += this.getTopLevelHeight(i);
        }
        this._state.offsetWidth = w || this._state.headersWidth;
        this._state.offsetHeight = h || this._state.headersHeight;
        if (this._state.cache) {
            this._state.cache.setOffset(this._state.offsetWidth, 'left');
            this._state.cache.setOffset(this._state.offsetHeight, 'top');
        }
    };
    HeaderRepository.prototype._calcPosition = function (from) {
        if (from === void 0) { from = 0; }
        this._state.viewTopLevels = this._proceedHeaders(this._state.viewColumns, from, this._state.columnWidth, types_1.HeaderType.Column);
        this._state.viewLeftLevels = this._proceedHeaders(this._state.viewRows, from, this._state.rowHeight, types_1.HeaderType.Row);
        if (this._state.cache) {
            this._state.cache.setLevels(this._state.viewLeftLevels, 'left');
            this._state.cache.setLevels(this._state.viewTopLevels, 'top');
        }
    };
    HeaderRepository.prototype._getLevelPosition = function (type, level) {
        if (level >= (type === 'left' ? this.leftLevels : this.topLevels)) {
            return 0;
        }
        var p = 0;
        for (var i = 0; i < level; i++) {
            p += (type === 'left' ? this.getLeftLevelWidth(i) : this.getTopLevelHeight(i));
        }
        return p;
    };
    HeaderRepository.prototype._getLeaves = function (h, out) {
        var _this = this;
        if (out === void 0) { out = []; }
        if (h.$collapsed || !h.$children || !h.$children.length) {
            out.push(h);
            return out;
        }
        h.$children.forEach(function (c) { return _this._getLeaves(c, out); });
        return out;
    };
    HeaderRepository.prototype._getAllNodesByChildren = function (headers, lock, out) {
        var _this = this;
        if (lock === void 0) { lock = new Set(); }
        if (out === void 0) { out = []; }
        headers.forEach(function (h) {
            if (!h) {
                return;
            }
            if (!lock.has(h.$id)) {
                out.push(h);
                lock.add(h.$id);
            }
            if (h.$children && h.$children.length) {
                _this._getAllNodesByChildren(h.$children, lock, out);
            }
        });
        return out;
    };
    HeaderRepository.prototype._getAllNodesByParents = function (headers, lock, out) {
        var _this = this;
        if (lock === void 0) { lock = new Set(); }
        if (out === void 0) { out = []; }
        var seek = function (h) {
            if (!h) {
                return;
            }
            if (!lock.has(h.$id)) {
                out.push(h);
                lock.add(h.$id);
            }
            seek(_this.getParent(h));
        };
        headers.forEach(function (h) {
            seek(h);
        });
        return out;
    };
    HeaderRepository.prototype._getResizeList = function (h, size, clamp) {
        var _this = this;
        if (h.$collapsed || !h.$children || !h.$children.length) {
            size = clamp({
                header: h,
                type: this._state.types[h.$id],
                size: size
            });
        }
        var prevSize = this.getSize(h);
        if (h.$collapsed || !h.$children || !h.$children.length) {
            return [{
                    header: h,
                    size: size
                }];
        }
        var leaves = this.getHeaderLeaves(h);
        var d = 0;
        if (clamp) {
            leaves.forEach(function (c) {
                var n = Math.floor(_this.getSize(c) * size / prevSize);
                var m = clamp({
                    header: h,
                    type: _this._state.types[h.$id],
                    size: n - d
                });
                if (n < m) {
                    d += m - n;
                }
            });
        }
        return leaves.map(function (c) {
            return {
                header: c,
                size: clamp({
                    header: c,
                    type: _this._state.types[c.id],
                    size: Math.floor(_this.getSize(c) * size / prevSize) - d
                })
            };
        });
    };
    HeaderRepository.prototype._getHeaderAddress = function (h, root) {
        var ix = [];
        var seek = h;
        while (seek) {
            var p = this.getParent(seek);
            var list = p ? p.$children : root;
            var index = list.findIndex(function (c) { return c.$id === seek.$id; });
            ix.push(index);
            seek = p;
        }
        ix.push(-1); // -1 means root
        return ix.reverse();
    };
    HeaderRepository.prototype._mapBranch = function (address, list, map) {
        var _this = this;
        if (!list) {
            return list;
        }
        var len = address.length;
        var output = list.map(function (h) {
            if (!len) {
                return map(h);
            }
            return __assign({}, h, { $children: _this._mapBranch(address.slice(1), h.$children, map) });
        });
        return output;
    };
    HeaderRepository.prototype._recalcHeaders = function () {
        this._state.viewColumns = null;
        this._state.viewRows = null;
        this._state.types = {};
        this._state.indices = {};
        this._state.positions = {};
        this._state.levels = {};
        this._state.parents = {};
        this._state.viewColumns = this._create(this._state.columns, [], types_1.HeaderType.Column, this._state.filter);
        this._state.viewRows = this._create(this._state.rows, [], types_1.HeaderType.Row, this._state.filter);
        this._calcPosition();
        this._calcLevels();
        return this;
    };
    HeaderRepository.prototype._updateHeaders = function (branchMap, sourceList) {
        var _this = this;
        var branchList = Object.keys(branchMap);
        if (!branchList.length) {
            return sourceList;
        }
        branchList.forEach(function (branch) {
            var address = branch.split('/').filter(function (v) { return !!v; }).map(Number);
            var updateMap = branchMap[branch];
            // removing first -1 element, that represents root
            address.shift();
            sourceList = _this._mapBranch(address, sourceList, function (h) {
                var update = updateMap[h.$id];
                if (!update) {
                    return h;
                }
                var next = __assign({}, h);
                Object.keys(update).forEach(function (key) {
                    if (key === '$id') {
                        return;
                    }
                    next[key] = update[key];
                });
                return next;
            });
        });
        return sourceList;
    };
    HeaderRepository.prototype.getHeader = function (id) {
        return this._idMap[id];
    };
    HeaderRepository.prototype.getHeaderType = function (h) {
        return this._state.types[h.$id];
    };
    HeaderRepository.prototype.getViewIndex = function (h) {
        return this._state.indices[h.$id];
    };
    HeaderRepository.prototype.getPosition = function (h) {
        return this._state.positions[h.$id];
    };
    HeaderRepository.prototype.getManualResized = function (h) {
        return (this._state.cache
            ? this._state.cache.getHeaderLock(h, this._state.types[h.$id])
            : this._state.headerManualResized.has(h.$id));
    };
    HeaderRepository.prototype.getManualResizedLevel = function (type, level) {
        return (this._state.cache
            ? this._state.cache.getLevelLock(level, type)
            : this._state.levelManualResized.has(type + ":" + level));
    };
    /** Header level in logic tree. Used for positioning. */
    HeaderRepository.prototype.getLevel = function (h) {
        return this._state.levels[h.$id];
    };
    /** Header level in canvas. Used for measuring. */
    HeaderRepository.prototype.getPositionLevel = function (h) {
        var level = this.getLevel(h);
        var maxLevel = (this._state.types[h.$id] === types_1.HeaderType.Column ? this.topLevels : this.leftLevels) - 1;
        var hasChildren = h.$children && h.$children.length;
        return level < maxLevel && (h.$collapsed || !hasChildren) ? maxLevel : level;
    };
    HeaderRepository.prototype.getParent = function (h) {
        return this._state.parents[h.$id];
    };
    HeaderRepository.prototype.getTopLevelPosition = function (level) {
        return this._getLevelPosition('top', level);
    };
    HeaderRepository.prototype.getLeftLevelPosition = function (level) {
        return this._getLevelPosition('left', level);
    };
    HeaderRepository.prototype.getSize = function (h) {
        if (!h) {
            return 0;
        }
        if (this._state.cache) {
            return this._state.cache.getHeaderSize(h, this._state.types[h.$id]);
        }
        return h.$collapsed ? h.$sizeCollapsed : h.$size;
    };
    HeaderRepository.prototype.getLeftLevelWidth = function (level, isCollapsed) {
        if (isCollapsed) {
            return this.offsetWidth - this.getLeftLevelPosition(level);
        }
        var v = (this._state.cache
            ? this._state.cache.getLevelSize(level, 'left')
            : this._state.leftLevels[level]);
        return v || this._state.headersWidth;
    };
    HeaderRepository.prototype.getTopLevelHeight = function (level, isCollapsed) {
        if (isCollapsed) {
            return this.offsetHeight - this.getTopLevelPosition(level);
        }
        var v = (this._state.cache
            ? this._state.cache.getLevelSize(level, 'top')
            : this._state.topLevels[level]);
        return v || this._state.headersHeight;
    };
    HeaderRepository.prototype.getHeaderLeaves = function (h) {
        return this._getLeaves(h);
    };
    /** top-down search */
    HeaderRepository.prototype.getNodesTopDown = function (h) {
        return this._getAllNodesByChildren(h);
    };
    /** bottom-up search */
    HeaderRepository.prototype.getNodesBottomUp = function (h) {
        return this._getAllNodesByParents(h);
    };
    HeaderRepository.prototype.getSource = function () {
        return {
            cache: this._state.cache,
            columns: this._state.columns,
            rows: this._state.rows,
            columnWidth: this._state.columnWidth,
            rowHeight: this._state.rowHeight,
            headersHeight: this._state.headersHeight,
            headersWidth: this._state.headersWidth,
            filter: this._state.filter
        };
    };
    /** Create clone of repository with new applied filter. */
    HeaderRepository.prototype.updateFilter = function (filter) {
        if (this._state.filter === filter) {
            return this;
        }
        var next = this._createClone();
        next._state.filter = filter;
        return next._recalcHeaders();
    };
    /** Update provided headers. Returns new perository. */
    HeaderRepository.prototype.updateHeaders = function (updates) {
        var _this = this;
        var mapColumns = {};
        var mapRows = {};
        updates.forEach(function (_a) {
            var header = _a.header, update = _a.update;
            var headerType = _this._state.types[header.$id];
            var address = _this._getHeaderAddress(header, headerType === types_1.HeaderType.Row ? _this._state.rows : _this._state.columns);
            var map = headerType === types_1.HeaderType.Column ? mapColumns : mapRows;
            var branchName = address.slice(0, address.length - 1).join('/');
            if (!map[branchName]) {
                map[branchName] = {};
            }
            map[branchName][header.$id] = update;
        });
        var next = this._createClone();
        next._state.columns = this._updateHeaders(mapColumns, next._state.columns);
        next._state.rows = this._updateHeaders(mapRows, next._state.rows);
        next = next._recalcHeaders();
        return next;
    };
    /**
     * Resize all headers.
     * @param list Array of headers.
     * @param clamp Size clamp function.
     * @param behavior Defines flag when header was resized by autosize or manually.
     * Header will not be autosized when it was manually resized. Default `"manual"`.
     */
    HeaderRepository.prototype.resizeHeaders = function (_a) {
        var _this = this;
        var headers = _a.headers, clamp = _a.clamp, behavior = _a.behavior;
        if (!headers || !headers.length) {
            return this;
        }
        clamp = clamp || (function (_a) {
            var size = _a.size;
            return size;
        });
        behavior = behavior || 'manual';
        var updates = [];
        var leaves = [];
        headers.forEach(function (u) {
            var resizeList = _this._getResizeList(u.header, u.size, clamp);
            resizeList.forEach(function (_a) {
                var header = _a.header, size = _a.size;
                leaves.push(header);
                updates.push({
                    header: header,
                    update: (header.$collapsed
                        ? { $sizeCollapsed: size }
                        : { $size: size })
                });
                if (_this._state.cache) {
                    _this._state.cache.setHeaderSize(size, header, _this._state.types[header.$id]);
                }
            });
        });
        var c = this.updateHeaders(updates);
        switch (behavior) {
            case 'manual':
            case 'reset':
                var isManual_1 = behavior === 'manual';
                leaves.forEach(function (header) {
                    if (isManual_1) {
                        c._state.headerManualResized.add(header.$id);
                        if (c._state.cache) {
                            c._state.cache.setHeaderLock(true, header, _this._state.types[header.$id]);
                        }
                    }
                    else {
                        c._state.headerManualResized.delete(header.$id);
                        if (c._state.cache) {
                            c._state.cache.setHeaderLock(false, header, _this._state.types[header.$id]);
                        }
                    }
                });
        }
        return c;
    };
    /** Resize header levels, returns new repository. */
    HeaderRepository.prototype.resizeLevels = function (_a) {
        var levels = _a.levels, behavior = _a.behavior;
        behavior = behavior || 'manual';
        var next = this._createClone();
        for (var _i = 0, levels_1 = levels; _i < levels_1.length; _i++) {
            var _b = levels_1[_i], level = _b.level, type = _b.type, size = _b.size, max = _b.max, min = _b.min;
            min = min == null ? 5 : min;
            max = max == null ? Infinity : max;
            var levelSize = Math.min(Math.max(min, size), max);
            if (type === types_1.HeaderType.Column) {
                if (next._state.cache) {
                    next._state.cache.setLevelSize(levelSize, level, 'top');
                }
                next._state.topLevels[level] = levelSize;
            }
            else {
                if (next._state.cache) {
                    next._state.cache.setLevelSize(levelSize, level, 'left');
                }
                next._state.leftLevels[level] = levelSize;
            }
            switch (behavior) {
                case 'manual':
                case 'reset':
                    var isManual = behavior === 'manual';
                    var key = type + ":" + level;
                    if (isManual) {
                        next._state.levelManualResized.add(key);
                        if (next._state.cache) {
                            next._state.cache.setLevelLock(true, level, type);
                        }
                    }
                    else {
                        next._state.levelManualResized.delete(key);
                        if (next._state.cache) {
                            next._state.cache.setLevelLock(false, level, type);
                        }
                    }
            }
        }
        return next._recalcHeaders();
    };
    /** Update repository with new state properties. Returns new repository. */
    HeaderRepository.prototype.update = function (props) {
        var next = this._createClone();
        next._state = __assign({}, next._state, props);
        return next._recalcHeaders();
    };
    return HeaderRepository;
}());
exports.HeaderRepository = HeaderRepository;
exports.default = HeaderRepository;

//# sourceMappingURL=header-repository.js.map
