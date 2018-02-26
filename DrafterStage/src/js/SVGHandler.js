import PanZoomSvg from 'svg-pan-zoom'

// SVG数据
let SVGData = {
    svgRoot: undefined, // SVG的根元素, SVGElement
    classId: undefined, // 当前类型的ID 
    nodes: {}, // 保存所有的节点，id : SVGNode
    lines: {}, // 保存所有连线，id : SVGLine
}

// 根据id获取g标签
const elementById = (id) => {
    return SVGData.svgRoot.querySelector("g[id=" + id + "]")
}

// 用来处理SVG相关事件的类型
class SVGHandler {
    constructor() {
        this.onClickNode = undefined; // 响应点击事件, 外部传入，回调参数：SVGNode
        this.panZoomSvg = undefined
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
                    console.log('点击节点' + node.id)
                    if (this.onClickNode && typeof this.onClickNode === 'function') {
                        this.onClickNode(node);
                    }
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
        // this.deselectedAll()
        let node = new SVGNode('node_' + id, SVGData.classId)
        // node.isHighlight = true
        if (this.onClickNode && typeof this.onClickNode === 'function') {
            this.onClickNode(node);
        }

        console.log('移动到节点 ' + node)

        // TODO: 将SVG的中心移动到选择的节点上
        let element = elementById('node_' + id)

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
}

// SVG元素
class SVGBase {
    constructor(id) {
        this.id = id; // ID
        this.isHighlight = false // 是否被高亮 
    }

    get highlight() {
        return this.isHighlight
    }

    // 设置高亮/普通状态下的颜色
    set highlight(hl) {
        this.isHighlight = hl
        if (hl) {
            this.strokeColor('blue')
        } else {
            this.strokeColor('black')
        }
    }

    // 改变节点边框的颜色
    strokeColor(color) {
        let element = elementById(this.id)
        if (!element) {
            throw '未找到节点:' + this.id
            return
        }

        for (let child of element.querySelectorAll('*')) {
            if (typeof child.setAttribute === 'function') {
                if (child.tagName == 'text') {
                    child.setAttribute('fill', color)
                } else {
                    child.setAttribute('stroke', color)
                }
            }
        }
    }
}

// 表示一个节点
class SVGNode extends SVGBase {
    /* 
    id: 节点ID, 带'node_'前缀
    clsId: 该方法所在类型的ID
    title: 节点的文本
    */
    constructor(id, clsId) {
        super(id)
        this.classId = clsId
    }

    /* 
    获取该节点指向其他节点的连线, 返回 Array<SVGLine>
    */
    pointToLines() {
        let id = this.id.split('_')[1];
        let lines = new Array();
        let elements = SVGData.svgRoot.querySelectorAll('g[id^=line_' + id + "_]");
        for (let element of elements) {
            let line = new SVGLine();
            let [type, from, to] = element.id.split('_');
            line.id = element.id;
            line.from = SVGData.nodes['node_' + from];
            line.to = SVGData.nodes['node_' + to];

            lines.push(line);
        }

        return lines;
    }

    /* 
    获取该节点指向的其他节点， 返回 Array<SVGNode>
    */
    pointToNodes() {
        let lines = this.pointToLines();
        let nodes = new Array();
        for (let line of lines) {
            nodes.push(line.to);
        }
        return nodes;
    }

    // 其他节点指向该节点的连线
    pointedLines() {
        let id = this.id.split('_')[1];
        let lines = new Array();
        let elements = SVGData.svgRoot.querySelectorAll('g[id*=_' + id + ']');
        for (let element of elements) {
            let line = new SVGLine();
            let [type, from, to] = element.id.split('_');
            line.id = element.id;
            line.from = SVGData.nodes['node_' + from];
            line.to = SVGData.nodes['node_' + to];

            lines.push(line);
        }

        return lines;
    }

    // 指向该节点的其他节点
    pointedNodes() {
        let lines = this.pointedLines();
        let nodes = new Array();
        for (let line of lines) {
            nodes.push(line.from);
        }
        return nodes;
    }
}

// 表示一条连线
class SVGLine extends SVGBase {
    /* 
    id: 连线的ID，带'line_'前缀
    from: 起始节点，SVGNode
    to: 结束节点，SVGNode
    */
    constructor(id, from, to) {
        super(id)
        this.from = from; // SVGNode类型，起始节点
        this.to = to; // SVGNode类型，结束节点
    }
}

// 公用的SVGHandler的单例对象
const Handler = new SVGHandler()

export {
    SVGHandler,
    SVGLine,
    SVGNode,
    Handler
}
