/**
*  comile 是模板编辑解析，将Dom元素解析，找出指令和占位符，和Watcher建立关系，
*  Watcher 把订阅关系注册到 Observer的监听队列里，当Observer 发布消息时，
*  根据不同的指令，进行Dom不同的操作
*
*/

/**
* !!!compile 细说作用的话有主要两个
* 1.页面初始化的时候  解析出模板（页面），把数据填充上
* 2.数据发生变化的时候，update(),把新的数据跟新到模板上
*/


/**
 * Compile的构造函数
 *
 * @protected
 * @method
 * @param {node} el  -Vue实例渲染的节点
 * @param {obj} vm  -当前Vue实例
 * @returns {void}
 */
function Compile(el, vm) {
    this.$vm = vm;
    //el是个节点，直接用。不是节点，就获取此节点
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        // 因为对Dom操作比较频繁，还是比较影响性能的，创建一个文档碎片，所有的操作都基于此文档碎片
        this.$fragment = this.nodeToFragment(this.$el);
        //编译解析模板
        this.init();
        //最后一次性把文档碎片插入到页面(模板中)
        this.$el.appendChild(this.$fragment);
    }
}

//老规矩，添加原型方法
Compile.prototype = {
    //compile 启动，把文档碎片，进行编译，分析里面的指令，并且订阅相关数据
    init: function () {
        this.compileElement(this.$fragment);
    },

    //把Dom转换成 文档碎片
    nodeTOfragment: function (el) {
        //创建一个文档碎片
        var fragment = document.createDocumentFragment(),
            child;
        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    },

    //分析模板，递归解析DOM tree，解析出指令
    compileElement: function(el){
        var childNodes = el.childNodes;
        var that = this;
        //处理所有的子节点
        [].slice.call(childNodes).forEach(function (node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/; //{{xxx}} 正则匹配

            if (that.isElementNode(node)) {
                this.compile(node);
            }
            else if (that.isTextNode(node) && reg.test(text)) {
                // 参数是 Node 和正则匹配的第一个
                that.compileText(node, RegExp.$1)
            }
            //递归调用
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    //解析单个 dom节点，包括节点的熟悉
    compile: function(node) {
        var nodeAttrs = node.attributes;
        var that = this;
        //处理单个熟悉的属性
        [].slice.call(nodeAttrs).forEach(function(attr){
             attrName = attr.name;
             if (that.isDirective(attrName)) {
                var attrVal = attr.value;
                //拿出具体指令值，如“v-model”==> model v-on ==> on
                var dir = attrName.substring(2);
                //判断是不是事件指令
                if (that.isEventDirective(dir)) {
                    compileUtil.eventHandler(node, that, attrVal, dir)
                }
                else {
                    compileUtil[dir] && compileUtil[dir](node, that.$vm, attrVal)
                }
                //指令属性，最后移除
                node.removeAttribute(attrName);
             }
        });
    },

    compileText: function(node, exp) {
        compileUtil.text(node, this.$vm, exp);
    },

    //判断一个节点属性是否为vue指令
    isDirective: function(attr) {
        //简化指令，假设所以指令都以 'V-'开头
        return attr.indexOf('v-') === 0;
    },

    //添加事件指令判断 v-on:click =
    isEventDirective: function(dir) {
        return dir.indexOf('on') === 0;
    },

    //判断一个节点是否为元素
    isElementNode: function(node) {
        return node.nodeType == 1;
    },

    //是否为元素或属性中的文本内容
    isTextNode: function(node) {
        return node.nodeType == 3;
    }
}



//---------------------------------------------------------------
