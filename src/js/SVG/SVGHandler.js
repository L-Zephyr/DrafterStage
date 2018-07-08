import PanZoomSvg from 'svg-pan-zoom'
import SVGNode from './SVGNode'
import SVGLine from './SVGLine'
import store from '../../store/index'
import { SVGData, elementById } from './SVGBase'
import * as SVGGenerator from './SVGGenerator'
import * as Global from '../Global'

// 用来处理SVG相关事件的类型
class SVGHandler {
    constructor() {
        this.onClickNode = undefined; // 响应点击事件, 外部传入，回调参数：SVGNode
        this.panZoomSvg = undefined
        this.pickedNodes = [] // pick模式中选中的节点, [SVGNode]

        store.watch(state => state.isPickMode, (newVal, oldVal) => {
            if (newVal) {
                this.pickedNodes = []
                this.deselectedAll()
            } 
        })
    }

    // ============================
    // 对外公共接口
    // ============================

    // 生成方法调用图，返回SVG
    genereateCallGraph() {
        let clsId = store.getters.currentClassId
        let graph = null
        if (clsId !== undefined) {
            // 生成并显示SVG
            graph = SVGGenerator.generateCallGraphForClass(clsId, {
                selfOnly: store.state.selfOnly,
                specifyIds: this.pickedNodes.map(node => node.id.substring(5))
            })
        } else {
            throw "未找到类型:" + this.currentClass + " !!, 数据有误"
            return null
        }
        return graph
    }

    // 生成类图，返回SVG
    genereateClassMap() {
        return SVGGenerator.genereateClassMap({
            specifyIds: this.pickedNodes.map(node => node.id.substring(5))
        })
    }

    // 更新SVG数据, 传入SVG的根节点和Class的id
    update(root, clsId) {
        SVGData.svgRoot = root.querySelector('svg')
        if (!SVGData.svgRoot) {
            throw 'Not SVG Element found!'
            return
        }
        SVGData.classId = clsId

        // 查找所有的节点
        SVGData.nodes = {}
        let svgNodes = root.querySelectorAll('g[id^="node_"]')
        for (let svgNode of svgNodes) {
            // let title = svgNode.querySelector('title').innerHTML; // 节点的标签
            let node = new SVGNode(svgNode.id, clsId)
            SVGData.nodes[svgNode.id] = node

            // 为每个节点添加点击事件
            for (let child of svgNode.querySelectorAll('*')) {
                child.onclick = (event) => {
                    this.selectAtNode(node)
                    event.stopPropagation()
                }
            }
        }

        // 查找所有连线
        SVGData.lines = {}
        let svgLines = root.querySelectorAll('g[id^="line_"]')
        for (let svgLine of svgLines) {
            let lineId = svgLine.id
            let compentents = lineId.split('_')
            let [fromId, toId] = ['node_' + compentents[1], 'node_' + compentents[2]]
            SVGData.lines[lineId] = new SVGLine(lineId, fromId, toId)
        }

        // 设置高度和背景色
        if (SVGData.svgRoot.getBoundingClientRect().height < document.documentElement.clientHeight) {
            SVGData.svgRoot.setAttribute('height', document.documentElement.clientHeight)
        }

        // 缩放SVG
        this.panZoomSvg = PanZoomSvg(SVGData.svgRoot, {
            fit: false,
            zoomScaleSensitivity: 0.4,
            dblClickZoomEnabled: false,
            mouseWheelZoomEnabled: false,
            contain: false,
            preventMouseEventsDefault: false,
            center: true,
            panEnabled: false,
        })
    }

    // 全部取消选中
    deselectedAll() {
        for (let node in SVGData.nodes) {
            SVGData.nodes[node].highlight = false
        }
        for (let line in SVGData.lines) {
            SVGData.lines[line].highlight = false
        }
    }

    /* 
    选中并将视图移动到指定节点上
    id: 节点的ID，不带node_前缀
    */
    moveToNode(id) {
        let element = elementById('node_' + id)
        if (element == null) {
            return
        }

        let node = new SVGNode('node_' + id, SVGData.classId)
        this.selectAtNode(node)

        let leftOffset = element.getBoundingClientRect().left + document.documentElement.scrollLeft
        let topOffset = element.getBoundingClientRect().top + document.documentElement.scrollTop
        
        let elementWidth = element.getBoundingClientRect().width
        let elementHeight = element.getBoundingClientRect().height
        // 将element滚动到可见范围
        window.scrollTo(leftOffset - document.documentElement.clientWidth / 2 - elementWidth / 2, 
                        topOffset - document.documentElement.clientHeight / 2 - elementHeight / 2)
    }

    // 放大不能超过原始尺寸
    zoomBy(scale) {
        if (this.panZoomSvg.getZoom() * scale > 1) {
            scale = 1
        }
        this.panZoomSvg.zoomBy(scale)
    }

    // 退出pick模式
    clearPickedNodes() {
        this.pickedNodes = []
    }

    // ============================
    // SVG内部交互逻辑
    // ============================

    // 点击一个节点，SVGNode
    selectAtNode(node) {
        if (!node) {
            console.log('点击的节点不存在')
            return
        }

        // 通过一个闭包通知上层
        if (this.onClickNode && typeof this.onClickNode === 'function') {
            this.onClickNode(node);
        }

        if (store.state.isPickMode) { // Pick模式
            console.log('pick ' + node.id)
            let index = this.pickedNodes.indexOf(node)
            if (index >= 0) {
                // 取消选中
                this.pickedNodes.splice(index, 1)
                node.highlight = false
            } else {
                // 选中节点
                this.pickedNodes.push(node)
                node.highlight = true
            }
        } else { // 普通模式
            // 高亮所选的节点以及相关节点
            Handler.deselectedAll()
            node.highlight = true
            node.pointToLines().map((line) => {
                line.highlight = true
            })
            node.pointToNodes().map((node) => {
                node.highlight = true
            })
        }
    }
}

// 公用的SVGHandler的单例对象
const Handler = new SVGHandler()

export {
    SVGHandler,
    Handler
}