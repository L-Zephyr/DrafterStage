<template>
    <div class="panel">
        <input v-model="keyword" placeholder="Search...">
        <p title="Only the methods defined in the same class are displayed">
            <input type="checkbox" v-model="selfOnly" checked> Intrinsic methods only
        </p>
        <ul>
            <li v-for="item in list"
                :key = "item.id"
                :style="{ paddingLeft: item.padding + 'px' }"
                @click="clickItem(item)"
            >{{item.text}}</li>
        </ul>
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
            }
        },

        methods: {
            clickItem(item) {                
                this.$emit("onSelectedChange", item.data)
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
                this.visit(this.datas, (item, level) => {
                    // 根据关键字过滤
                    if (this.keyword.length > 0 &&  item.text.toLowerCase().search(this.keyword.toLowerCase()) == -1) {
                        return
                    }
                    nodes.push({
                        __type: item.children === undefined ? 'leaf' : 'tree', // 是否为叶子节点
                        text: item.text,
                        data: item, // 点击时回调节点的原始数据
                        padding: level * 20,
                    })
                })
                return nodes
            }
        },

        watch: {
            selfOnly(value) {
                this.$emit('onSelfOnlyChange', value)
            }
        },
    }
</script>

<style scoped>

.panel {
    background-color: white;
    overflow: auto;
    width: 300px;
    height: 100%;
    position: fixed;
    left: 0px;
    top: 0px;
}

ul {
    width: 100%;
}

</style>
