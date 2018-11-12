<template>
    <div class="container" id="app">
        <list-panel :datas="root">
        </list-panel>
        <graph-content></graph-content>
        <detail-panel></detail-panel>
    </div>
</template>

<script>
import ListPanel from './components/ListPanel.vue'
import GraphContent from './components/GraphContent.vue'
import DetailPanel from './components/DetailPanel.vue'
import * as Global from './js/Global.js'
import { mapState } from 'vuex';

export default {
    components: {
        ListPanel,
        GraphContent,
        DetailPanel,
    },

    data() {
        return {}
    },

    computed: {
        root() {
            let list = []
            for (let cls in Global.getAllClass()) {
                list.push({
                    text: Global.getClass(cls).name
                })
            }
            return list
        },
    },
}
</script>

<style scoped>
.container {
    display: flex;
    height: 100%;
    width: 100%;
}
</style>

<style>
html {
    height: 100%;
    background-color: #f5f6f7;
}

body {
    height: 100%;
}
</style>

