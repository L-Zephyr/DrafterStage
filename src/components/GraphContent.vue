<template>
    <div @click="onClickBackground" :class="['graph-content', isNodeSelected ? 'content-right' : '']">
        <div v-html="graph" id="SvgContainer">
            
        </div>
        <button 
            class="pick-button"
            title="pick something you want" 
            @click="onPick"
        >{{ this.isPicked ? "restore" : "pick" }}
        </button>
        <button 
            :class="['scale-up']" 
            title="Scale up" 
            @click="onScaleUp">
        </button>
        <button 
            :class="['scale-down']" 
            title="Scale down" 
            @click="onScaleDown">
        </button>

        <button class="confirm-button" @click="onConfirmPick">
            OK
        </button>
    </div>
    
</template>

<script>
    import * as SVGGenerator from '../js/SVG/SVGGenerator.js'
    import * as Global from '../js/Global.js'
    import { mapMutations, mapState } from 'vuex'
    import {
        SVGHandler,
        Handler
    } from '../js/SVG/SVGHandler'
    import SVGNode from '../js/SVG/SVGNode'

    /* 选中事件: nodeSelected(SVGNode), 未选中任何节点则为null */
    export default {
        props: [
            // "currentClass", // 当前指定的类名
            // "selfOnly",     // 只显示内部的方法
            // "showInheritGraph" // 是否显示类图模式
            ], 

        data() {
            return {
                graph: "<div/>",
                // svg: new SVGHandler(),
                isNodeSelected: false, // 是否选中节点
                isPicked: false, // 是否仅显示了部分节点
            }
        },

        computed: {
            ...mapState([
                "selfOnly",
                "callGraphMode",
                "currentClass",
                "isPickMode"
            ]),
        },

        watch: {
            // 切换文件
            currentClass(clsName) { 
                this.restoreContent()
            },

            // 显示/隐藏内部方法
            selfOnly(self) {
                this.restoreContent()
            },
             
            // 方法调用图/类图切换
            callGraphMode(callGraph) {
                if (!callGraph) {
                    this.restoreContent()
                }
            },

            // 进入pick模式后收起右侧详情面板
            isPickMode(pick) {
                if (pick) {
                    this.isPicked = true
                    this.SET_SELECTED(null)
                } else {
                    this.isPicked = Handler.pickedNodes.length > 0
                }
            }
        },

        created() {
            let selectedColor = 'blue' // test

            // 设置SVG节点的点击事件，node为SVGNode类型
            Handler.onClickNode = (node) => {
                // 发送点击事件
                if (!this.isPickMode) {
                    this.selectAtNode(node)
                }
            }
        },

        methods: {
            ...mapMutations([
                "SET_SELECTED",
                "SET_IS_PICK_MODE",
            ]),

            // =================
            // 点击事件
            // =================

            // 点击背景
            onClickBackground() {
                // console.log('点击背景')
                if (!this.isPickMode) {
                    Handler.deselectedAll()
                    this.selectAtNode(null)
                }
            },

            // 点击放大
            onScaleUp() {
                Handler.zoomBy(1.2)
            },

            // 点击缩小
            onScaleDown() {
                Handler.zoomBy(0.8)
            },

            // 进入/退出pick模式
            onPick() {
                if (!this.isPicked) {
                    this.SET_IS_PICK_MODE(true) // 进入pick模式
                } else {
                    this.restoreContent()
                }
            },

            // 确认选择的节点
            onConfirmPick() {
                this.updateContent()
                this.SET_IS_PICK_MODE(false)
            },

            // 选中节点，显示/收起右侧视图, SVGNode类型
            selectAtNode(node) {
                // this.$emit('nodeSelected', node)
                this.SET_SELECTED(node)
                this.isNodeSelected = node != null
            },

            // =================
            // Methods
            // =================

            // 更新数据
            updateContent() {
                // this.$emit('nodeSelected', null) // 收起右侧面板
                this.SET_SELECTED(null) // // 收起右侧面板

                if (this.callGraphMode) { // 方法调用图模式
                    // 生成SVG
                    this.graph = Handler.genereateCallGraph()
                    // 更新Handler
                    setTimeout(() => {
                        Handler.update(this.$el, this.$store.getters.currentClassId)
                    }, 0);
                } else { // 类图模式
                    this.graph = Handler.genereateClassMap()
                    // 更新Handler
                    setTimeout(() => {
                        Handler.update(this.$el)
                    }, 0);
                }
            },

            // 显示所有的内容
            restoreContent() {
                this.SET_IS_PICK_MODE(false)
                Handler.clearPickedNodes()
                this.updateContent()
                this.isPicked = false
            }
        }
    }
</script>

<style scoped lang="less">

.graph-content {
    margin-left: 300px;
    padding-right: 0px;
}

svg, svg * {
    background-color: transparent;
}

.content-right {
    padding-right: 300px;
}

#SvgContainer {
    width: 100%;
    height: 100%;
}

div {
    width: 100%;
    height: 100%;
}

.side-buttons {
    position: fixed;
    border-radius: 2px;
    width: 40px;
    height: 36px;
}

.scale-up {
    .side-buttons;
    right: 20px;
    bottom: 85px;
    background: url(../img/scale_up.png) no-repeat center rgba(0,0,0,0.6);
}

.scale-down {
    .side-buttons;
    right: 20px;
    bottom: 40px;
    color: white;
    background: url(../img/scale_down.png) no-repeat center rgba(0,0,0,0.6);
}

.pick-button {
    .side-buttons;
    right: 20px;
    bottom: 140px;
    background: rgba(0,0,0,0.6);
}

.confirm-button {
    .side-buttons;
    right: 100px;
    bottom: 140px;
    background: rgba(0,0,0,0.6);
}

.button-right-padding {
    right: 350px;
}
</style>
