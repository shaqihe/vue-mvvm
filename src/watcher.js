/**
* Watcher 订阅者作为  Observer和compile的桥梁，主要做的事件是：
* 1. 自身实例化的时候，往订阅器（Dep）中添加自己，
* 2. 自身有一个update()方法
* 3. 当属性发生改变，调用Dep.notify()发布事件，Wather调用自身的update方法，并触发compile中绑定的回调
*
*/

/**
 * Watcher 构造函数
 *
 * @protected
 * @method
 * @param {obj} vm  -当前Vue实例
 * @param {obj} exp  -绑定的vue实例data.xx 属性
 * @param {void} cd  -在compile实例化Watcher，当绑定的属性发生改变时，触发的回调
 * @returns {Object}
 */
function Watcher(vm, exp, cd) {
    this.cd = cd;
    this.vm = vm;
    this.exp = exp;
    this.depIds = {};
    //实例化的时候，获取当时 exp对应的值,在get()的时候，也会触发 geter的钩子，就把Watcher增加到 Ddp的订阅队列里了
    this.value = this.get();
}

Watcher.prototype = {
    // 触发回调，更新视图
    update: function (){
        this.run();
    },
    // 触发回调，更新视图
    run: function () {
        //获取最新的数据
        var value = this.get();
        //wetcher实例化时的 value
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cd.call(this.vm, value, oldVal);
        }
    },

    addDep: function (dep){
        // 1. 每次调用run()的时候会触发相应属性的getter
        // compile文件里可以看到 getter里面会触发dep.depend()，继而触发这里的addDep
        // 2. 假如相应属性的dep.id已经在当前watcher的depIds里，说明不是一个新的属性，仅仅是改变了其值而已
        // 则不需要将当前watcher添加到该属性的dep里
        // 3. 假如相应属性是新的属性，则将当前watcher添加到新属性的dep里
        // 如通过 vm.child = {name: 'a'} 改变了 child.name 的值，child.name 就是个新属性
        // 则需要将当前watcher(child.name)加入到新的 child.name 的dep里
        // 因为此时 child.name 是个新值，之前的 setter、dep 都已经失效，如果不把 watcher 加入到新的 child.name 的dep中
        // 通过 child.name = xxx 赋值的时候，对应的 watcher 就收不到通知，等于失效了
        // 4. 每个子属性的watcher在添加到子属性的dep的同时，也会添加到父属性的dep
        // 监听子属性的同时监听父属性的变更，这样，父属性改变时，子属性的watcher也能收到通知进行update
        // 这一步是在 this.get() --> this.getVMVal() 里面完成，forEach时会从父级开始取值，间接调用了它的getter
        // 触发了addDep(), 在整个forEach过程，当前wacher都会加入到每个父级过程属性的dep
        // 例如：当前watcher的是'child.child.name', 那么child, child.child, child.child.name这三个属性的dep都会加入当前watcher
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    },

    //获取属性值，同时也会触发具体属性值 geter上的钩子，这里的 Dep是类，没有实例化的。
    get: function() {
        Dep.target = this;
        var value = this.getVMVal();
        Dep.target = null;
        return value;
    },

    //获取vm.data上的具体值
    getVMVal: function() {
        var exp = this.exp.split('.'); // 如：data.obj.name ==> [data, obj, name]
        var val = this.vm._data;
        exp.forEach(function(k) { // 遍历exp：[data, obj, name]，最终获取的是 val[name];
            val = val[k];  //这一步，就会真正的触发 geter上的钩子
        });
        return val;
    }
};
