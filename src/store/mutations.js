import {
    SET_CALL_GRAPH,
    SET_SELF_ONLY,
    SET_CURRENT_CLASS,
    SET_SELECTED
} from './mutation-types'

export default {
    [SET_CALL_GRAPH](state, callgraph) {
        state.callGraphMode = callgraph
    },

    [SET_SELF_ONLY](state, selfonly) {
        state.selfOnly = selfonly
    },

    [SET_CURRENT_CLASS](state, clsname) {
        state.currentClass = clsname
    },

    [SET_SELECTED](state, selected) {
        state.selectedNode = selected
    },
}