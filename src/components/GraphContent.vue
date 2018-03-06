<template>
    <div @click="onClickBackground" :class="['graph-content', isNodeSelected ? 'content-right' : '']">
        <div v-html="graph" id="SvgContainer">
            
        </div>
        <button 
            :class="['scale-up', isNodeSelected ? 'button-right-padding' : '']" 
            title="Scale up" 
            @click="onScaleUp">
        </button>
        <button 
            :class="['scale-down', isNodeSelected ? 'button-right-padding' : '']" 
            title="Scale down" 
            @click="onScaleDown">
        </button>
    </div>
    
</template>

<script>
    import * as SVGGenerator from '../js/SVGGenerator.js'
    import * as Global from '../js/Global.js'
    import {
        SVGHandler,
        SVGLine,
        SVGNode,
        Handler
    } from '../js/SVGHandler'

    /* 选中事件: nodeSelected(SVGNode), 未选中任何节点则为null */
    export default {
        props: [
            "currentClass", // 当前指定的类名
            "selfOnly",     // 只显示内部的方法
            "showInheritGraph" // 是否显示类图模式
            ], 

        data() {
            return {
                graph: "<div/>",
                // svg: new SVGHandler(),
                isNodeSelected: false, // 是否选中节点
            }
        },

        watch: {
            // 切换文件
            currentClass(clsName) { 
                this.updateContent()
            },

            // 显示/隐藏内部方法
            selfOnly(self) {
                this.updateContent()
            },
             
            showInheritGraph(inherit) {
                if (inherit) {
                    this.updateContent()
                }
            }
        },

        created() {
            let selectedColor = 'blue' // test

            // 设置SVG节点的点击事件，node为SVGNode类型
            Handler.onClickNode = (node) => {
                if (!node) {
                    console.log('点击的节点不存在')
                    return
                }
                Handler.deselectedAll()

                console.log('点击节点' + node.id)

                // 高亮所选的节点以及相关节点
                node.highlight = true
                node.pointToLines().map((line) => {
                    line.highlight = true
                })
                node.pointToNodes().map((node) => {
                    node.highlight = true
                })

                // 发送点击事件
                this.selectedNode(node)
            }
        },

        methods: {
            // 点击背景
            onClickBackground() {
                // console.log('点击背景')
                Handler.deselectedAll()
                this.selectedNode(null)
            },

            // 点击放大
            onScaleUp() {
                Handler.zoomBy(1.2)
            },

            // 点击缩小
            onScaleDown() {
                Handler.zoomBy(0.8)
            },

            // 选中节点, SVGNode类型
            selectedNode(node) {
                if (!this.showInheritGraph) {
                    this.$emit('nodeSelected', node)
                    this.isNodeSelected = node != null
                }
            },

            // 更新数据
            updateContent() {
                this.$emit('nodeSelected', null) // 收起右侧面板

                if (this.showInheritGraph) { // 类图模式
                    this.graph = SVGGenerator.genereateInheritGraph()
                    setTimeout(() => {
                        // 更新SVG事件
                        Handler.update(this.$el)
                    }, 0);
                } else { // 方法调用图模式
                    // 获取类型id
                    let cls = Global.getClassForName(this.currentClass)

                    if (cls !== undefined) {
                        let clsId = cls.id
                        // 生成并显示SVG
                        this.graph = SVGGenerator.generateCallGraphForClass(clsId, {
                            selfOnly: this.selfOnly,
                        })
                        setTimeout(() => {
                            // 更新SVG事件
                            Handler.update(this.$el, clsId)
                        }, 0);
                    } else {
                        throw "未找到类型:" + this.currentClass + " !!, 数据有误" 
                    }
                }
            },
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

.scale-buttons {
    position: fixed;
    border-radius: 2px;
    width: 40px;
    height: 36px;
}

.scale-up {
    .scale-buttons;
    right: 20px;
    bottom: 85px;
    background: url(../img/scale_up.png) no-repeat center rgba(0,0,0,0.6);
}

.scale-down {
    .scale-buttons;
    right: 20px;
    bottom: 40px;
    background: url(../img/scale_down.png) no-repeat center rgba(0,0,0,0.6);
}

.button-right-padding {
    right: 350px;
}
</style>
