<template>
    <div class="panel">
        <input type="text" v-model="keyword" placeholder="Search...">
        <label><input type="checkbox" v-model="selfOnly" checked> Intrinsic methods only</label>
        <div class="list-container">
            <ul>
                <li v-for="item in list"
                    :key = "item.id"
                    :style="{ paddingLeft: item.padding + 'px' }"
                    :class="{selected: item.isSelected}"
                    @click="clickItem(item)"
                >
                    <div class="node-content">
                        {{item.text}}
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>


<script>
    // 事件: onSelectedChange(node) 改变当前选中的项目
    // 事件: onSelfOnlyChange(Bool) 
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
            }
        },

        methods: {
            clickItem(item) {                
                this.$emit("onSelectedChange", item.data)

                this.selectedId = item["id"]
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
                this.$emit('onSelfOnlyChange', value)
            },
        },
    }
</script>

<style scoped>

* {
    font-family: Menlo, Monaco, 'Courier New', monospace;
}

.panel {
    display: flex;
    flex-direction: column;

    background-color: white;
    border-right: 1px solid #d6e0e8;
    overflow: auto;
    width: 300px;
    height: 100%;
    position: fixed;
    left: 0px;
    top: 0px;
}

input[type='text'] {
    width: 250px;
    font-size: 16px;
    align-self: center;
    margin-top: 70px;
    border-width: 0 0 2px 0;
    border-style: solid;
    border-color: #d7e1ea;
}

input[type='text']:focus {
    outline: 0px;
    align-self: center;
    margin-top: 70px;
    border-width: 0 0 2px 0;
    border-style: solid;
    border-color: #d7e1ea;
}

input[type='checkbox'] {
    background-color: #42cc92;
    border-radius: 12px;
}

label {
    margin-top: 10px;
    margin-left: 20px;
}

ul {
    list-style: none;
    overflow: auto;
    padding: 20px 0 0 0;
}

.list-container ul {
    display: inline-block;
    min-width: 300px;
}

li {
    padding-top: 5px;
    padding-bottom: 5px;
    cursor: pointer;
}

li:hover {
    background-color: rgba(66, 204, 146, 0.3);
}

.node-content {
    padding: 0 20px 0 20px;
}

.selected {
    background-color: #42cc92;
    color: white;
}

.selected:hover {
    background-color: #42cc92;
    color: white;
}

</style>
