import Vuex from 'vuex'
import Vue from 'vue'
import mutations from './mutations'
import * as Global from '../js/Global'
import SVGNode from '../js/SVG/SVGNode'

Vue.use(Vuex)

const state = {
    /**
     * @type {boolean} 是否只显示定义在同一Class中的方法
     */
    selfOnly: true, 
    /**
     * @type {boolean} 是否显示方法调用图模式
     */
    callGraphMode: true, 
    /**
     * @type {string} 当前选中的类型名称（不是id
     */
    currentClass: null, 
    /**
     * @type {SVGNode} 当前选中的节点
     */
    selectedNode: null, 
    /**
     * @type {boolean} 是否在pick模式
     */
    isPickMode: false, 
    /**
     * @type {boolean} 是否显示方法的访问等级
     */
    showAccessLevel: false, 
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
    actions: {},
    mutations
})

export default store