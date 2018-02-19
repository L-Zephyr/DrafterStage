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
    import PanZoomSvg from 'svg-pan-zoom'
    import {
        SVGHandler,
        SVGLine,
        SVGNode,
        Handler
    } from '../js/SVGHandler'

    /* 选中事件: nodeSelected(SVGNode), 未选中任何节点则为null */
    export default {
        props: ["currentClass", "selfOnly"], // 当前指定的类名，只显示内部的方法

        data() {
            return {
                graph: "<div/>",
                // svg: new SVGHandler(),
                panZoomSvg: undefined,
                currentScale: 1, // 当前缩放比例
                isNodeSelected: false, // 是否选中节点
            }
        },

        watch: {
            // 切换文件
            currentClass(clsName) { 
                console.log('切换文件' + clsName)
                this.updateContent()
            },

            // 显示/隐藏内部方法
            selfOnly(self) {
                console.log('隐藏内部方法: ' + self)
                this.updateContent()
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
                this.panZoomSvg.zoomBy(this.currentScale + 0.2)
            },

            // 点击缩小
            onScaleDown() {
                this.panZoomSvg.zoomBy(this.currentScale - 0.2)
            },

            // 选中节点, SVGNode
            selectedNode(node) {
                this.$emit('nodeSelected', node)
                this.isNodeSelected = node != null
            },

            // 更新数据
            updateContent() {
                // 获取类型id
                let cls = Global.getClassForName(this.currentClass)

                if (cls !== undefined) {
                    let clsId = cls.id
                    // 生成并显示SVG
                    this.graph = SVGGenerator.generateCallGraphForClass(clsId, {
                        selfOnly: this.selfOnly,
                    })
                    setTimeout(() => {
                        let root = this.$el.querySelector('svg')
                        // root.setAttribute('width', '100%')
                        root.setAttribute('height', '100%')
                        // root.setAttribute('style', '{overflow: auto;}')

                        // 缩放SVG
                        this.panZoomSvg = PanZoomSvg(root, {
                            fit: false,
                            zoomScaleSensitivity: 0.4,
                            dblClickZoomEnabled: false,
                            mouseWheelZoomEnabled: false,
                            contain: false,
                            preventMouseEventsDefault: false,
                            center: false,
                            beforePan: this.beforePan,
                        })
                        
                        // 注册事件
                        Handler.update(this.$el, clsId)
                    }, 0);
                } else {
                    throw "未找到类型:" + this.currentClass + " !!, 数据有误" 
                }
            },

            // 控制可拖动区域
            beforePan(oldPan, newPan) {
                var stopHorizontal = false
                    , stopVertical = false
                    , gutterWidth = 100
                    , gutterHeight = 100
                    // Computed variables
                    , sizes = this.panZoomSvg.getSizes()
                    , leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth
                    , rightLimit = sizes.width - gutterWidth - (sizes.viewBox.x * sizes.realZoom)
                    , topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight
                    , bottomLimit = sizes.height - gutterHeight - (sizes.viewBox.y * sizes.realZoom)
                let customPan = {}
                customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x))
                customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y))
                return customPan
            },
        }
    }
</script>

<style scoped>
    .graph-content {
        margin-left: 300px;
        padding-right: 0px;
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

    .scale-up {
        position: fixed;
        right: 50px;
        bottom: 100px;
        width: 40px;
        height: 40px;
        background-color: aquamarine;
    }

    .scale-down {
        position: fixed;
        right: 50px;
        bottom: 40px;
        width: 40px;
        height: 40px;
        background-color: rgb(144, 185, 172);
    }

    .button-right-padding {
        right: 350px;
    }
</style>
