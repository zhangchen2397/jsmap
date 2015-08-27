'use strict';

var fs = require('fs'),
    events = require('events');

var beautify = require('js-beautify'),
    path = require('./path'),
    watch = require('watch');

var gd = function(config) {

    this.defaultConf = {
        basePath: './',
        frontendPath: '../frontend/mods/',
        buildConfPath: './build.conf',
        mtConfigPath: './index.jsp',
        charset: 'utf-8',
        isWatch: ''
    };

    //合并配置文件
    this.config = this.extend(this.defaultConf, config || {});

    this.envJsMap = {};
    this.onlineJsMap = {};
    this.dependencyMap = {};

    //初始化事件系统
    events.EventEmitter.call(this);

    //初始化转化组件
    this.init.call(this);
};

gd.prototype = {
    __proto__: events.EventEmitter.prototype,

    init: function() {
        if (this.config.isWatch == '-w') {
            this._initEvent();
        }
        
        this.gd();
    },

    gd: function() {
        var time = (new Date).toLocaleTimeString();

        this.envJsMap = {};
        this.onlineJsMap = {};
        this.dependencyMap = {};

        this._readFiles();
        this._writeDependencyMap();

        this._checkBuildConfExist();
        this._setJsMap();
        this._writeJsMap();

        console.log( time + ' generate dependency success!' );
        console.log( '-------------------------------------' );
    },

    _initEvent: function() {
        var me = this,
            config = this.config,
            watchTimer = null;

        watch.watchTree(config.basePath, function(f, curr, prev) {
            if (watchTimer) {
                clearTimeout(watchTimer);
            }

            watchTimer = setTimeout(function() {
                if (typeof f == "object" && prev === null && curr === null) {
                    //全部遍历完
                    //console.log( 'no change' );
                } else if (prev === null) {
                    //新增文件或文件夹
                    if (me.filter(f)) {
                        console.log('add new file: ' + path.basename(f));
                        me.gd();
                    }
                } else if (curr.nlink === 0) {
                    //删除文件或文件夹
                    if (me.filterExtname(path.extname(f))) {
                        console.log('delete file: ' + path.basename(f));
                        fs.existsSync(f) && fs.unlinkSync(f);
                        me.gd();
                    }
                } else {
                    //更新文件
                    var fileName = path.basename(f);
                    if (/\.js$/.test(fileName)) {
                        console.log('update file: ' + fileName);
                        me.gd();
                    }
                }
            }, 1000);
        });
    },

    _readFiles: function() {
        var me = this,
            config = this.config;

        var walk = function(dir) {
            var dirList = fs.readdirSync(dir);

            dirList.forEach(function(item) {
                if (fs.statSync(path.join(dir, item)).isDirectory()) {
                    walk(path.join(dir, item));
                } else if (me.filterBasename(item) && me.filterExtname(item)) {
                    me._findJsMap(path.join(dir, item));
                }
            });
        };

        walk(config.basePath + 'js');
    },

    _findJsMap: function(file) {
        var me = this,
            config = this.config;

        var path = file;
        var code = fs.readFileSync(file, this.config.charset);
        var regStr = /define\(\s*['|"]([\s\S]+?)['|"],\s*\[\s*([\s\S]*?)\s*\]/;
        var rst = code.match(regStr);

        if (!rst) {
            return;
        }

        var id = rst[1],
            deps = [];

        if (rst[2]) {
            deps = (rst[2].replace(/['|"]/g, '')).split(/,\s*/)
        }

        if (id.indexOf('m_') > -1) {
            path = id;
        }

        if (!this.dependencyMap[id]) {
            this.dependencyMap[id] = {
                "path": path,
                "deps": deps
            }

            if (deps.length > 0) {
                for (var i = 0; i < deps.length; i++) {
                    var item = deps[i];
                    if (item.indexOf('m_') > -1) {
                        var fileName = item.replace('m_', '');
                        var path = config.frontendPath + fileName + '/' + fileName + '.js';
                        if (fs.existsSync(path)) {
                            me._findJsMap(path);
                        }
                    }
                }
            }
        }
    },

    _writeDependencyMap: function() {
        var me = this,
            config = this.config,
            dependencyMap = beautify(JSON.stringify(this.dependencyMap));

        fs.writeFileSync(config.basePath + './dependency.json', dependencyMap, {
            encoding: config.charset
        });
    },

    _checkBuildConfExist: function() {
        var me = this,
            config = this.config;

        //if (!fs.existsSync(config.buildConfPath)) {
            this._writeBuildConf();
        //}
    },

    _writeBuildConf: function() {
        var me = this,
            config = this.config,
            tempArr = [];

        for (var key in this.dependencyMap) {
            if (this.dependencyMap.hasOwnProperty(key)) {
                var item = this.dependencyMap[key],
                    path = key;

                if (item.path.indexOf('\/pages\/') > -1) {
                    continue;
                }

                if (key.indexOf('m_') < 0) {
                    path = item.path;
                }

                tempArr.push("'" + path + "'");
            }
        }

        var buildConfStr = "{" +
            "'./release/{v}/base-{v}.js': {" +
                "'files': [\n" + tempArr.join(',\n') + "]," +
                "'fvName': 'base.js'" +
            "}," +
            "'pages': {" +
                "'dir': './js/pages'," +
                "'releaseDir': './release/{pv}/pages/'" +
            "}" +
        "}";

        fs.writeFileSync(config.buildConfPath, beautify(buildConfStr).replace(/\s\/\s/g, '/'), {
            encoding: config.charset
        });
    },

    _writeJsMap: function() {
        var me = this,
            config = this.config,
            envJsMap = this.envJsMap,
            onlineJsMap = this.onlineJsMap;

        var configFile = fs.readFileSync(config.mtConfigPath, {
            encoding: config.charset
        });

        var onlineJsmapReg = /(\/\/onlineJsmapStart)[\s\S]+?(\/\/onlineJsmapEnd)/g,
            envJsmapReg = /(\/\/envJsmapStart)[\s\S]+?(\/\/envJsmapEnd)/g;

        envJsMap = 'jsmap:' + JSON.stringify(envJsMap);
        onlineJsMap = 'jsmap:' + JSON.stringify(onlineJsMap);

        var newStr = configFile.replace(onlineJsmapReg,
            beautify('$1\n' + onlineJsMap + ',\n$2')
        );

        newStr = newStr.replace(envJsmapReg,
            beautify('$1\n' + envJsMap + ',\n$2')
        );

        fs.writeFileSync(config.mtConfigPath, newStr, {
            encoding: config.charset
        });
    },

    _setJsMap: function() {
        var me = this,
            config = this.config;

        var conf = fs.readFileSync(config.buildConfPath, {
            encoding: config.charset
        });

        conf = new Function('return (' + conf + ')')();

        for (var key in conf) {
            var item = conf[key];

            //针对pages文件夹下的模块
            if (key == 'pages') {

                //如home.js中有其它模块合并进来的情况
                if (item.pageCombo) {
                    me._setModsJsMap(item);
                    me._setPagesJsMap('pageCombo');
                } else {
                    me._setPagesJsMap();
                }
            } else {
                //针对mod文件夹下的模块
                this._setModsJsMap(item);
            }
        }
    },

    _setModsJsMap: function(item) {
        var me = this;

        if (item.files) {
            for (var i = 0, len = item.files.length; i < len; i++) {
                var curItem = item.files[i];
                if (curItem.indexOf('m_') < 0) {
                    var modName = me._getSr(curItem, '/', '.js');
                    me.onlineJsMap[modName] = item.fvName;
                    me.envJsMap[modName] = curItem.replace(/^js\//, '/');
                }
            }
        }

        if (item.pageCombo) {
            for (var key in item.pageCombo) {
                var modArr = item.pageCombo[key];

                for (var j = 0, len = modArr.length; j < len; j++) {
                    var curItem = modArr[j],
                        modName = curItem;

                    if (curItem.indexOf('m_') < 0) {
                        modName = me._getSr(curItem, '/', '.js');
                    }

                    me.onlineJsMap[modName] = key;
                    me.envJsMap[modName] = curItem.replace(/\.\/js\//, '/');
                }
            }
        }
    },

    _setPagesJsMap: function(type) {
        for (var key in this.dependencyMap) {
            var item = this.dependencyMap[key],
                path = item.path.replace(/^js\//, '/');

            if (/\/pages\//.test(path)) {
                this.envJsMap[key] = path;
                if (!type) {
                    this.onlineJsMap[key] = path;
                }
            }
        }
    },

    /**
     * 获取先通过split分割然后通过replace替换后的字符串
     * replaceStr 可选
     */
    _getSr: function(oriStr, splitStr, replaceStr) {
        var strArr = oriStr.split(splitStr),
            modPath = strArr[strArr.length - 1];

        if (replaceStr) {
            modPath = modPath.replace(replaceStr, '')
        }

        return modPath;
    },

    filterBasename: function(name) {
        // 英文、数字、点、中划线、下划线的组合，且不能以点开头
        var FILTER_RE = /^\.|[^\w\.\-$]/;

        return !FILTER_RE.test(name);
    },

    filterExtname: function(name) {
        // 支持的后缀名
        var EXTNAME_RE = /\.(js)$/i;
        return EXTNAME_RE.test(name);
    },

    /**
     * 文件与路径筛选器
     * @param   {String}    文件路径
     * @return  {Boolean}
     */
    filter: function( file ) {
        if ( fs.existsSync( file ) ) {
            var stat = fs.statSync( file );

            if ( stat.isDirectory() ) {
                return false;
            } else {
                return this.filterExtname( path.extname( file ) );
            }
        } else {
            return false;
        }
    },

    /**
     * 对象合并，返回合并后的对象
     * 支持深度合并
     */
    extend: function(targetObj, configObj) {
        for (var key in configObj) {
            if (targetObj[key] != configObj[key]) {
                if (typeof configObj[key] == 'object') {
                    targetObj[key] = extend(targetObj[key], configObj[key]);
                } else {
                    targetObj[key] = configObj[key]
                }
            }
        }

        return targetObj;
    }
};

module.exports = gd;