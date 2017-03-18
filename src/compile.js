/**
*  compile 是模板编辑解析，将Dom元素解析，找出指令和占位符，和Watcher建立关系，
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
        this.$fragment = this.nodeTOfragment(this.$el);
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
                that.compile(node);
            }
            else if (that.isTextNode(node) && reg.test(text)) {
                // 参数是 Node 和正则匹配的第一个
                that.compileText(node, RegExp.$1)
            }
            //递归调用
            if (node.childNodes && node.childNodes.length) {
                that.compileElement(node);
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
                    compileUtil.eventHandler(node, that.$vm, attrVal, dir)
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



//----------------指令处理集合（把指令处理的一些方法单独抽出来）-------------------

var compileUtil = {

    /**
    * 绑定view与model(把模板指令解析出来，和watcher管理)
    * 添加一个Watcher，监听exp相关的所有字段变化，具体方法可以看Watcher的注释
    * @param {node} node    -dom节点
    * @param {obj} vm       -当前Vue实例
    * @param {string} exp   -指令的值
    * @param {string} dir   -指令的类型
    */
    bind: function(node, vm, exp, dir) {
        //前两步 是为了把 data的数据同步到 视图上
        var updaterFn = updater[dir + 'Updater'];
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        // 这个其实就是 当 vm的exp属性发生改变，就会发布事件，触发updaterFn函数
        new Watcher(vm, exp, function(value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    /**
    * text、html、model、class 参数都一样的
    * @param {node} node    -dom节点
    * @param {obj} vm       -当前Vue实例
    * @param {string} exp   -指令的值 如：v-html={htmlxxx} ==> exp为 htmlxxx
    */
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },

    html: function(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },

    class: function(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    //v-model 指令特殊处理下，需要给当前node添加一些input事件，做到双向绑定
    model: function(node, vm, exp) {

        //这个为了做到，model-->view 同步
        this.bind(node, vm, exp, 'model');
        //下面就是为了做到，view改变-->model 同步

        var me = this,
            val = this._getVMVal(vm, exp); //当input改变时，先获取vm.data.XX 的值

        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            //输入的值和  vm实例里的data里值一样
            if (val === newValue) {
                return;
            }
            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    // 事件处理，vue中 事件指令一般为“v-on:click = {xxx}”
    eventHandler: function(node, vm, exp, dir) {
        //剥离出具体的事件名
        var eventType = dir.split(':')[1],
            // 添加的事件函数，肯定是在 vue实例 methods中定义了，找出对应的函数，exp为函数名
            fn = vm.$options.methods && vm.$options.methods[exp];
        if (eventType && fn) {
            //给次node添加事件，fn.bind(vm),是为了让函数的作用域在当前的vue实例上，this可以调用Vue实例的方法属性
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    //获取 当前vue实例下 key为exp的值
    _getVMVal: function(vm, exp) {
        var val = vm._data;
        exp = exp.split('.');
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    },

    //设置 当前vue实例下 key为exp的值
    _setVMVal: function(vm, exp, value) {
        var val = vm._data;
        exp = exp.split('.');
        exp.forEach(function(k, i) {
            // v-mode = {obj.data.name} ,绑定的都是最后一个值，非不是最后一个，就改变val
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};


//----------------update 的几种类型的的处理-------------------
/**
* textUpdater: 文本内容更新
*
* htmlUpdater： innerHTML更新
*
* classUpdater： className 更新
*
* modelUpdater： value更新，这个一般是指表单，如input采用value属性。
*/
var updater = {
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },

    htmlUpdater: function(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    classUpdater: function(node, value, oldValue) {
        // className 要在原来的calssName的基础上  + ‘ ’ + 新的class
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');
        var space = className && String(value) ? ' ' : '';
        node.className = className + space + value;
    },

    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};
