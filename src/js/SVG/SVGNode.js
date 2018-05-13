import { SVGBase, SVGData, elementById } from './SVGBase'
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

    /* 
    获取该节点上的文字
    */
    title() {
        let text = elementById(this.id).querySelector('text')
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