Utils.extend(KityMinder, {
    _protocols: {},
    registerProtocol: function(name, protocolDeal) {
        KityMinder._protocols[name] = protocolDeal;
    }
});

var DEFAULT_TEXT = {
    'root': 'maintopic',
    'main': 'topic',
    'sub': 'topic'
};

Minder.registerInit(function() {
    this._initProtocols();
});

// 导入导出
kity.extendClass(Minder, {

    _initProtocols: function(options) {
        var protocols = this._protocols = {};
        var pool = KityMinder._protocols;
        for (var name in pool) {
            if (pool.hasOwnProperty(name))
                protocols[name] = pool[name](this);
                protocols[name].name = name;
        }
    },

    getProtocol: function(name) {
        return this._protocols[name] || null;
    },

    getSupportedProtocols: function() {
        var protocols = this._protocols;
        return Utils.keys(protocols).map(function(name) {
            return protocols[name];
        });
    },

    exportJson: function() {
        /* 导出 node 上整棵树的数据为 JSON */
        function exportNode(node) {
            var exported = {};
            exported.data = node.getData();
            var childNodes = node.getChildren();
            if (childNodes.length) {
                exported.children = [];
                for (var i = 0; i < childNodes.length; i++) {
                    exported.children.push(exportNode(childNodes[i]));
                }
            }
            return exported;
        }

        var json = exportNode(this.getRoot());

        json.template = this.getTemplate();
        json.theme = this.getTheme();
        json.version = KityMinder.version;

        return json;
    },

    importJson: function(json, params) {

        function importNode(node, json, km) {
            var data = json.data;
            node.data = {};
            for (var field in data) {
                node.setData(field, data[field]);
            }

            node.setData('text', data.text || km.getLang(DEFAULT_TEXT[node.getType()]));

            var childrenTreeData = json.children || [];
            for (var i = 0; i < childrenTreeData.length; i++) {
                var childNode = km.createNode(null, node);
                importNode(childNode, childrenTreeData[i], km);
            }
            return node;
        }

        if (!json) return;
        
        this._fire(new MinderEvent('preimport', params, false));

        // 删除当前所有节点
        while (this._root.getChildren().length) {
            this.removeNode(this._root.getChildren()[0]);
        }

        json = KityMinder.compatibility(json);

        importNode(this._root, json, this);

        this.setTemplate(json.template || 'default');
        this.setTheme(json.theme || null);
        this.refresh();

        this.fire('import', params);

        this._firePharse({
            type: 'contentchange'
        });
        this._interactChange();
    },
    lazyImportJson: function(json, params) {

        function importNode(node, data, km) {
            node.data = {};
            for (var field in data) {
                node.setData(field, data[field]);
            }
            node.setData('text', data.name || km.getLang(DEFAULT_TEXT[node.getType()]));
            return node;
        }
        if (!json) return;
        this._fire(new MinderEvent('preimport', params, false));
        // 删除当前所有节点
        while (this._root.getChildren().length) {
            this.removeNode(this._root.getChildren()[0]);
        }

        json = KityMinder.compatibility(json);

        importNode(this._root, json.data, this);

        this.setTemplate(json.template || 'default');
        this.setTheme(json.theme || null);
        this.refresh();

        this.fire('import', params);

        this._firePharse({
            type: 'contentchange'
        });
        this._interactChange();
        //
        var _lazy_load_click = function (event){
                    // 获取当前节点
                    var _minderNode = event.getTargetNode();
                    // 判断事件触发源是否是节点
                    if (_minderNode && _minderNode instanceof MinderNode) {
                        // 获取子节点数据
                        var _children = _minderNode.getData("children");
                        // 获取 判断标志为
                        var _isLoad = _minderNode.getData("isLoad");
                        // 判断该节点是否已载入，判断此节点是否有子节点
                        if (!_isLoad && _children && _children.length > 0){
                            for (var i = 0; i < _children.length; i++ ){
                                var  e = _children[i];
                                // 创建子节点
                                var childNode = km.createNode(null, _minderNode);
                                //
                                childNode.data = {};
                                // 设置自节点属性
                                for (var field in e) {
                                    childNode.setData(field, e[field]);
                                }
                                childNode.setData('text', e.name || km.getLang(DEFAULT_TEXT[childNode.getType()]));
                            }
                            _minderNode.collapse();
                        }
                        // 设置展开标志位
                        _minderNode.setData('isLoad',true);
                        //
                        _minderNode.setData('children',null);
                        //
                        // 判断节点是否展开，如果未展开，则自动展开节点
                        if (_minderNode.isCollapsed()){
                            _minderNode.expand();
                        }else{
                        		_minderNode.collapse();
                        }
                        // 刷新脑图
                        this.refresh(500);
                        //this.fire('contentchange');
                        // 元素居中
                        this.execCommand('camera', _minderNode);
                    }
                };   
        this.off('click touch',_lazy_load_click);
        this.on('click touch',_lazy_load_click);
    },

    exportData: function(protocolName, options) {

        var json, protocol;

        json = this.exportJson();

        // 指定了协议进行导出，需要检测协议是否支持
        if (protocolName) {
            protocol = this.getProtocol(protocolName);

            if (!protocol || !protocol.encode) {
                return Promise.reject(new Error('Not supported protocol:' + protocolName));
            }
        }

        // 导出前抛个事件
        this._fire(new MinderEvent('beforeexport', {
            json: json,
            protocolName: protocolName,
            protocol: protocol
        }));


        if (protocol) {
            return Promise.resolve(protocol.encode(json, this, options));
        } else {
            return Promise.resolve(json);
        }
    },

    importData: function(local, protocolName) {

        var json, protocol;
        var minder = this;

        // 指定了协议进行导入，需要检测协议是否支持
        if (protocolName) {
            protocol = this.getProtocol(protocolName);

            if (!protocol || !protocol.decode) {
                return Promise.reject(new Error('Not supported protocol:' + protocolName));
            }
        }

        var params = {
            local: local,
            protocolName: protocolName,
            protocol: protocol
        };

        // 导入前抛事件
        this._fire(new MinderEvent('beforeimport', params));

        return new Promise(function(resolve, reject) {

            resolve(protocol ? protocol.decode(local) : local);

        }).then(function(json) {

            minder.importJson(json, params);

            return json;

        });

    }
});