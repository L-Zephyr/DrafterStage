<template>
    <div class="panel">
        <!-- 功能选择区域 -->
        <div class="mode-area">
            <div @click="selectCallGraphMode" :class="['mode-button', {'mode-selected': !isInheritMode}]">
                Call Graph
            </div>
            <div @click="selectClassDiagramMode" :class="['mode-button', {'mode-selected': isInheritMode}]">
                Class Diagram
            </div>
        </div>
        <!-- 类型选择区域 -->
        <div :class="[isInheritMode ? 'class-area-hidden' : 'class-area']">
            <div class="input-area">
                <input type="text" v-model="keyword" placeholder="Search...">
                <label><input type="checkbox" v-model="selfOnly" checked> Intrinsic methods only</label>
            </div>
            <div class="list-container">
                <ul>
                    <li v-for="item in list"
                        :key = "item.id"
                        :style="{ paddingLeft: item.padding + 'px' }"
                        :class="{selected: item.isSelected}"
                        @click="selectItem(item)"
                    >
                        <div class="node-content">
                            {{item.text}}
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
    import { mapMutations } from 'vuex'

    export default {
        /*
        节点数据
        [
            {
                text: "xxx", // 节点的内容
                children: [], // 子节点
                ..., // 其他自定义的数据
            }, 
            ...
        ]
        */
        props: ["datas"],

        data() {
            return {
                keyword: "", // 搜索关键字
                selfOnly: true, // 只显示内部方法，默认勾选
                fuzzySearch: true, // 模糊搜索
                caseSensitive: false, // 区分大小写

                selectedId: undefined, // 选中项目ID
                isInheritMode: false, // 是否为类图模式
            }
        },

        methods: {
            ...mapMutations([
                "SET_CURRENT_CLASS",
                "SET_SELF_ONLY",
                "SET_CALL_GRAPH",
            ]),

            // 选择list中的某一项
            selectItem(item) {                
                // this.$emit("onSelectedChange", item.data)
                this.SET_CURRENT_CLASS(item.text)
                this.selectedId = item["id"]
            },

            // 选择方法调用图模式
            selectCallGraphMode() {
                this.isInheritMode = false
                // this.$emit('onIsInheritChange', false)

                this.SET_CALL_GRAPH(true)
            },

            // 选择类图模式
            selectClassDiagramMode() {
                this.isInheritMode = true
                // this.$emit('onIsInheritChange', true)

                this.SET_CALL_GRAPH(false)
            },
            
            // 深度优先遍历root节点
            visit(nodes, visitor, level = 0) {
                if (nodes === undefined) {
                    return
                }

                for (let node of nodes) {
                    visitor(node, level)
                    this.visit(node.children, visitor, level + 1)
                }
            },
        },

        computed: {
            // 将数据转换成展示时所用的一维列表
            list() {
                let nodes = []
                this.visit(this.nodeDatas, (item, level) => {
                    // 根据关键字过滤
                    if (this.keyword.length > 0 &&  item.text.toLowerCase().search(this.keyword.toLowerCase()) == -1) {
                        return
                    }

                    let node = {
                        type: item.children === undefined ? 'leaf' : 'tree', // 是否为叶子节点
                        id: item["__id"],
                        text: item["text"],
                        padding: level * 20,
                        isSelected: item["__id"] == this.selectedId,
                        data: item, // 点击时回调节点的原始数据
                    }
                    nodes.push(node)
                })
                return nodes
            },

            // 处理datas，加上唯一的id
            nodeDatas() {
                let index = 0
                let dataList = this.datas
                this.visit(dataList, (item, level) => {
                    item["__id"] = index + "_" + level
                    index++
                })
                return dataList
            },
        },

        watch: {
            selfOnly(value) {
                // this.$emit('onSelfOnlyChange', value)
                this.SET_SELF_ONLY(value)
            },
        },
    }
</script>

<style scoped lang="less">

@import '../style/common.less';

* {
    font-family: Menlo, Monaco, 'Courier New', monospace;
}

.panel {
    display: flex;
    flex-direction: column;

    background-color: transparent;
    overflow-x: hidden;
    overflow-y: auto;
    width: 300px;
    height: 100%;
    position: fixed;
    left: 0px;
    top: 0px;
} 

// 功能选择区域
.mode-area {
    // width: 100%;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: @separator;
    background: white;
    z-index: 2;
}

.mode-button {
    height: 40px;
    width: 100%;
    border-bottom: @separator;
    border-right: 0;
    // border-right: @separator;
    color: black;
    // background-color: white;
    font-weight: bold;
    text-align: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mode-selected {
    background-color: @li-select-color;
    color: white;
}

// class选择区域
.class-area {
    border-right: @separator;
    background: white;
    display: flex;
    flex-direction: column;
    margin-top: 0px;
    z-index: 1;
    transition: 0.2s ease-out;
    flex-grow: 2;
    position: relative;
    top: 0px;
}

.class-area-hidden {
    .class-area;
    top: -100%;
}

// 输入框和选项
.input-area {
    border-bottom: 1px solid @separator-color;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
}

input[type='text'] {
    width: 250px;
    font-size: 16px;
    margin-top: 40px;
    border-width: 0 0 2px 0;
    border-style: solid;
    border-color: #d7e1ea;
}

input[type='text']:focus {
    outline: 0px;
}

input[type='checkbox'] {
    background-color: #42cc92;
    border-radius: 12px;
}

label {
    margin-top: 20px;
    margin-bottom: 20px;
}

// 列表区域
.list-container {
    overflow: auto;
    min-width: 300px;
    flex-grow: 3;
}

ul {
    list-style: none;
    overflow: visible;
    padding: 20px 0 0 0;
    min-width: 300px;
    margin-top: 0px;
    display: inline-block;
}

li {
    padding-top: 5px;
    padding-bottom: 5px;
    cursor: pointer;
}

li:hover {
    background-color: @li-hover-color;
}

.node-content {
    padding: 0 20px 0 20px;
}

.selected {
    background-color: @li-select-color;
    color: white;
}

.selected:hover {
    background-color: @li-select-color;
    color: white;
}

</style>
