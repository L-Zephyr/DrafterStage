<template>
    <div class="container" id="app">
        <list-panel 
            :datas="root" 
            @onSelectedChange="selectedChange"
            @onSelfOnlyChange="onSelfOnlyChange"
            @onIsInheritChange="onIsInheritChange">
        </list-panel>
        <graph-content 
            :current-class="currentClass" 
            :self-only="selfOnly" 
            :show-inherit-graph="isInheritMode"
            @nodeSelected="onNodeSelected">
        </graph-content>
        <detail-panel 
            :selected-node="selectedNode"
            :self-only="selfOnly"
            :is-inherit-mode="isInheritMode">
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
                isInheritMode: false, // 默认显示方法调用图模式
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

            // 类图模式切换
            onIsInheritChange(inherit) {
                this.isInheritMode = inherit
                console.log('模式切换')
            },

            onOptionChange(option) {
                if (option.isInheritMode != this.isInheritMode) {
                    this.isInheritMode = option.isInheritMode
                }
                if (option.isSelfOnly != this.isSelfOnly) {
                    this.isSelfOnly = option.isSelfOnly
                }
                if (option.selectedClass != this.currentClass) {
                    this.currentClass = option.selectedClass
                }
            },

            // 选中类型节点
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

