<template>
    <div class="container" id="app">
        <list-panel 
            :datas="root" 
            @onSelectedChange="selectedChange"
            @onSelfOnlyChange="onSelfOnlyChange">
        </list-panel>
        <graph-content 
            :current-class="currentClass" 
            :self-only="selfOnly" 
            @nodeSelected="onNodeSelected">
        </graph-content>
        <detail-panel 
            :selected-node="selectedNode"
            :self-only="selfOnly">
        </detail-panel>
    </div>
</template>

<script>
    import ListPanel from './components/ListPanel.vue'
    import GraphContent from './components/GraphContent.vue'
    import DetailPanel from './components/DetailPanel.vue'
    import * as Global from './js/Global.js'

    export default {
        components: {
            ListPanel,
            GraphContent,
            DetailPanel,
        },

        data() {
            return {
                currentClass: "", // 当前选中的类型
                selfOnly: true, // 只显示内部方法
                selectedNode: null, // 当前选中的节点，SVGNode
            }
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
            }
        },

        methods: {
            // 改变选中的Class
            selectedChange(item) {
                this.currentClass = item.text
                this.selectedNode = null
            },

            // 是否只显示内部的方法
            onSelfOnlyChange(only) {
                this.selfOnly = only
                this.selectedNode = null
            },

            // 选中节点
            onNodeSelected(node) {
                this.selectedNode = node
            },
        }
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

