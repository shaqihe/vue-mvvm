/**
* (使用Object.defineProperty转化为getter与setter,)
* 这个文件主要完成，把一个对象的属性，在geter、seter阶段增加数据劫持，尤其是在setter
* 阶段处理一些双向绑定的情况。
* 在数据 和 视图 发生变化，如何互相通知？就用到了 发布/订阅模式
*
*/



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
Oserver.prototype = {
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

    }

}



//------------------------要用到发布、订阅，下面简单实现一个事件对象----------------

function Dep() {
    // 这个数组来维护所有的，事件对象，如：[{'click1': handleClick1}, {'click2': handleClick2}]
    // handleClick1 是一个函数的引用。 具体是事件模型，和vue 或者 大部分非DOM事件是一个思想
    // vue中，on('xxx')  就是主动往 subs 中push一个事件对象，
    // emit('click1') 时，就是找到 click1对应的handleClick1并且运行
    this.subs = [];
}

Dep.prototype = {
    addSub: function (target) {
        this.subs.push(target)
    },
}
