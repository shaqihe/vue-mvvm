/**
* Vue作为数据绑定的入口，整合Observer、Compile和Watcher三者，
* 1. 通过Observer来监听自己的model数据变化，
* 2. 通过Compile来解析编译模板指令，
* 3. 最终利用Watcher搭起Observer和Compile之间的通信桥梁，
* 4. 达到数据变化 -> 视图更新；视图交互变化(input) -> 数据model变更的双向绑定效果。
*/


/**
 * Vue 构造函数
 *
 * @protected
 * @method
 * @param {Object}  options         -实例化Vue需要的所有参赛
 * @param {Object} options-data     -数据参赛
 * @param {Object} options-methods  -函数的map
 * @param {String} options-el       -元素作为 Vue 实例的挂载目标
 * @returns {Object}
 */
function Vue(options) {
    this.$options = options;
    var data = this._data = this.$options.data;
    var me = this;

    // Vue实例中，this.data.xx 可以直接通过 this.XX 或者 vm.xx来获取，所以要增加下代理，
    // 还是利用数据劫持，在geter阶段， 获取this.xxx 返回this.data.xxx;
    Object.keys(data).forEach(function(key) {
        me._proxy(key);
    });

    observe(data, this);

    this.$compile = new Compile(options.el || document.body, this)
}

Vue.prototype = {
    //主动增加一个订阅
    /**
    * key: 订阅的属性，cd：回调函数
    */
    $watch: function(key, cb, options) {
        new Watcher(this, key, cb);
    },

    // Vue实例中，this.data.xx 可以直接通过 this.XX 或者 vm.xx来获取，所以要增加下代理，
    // 还是利用数据劫持，在geter阶段， 获取this.xxx 返回this.data.xxx;
    _proxy: function(key) {
        var me = this;
        Object.defineProperty(me, key, {
            configurable: false,
            enumerable: true,
            get: function proxyGetter() {
                return me._data[key];
            },
            set: function proxySetter(newVal) {
                me._data[key] = newVal;
            }
        });
    }
};
