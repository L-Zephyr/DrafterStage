import {
    SVGBase,
    SVGData,
    groupById
} from './SVGBase'

// 表示一条连线
export default class SVGLine extends SVGBase {
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