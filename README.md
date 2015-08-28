自动生成jsmap表及基础build.conf文件
==========

由于目前模块加载器`core.js`中模块加载方式是通过`key->value`的形式，在开发过程中需要人工单独配置`jsmap`表，包含线上合并文件后的`jsmap`、线下开发的`jsmap`，以及打包配置文件也需要单独编写，整个过程比较繁琐，该工具主要解决以上问题。

##主要功能点

1. 自动抽取所有模块依赖关系表`dependency.json`
2. 自动生成线上、开发环境的`jsmap`
3. 自动生成基础的`build.conf`打包配置
4. 实时监听项目文件变化，更新`jsmap`
5. 实时监听`build.conf`变化更新`jsmap`

总的来说，不需要单独手动维护`jsmap`表，而且对于大多数项目js打包要求，不需要手动编写`build.conf`配置文件。

##具体使用示例

**a. 安装** 

```
npm install jsmap -g

gd -v  //0.0.2 安装成功
```

**b. 进入示例项目**

这里准备了一个demo示例项目，该目录结构和我们项目基本一致

```
git clone https://github.com/zhangchen2397/jsmap-demo.git

cd ./jsmap-demo/news 
```

注意示例项目中包含两个目录，`frontend`为前端组件库目录，`news`为项目所有目录，平级放置即可

进入`news`目录后，注意此时项目中没有`build.conf`文件，在`index.jsp`文件中，不管是线上还是线下`jsmap`都为空，且前后多我注释，如下：

```javascript
<script type="text/javascript" id="file_config">
    var g_config = {
        //onlineJsmapStart
        jsmap: {},
        //onlineJsmapEnd
        testEnv: false
    };
</script>
<script>
    var g_config = {
        //envJsmapStart
        jsmap: {},
        //envJsmapEnd
        testEnv: true
    };
</script>
```

`jsmap`前后的注释不要删除，是用来自动生成`jsmap`的标记，其余的配置和之前一样写就行。这样后续开发或上线都不需要手动添加`jsmap`了。

**c. 运行命令`gd`**

```
gd [mtConfigPath] [-w]

-- mtConfigPath jsmap配置所有目录
-- -w 是否启动监听文件夹，实时生成build.conf及jsmap
```

如目录结构和demo示例一致，即`jsmap`在`index.jsp`文件中，且`index.jsp`在的项目的根目录下，直接运行`gd`命令即可：

```
//在`news`目录下直接运行`gd`命令

gd
```

运行后发现在项目根目录下自动生成了`build.conf`配置文件及`dependency.json`模块依赖文件，合并的基本规则为除`pages`目录下的文件合并为一个包，`pages`下的文件单独打包，线上大部分项目也都是这种合并规则，这种情况下，所有的开发过程无需关心`build.conf`及`jsmap`了。

如项目打包比较复杂，直接修改`build.conf`，`jsmap`会同步自动更新

`dependency.json`模块依赖文件包含所有的模块依赖关系配置表

**d. 更多使用示例**

如`jsmap`不在`index.jsp`中，开启文件夹监听模块，通过`gd`参数也可以单独指定

```
gd ./conf/build.conf -w
```

当监听的文件中依赖关系有变化时，终端实时提示生成jsmap是否成功或失败，如：

![demo]( https://raw.githubusercontent.com/zhangchen2397/jsmap/master/doc/demo.png "demo" )

注：路径均相对于运行当前命令所在目录。


