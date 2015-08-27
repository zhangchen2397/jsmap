自动生成jsmap表及基础build.conf文件
==========

由于目前模块加载器`core.js`中模块加载方式是通过`key->value`的形式，在开发过程中需要人工单独配置`jsmap`表，包含线上合并文件后的`jsmap`、线下开发的`jsmap`，以及打包配置文件也需要单独编写，整个过程比较繁琐，该工具主要解决以上问题。

##主要功能点

1. 自动生成线上、开发环境的`jsmap`
2. 自动生成基础的`build.conf`打包配置
3. 实时监听项目文件变化，更新`jsmap`
4. 实时监听`build.conf`变化更新`jsmap`

总的来说，不需要单独手动维护`jsmap`表，而且对于大多数项目js打包要求，不需要手动编写`build.conf`配置文件。

##具体使用示例

**a. 安装** 

```
npm install generate-jsmap -g
```

**b. 进入示例项目所有目录**

这里准备了一个demo示例项目，该目录结构和我们项目基本一致

```
git clone https://github.com/zhangchen2397/dependency.git

cd ./dependency/demo
```

进入`demo`目录后，注意此时项目中没有`build.conf`文件，在`index.jsp`文件中，不管是线上还是线下`jsmap`都为空，且前后多我注释，如下：

```javascript

<% if (!isTest) { %>
    <script type="text/javascript" id="file_config">
        var g_config = {
            //onlineJsmapStart
            jsmap: {},
            //onlineJsmapEnd
            testEnv: false,
            staticPath: '/infocdn/wap30/info_app/travel',
            serverDomain: 'http://infocdn.3g.qq.com/g/storeinc',
            buildType: 'project',
            storeInc: {
                'store': true,
                'inc': true,
                'debug': false
            }
        };
    </script>
<% } else { %>
    <script>
        var g_config = {
            //envJsmapStart
            jsmap: {},
            //envJsmapEnd
            testEnv: true,
            staticPath: '/infoapp/travel/touch',
            buildType: 'project',
            storeInc: {
                'store': false,
                'inc': false,
                'debug': true
            }
        };
    </script>
<% } %>
```

`jsmap`前后的注释不要删除，是用来自动生成`jsmap`的标记，其余的配置和之前一样写就行。这样后续开发或上线都不需要手动添加`jsmap`了。

**c. 运行命令`gd`**

```
gd [buildConfPath] [jsmapPath]
```

如目录结构和demo示例一致，即`jsmap`所在的`index.jsp`及`build.conf`所在的目录都在项目的根目录下，直接运行`gd`命令即可：

```
//在demo目录下直接运行`gd`命令

gd
```

运行后发现在项目根目录下自动生成了`build.conf`配置文件，合并的基本规则为除`pages`目录下的文件合并为一个包，`pages`下的文件单独打包，线上大部分项目也都是这种合并规则，这种情况下，所有的开发过程无需关心`build.conf`及`jsmap`了。

如项目打包比较复杂，直接修改`build.conf`，`jsmap`会同步自动更新

**d. 更多使用示例**

如`jsmap`不在`index.jsp`中，或`build.conf`不在项目所在目录下，通过`gd`参数也可以单独指定

```
gd ./conf/build.conf ./mt_config.jsp
```

当`build.conf`有修改或有增加删除js文件时，终端实时提示生成jsmap是否成功或失败，如：

![demo]( http://zhangchen2397.github.io/dependency/doc/demo.png "demo" )

注：路径均相对于运行当前命令所在目录。


