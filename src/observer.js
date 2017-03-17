/**
* (使用Object.defineProperty转化为getter与setter,)
* 这个文件主要完成，把一个对象的属性，在geter、seter阶段增加数据劫持，尤其是在setter
* 阶段处理一些双向绑定的情况。
* 在数据 和 视图 发生变化，如何互相通知？就用到了 发布/订阅模式
*
*/

/**
 * 暴露 observer方法，返回Observer实例
 *
 * @protected
 * @method
 * @param {Object} data  -要转换的数据对象
 * @returns {Object}
 */

function observe(value) {
    //判断类型，typeOf可能出现 null、Array 等也是object，此次要做精确判断
    if (Object.prototype.toString.call(value) !== '[object Object]') {
        return;
    }

    return new Observer(value);
};


/**
 * Observer的构造函数
 *
 * @protected
 * @method
 * @param {Object} data  -要转换的数据对象
 * @returns {void}
 */
function Observer (data){
    this.data = data;
    this.run (data); //转换函数搞起，把data转换成 seter、geter；
};

// 原型上的一些公用方法
Observer.prototype = {
    //转换的入口函数
    run: function (data) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                this.defineReactive(data, key, data[key]); //调用真正的seter转换函数
            }
        }
    },
    //转换的主函数
    defineReactive: function (data, key, value) {

        var dep = new Dep();
        var childObj = observe(value);
        Object.defineProperty(data, key, {
            enumerable: true, //可枚举
            configurable: false, //不再defineProperty
            get: function () {

                // 通过Dep定义一个全局target属性，暂存watcher, 添加完移除
                if (Dep.target) {
                    dep.depend();
                }
                return value;
            },
            set: function (newVal) {
                
                if (newVal === value) {
                    return;
                }
                value = newVal;
                //如果value 是一个对象，还要进入监控流程
                observe(value);
                //通知订阅者，数据发生改变了
                dep.notify();
            }
        });
    }

}



//------------------------要用到发布、订阅，下面简单实现一个事件对象----------------
// 一般的事件对象如：[{'click1': handleClick1}, {'click2': handleClick2}]
// handleClick1 是一个函数的引用。 具体是事件模型，和vue 或者 大部分非DOM事件是一个思想
// vue中，on('xxx')  就是主动往 subs 中push一个事件对象，
// emit('click1') 时，就是找到 click1对应的handleClick1并且运行


var uid = 0; //给每个生成的 Dep 都加一个唯一标识
function Dep() {
    //"subs" 是维护一个数组，用来收集订阅者，数据变动触发notify，再调用订阅者的update方法
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    //增加一个订阅者
    addSub: function (target) {
        this.subs.push(target)
    },

    // 通过Dep定义一个全局target属性，暂存watcher, 添加完移除
    depend: function() {
        Dep.target.addDep(this);
    },

    //移除订阅者
    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    //通知订阅者，并触发订阅者的update()的方法
    notify: function() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
}
