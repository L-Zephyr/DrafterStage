import Vuex from 'vuex'
import Vue from 'vue'
import mutations from './mutations'
import * as Global from '../js/Global'

Vue.use(Vuex)

const state = {
    selfOnly: true, // 是否只显示定义在同一Class中的方法
    callGraphMode: true, // 是否显示方法调用图模式
    currentClass: null, // 当前选中的类型名称（不是id）, String
    selectedNode: null, // 当前选中的节点, SVGNode
    isPickMode: false, // 是否在pick模式
}

const getters = {
    // 当前选中类型的ID
    currentClassId: state => {
        let cls = Global.getClassForName(state.currentClass)
        if (!cls) {
            return null
        }
        return cls.id
    }
}

const store = new Vuex.Store({
    state,
    getters,
    actions: { },
    mutations
})

export default store