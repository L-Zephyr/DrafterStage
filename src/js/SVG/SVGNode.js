import {
    SVGBase,
    SVGData,
    groupById
} from './SVGBase'
import SVGLine from './SVGLine'

// 表示一个节点
export default class SVGNode extends SVGBase {
    /* 
    id: 节点ID, 带'node_'前缀
    clsId: 该方法所在类型的ID
    */
    constructor(id, clsId) {
        super(id)
        this.classId = clsId
    }

    /**
     * 获取该节点上的文字
     * @returns {string}
     */
    title() {
        let text = groupById(this.id).querySelector('text')
        if (text) {
            return text.innerHTML
        }
        return null
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

    /**
     * 获取该节点指向的其他节点
     * @returns {SVGNode[]}
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
        let lines = [];
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
        let nodes = [];
        for (let line of lines) {
            nodes.push(line.from);
        }
        return nodes;
    }

    // 在左上角添加指定文字的角标
    addCornerMark(content, bgColor = 'white') {
        let node = groupById(this.id)
        // 1. 获取该节点矩形各个点的坐标
        let posAtt = SVGData.svgRoot.querySelector(`#${this.id}>polygon`).attributes.points.value
        // points有五个值，依次为: bottomLeft -> topLeft -> topRight -> bottomRight -> bottomLeft 的坐标
        let points = posAtt.split(' ').map(string => {
            let pos = string.split(',')
            return {
                'x': pos[0],
                'y': pos[1]
            }
        })

        // 2. 添加背景的矩形
        let rect = document.createElementNS("http://www.w3.org/2000/svg", 'rect'); //Create a path in SVG's namespace
        rect.setAttribute('id', `${this.id}_corner_bg`)
        rect.setAttribute('x', Number(points[1].x) + 0.5)
        rect.setAttribute('y', Number(points[1].y) + 0.5)
        rect.setAttribute('height', 10)
        rect.style.stroke = "black";
        rect.style.fill = bgColor
        rect.style.strokeWidth = "0.5px";
        node.appendChild(rect)

        // 3. 添加文字
        let text = document.createElementNS("http://www.w3.org/2000/svg", 'text')
        text.setAttribute('id', `${this.id}_corner_text`)
        text.setAttribute('font-size', 9)
        text.setAttribute('text-anchor', 'start')
        text.setAttribute('font-family', 'bold Menlo, Monaco')
        text.setAttribute('fill', 'black')
        text.setAttribute('x', Number(points[1].x) + 2)
        text.setAttribute('y', Number(points[1].y) + 8)
        text.textContent = content
        node.appendChild(text)

        // width
        rect.setAttribute('width', text.getBBox().width + 4)
    }

    // 移除左上角的标记
    removeCornerMask() {
        let node = groupById(this.id)
        let rect = node.querySelector(`#${this.id}_corner_bg`)
        let text = node.querySelector(`#${this.id}_corner_text`)
        if (rect) {
            rect.remove()
        }
        if (text) {
            text.remove()
        }
    }
}