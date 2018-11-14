import PanZoomSvg from 'svg-pan-zoom'
import SVGNode from './SVGNode'
import SVGLine from './SVGLine'
import store from '../../store/index'
import {
    SVGData,
    groupById
} from './SVGBase'
import * as SVGGenerator from './SVGGenerator'
import * as Global from '../Global'

// 获取访问等级对应的颜色
const getAccessLevelColor = (level) => {
    if (level == 'private' || level == 'fileprivate') {
        return 'white'
    } else if (level == 'internal') {
        return '#ffffca'
    } else if (level == 'public' || level == 'open') {
        return '#e2ffe3'
    }
    return 'white'
}

// 用来处理SVG相关事件的类型
class SVGHandler {
    /**
     * 
     * @param {function(SVGNode):void} onClickNode - 点击节点回调
     * @param {function():void} onUpdateContent - 用于Handler主动触发SVG面板的刷新
     * @param {PanZoomSvg} panZoomSvg - 控制缩放svg
     * @param {SVGNode[]} pickedNodes - 限制显示指定的node，空表示不做限制
     */
    constructor(onClickNode, onUpdateContent, panZoomSvg, pickedNodes) {
        this.onClickNode = onClickNode; // 响应点击事件, 外部传入，回调参数：SVGNode
        this.onUpdateContent = onUpdateContent
        this.panZoomSvg = panZoomSvg
        this.pickedNodes = [] // pick模式中选中的节点, [SVGNode]

        // 响应pick模式
        store.watch(state => state.isPickMode, (newVal, oldVal) => {
            if (newVal) {
                this.pickedNodes = []
                this.deselectedAll()
            }
        })

        // 显示/隐藏访问等级
        store.watch(state => state.showAccessLevel, (show, oldVal) => {
            this.showAccessLevel(show)
        })
    }

    // ============================
    // 对外公共接口
    // ============================

    /**
     * 生成方法调用图
     * @returns {string} - SVG代码
     */
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
            console.log('No SVG Element found!')
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

        // 设置访问等级标签
        this.showAccessLevel(store.state.showAccessLevel)

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
        let element = groupById('node_' + id)
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

    /**
     * 点击一个节点, 将该节点以及子节点高亮
     * @param {SVGNode} node 
     */
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

    // 显示/隐藏访问控制
    showAccessLevel(show) {
        if (show && store.state.callGraphMode) { // 显示方法的访问等级
            let cls = Global.getClass(store.getters.currentClassId)
            if (!cls) {
                return
            }
            for (let index in SVGData.nodes) {
                let node = SVGData.nodes[index]
                let method = cls.methods[node.id.substring(5)]
                if (!method) {
                    continue
                }
                let accessLevel = method.accessControl
                if (accessLevel) {
                    node.addCornerMark(accessLevel, getAccessLevelColor(accessLevel)) // 添加角标
                }
            }
        } else { // 隐藏
            for (let index in SVGData.nodes) {
                SVGData.nodes[index].removeCornerMask()
            }
        }
    }

    /**
     * 仅显示该节点及其子节点
     * @param {SVGNode} node 节点
     * @param {boolean} recursive - 是否包含所有后代节点
     */
    pickCallees(node, recursive = false) {
        // 获取所有后代节点
        let nodeSet = new Set([])
        let descendantsNodes = (node) => {
            if (nodeSet.has(node)) { // 防止死循环
                return []
            }

            let children = node.pointToNodes()
            let descends = [node]
            nodeSet.add(node)
            for (let child of children) {
                descends = descends.concat(descendantsNodes(child))
            }
            return descends
        }
        
        if (recursive) {
            this.pickedNodes = descendantsNodes(node) // 递归获取所有后代节点
        } else {
            this.pickedNodes = [node].concat(node.pointToNodes()) // 只获取第一层的子节点
        }
        this.onUpdateContent()
    }

    /**
     * 筛选父节点
     * @param {SVGNode} node 当前节点
     * @param {boolean} recursive 是否递归筛选所有祖先节点
     */
    pickCallers(node, recursive = false) {
        let nodeSet = new Set([])
        let ancestorsNodes = (node) => {
            if (nodeSet.has(node)) { // 防止死循环
                return []
            }

            let parents = node.pointedNodes()
            let ancestors = [node]
            nodeSet.add(node)
            for (let parent of parents) {
                ancestors = ancestors.concat(ancestorsNodes(parent))
            }
            return ancestors
        }

        if (recursive) {
            this.pickedNodes = ancestorsNodes(node)
        } else {
            this.pickedNodes = [node].concat(node.pointedNodes())
        }
        this.onUpdateContent()
    }
}


// 公用的SVGHandler的单例对象
const Handler = new SVGHandler()

export {
    SVGHandler,
    Handler
}