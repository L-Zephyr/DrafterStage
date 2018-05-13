import Vuex from 'vuex'
import Vue from 'vue'
import mutations from './mutations'

Vue.use(Vuex)

const state = {
    selfOnly: true, // 是否只显示定义在同一Class中的方法
    callGraphMode: true, // 是否显示方法调用图模式
    currentClass: null, // 当前选中的类型
    selectedNode: null, // 当前选中的节点
}

const store = new Vuex.Store({
    state,
    getters: { },
    actions: { },
    mutations
})

export default store