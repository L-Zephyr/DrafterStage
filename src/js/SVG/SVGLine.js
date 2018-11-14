import {
    SVGBase,
    SVGData,
    groupById
} from './SVGBase'
import SVGNode from './SVGNode'

// 表示一条连线
export default class SVGLine extends SVGBase {
    /**
     * 两个节点之间的连接线
     * @param {string} id 连线的ID，带'line_'前缀
     * @param {SVGNode} from 起始节点
     * @param {SVGNode} to 指向的节点
     */
    constructor(id, from, to) {
        super(id)
        this.from = from; // SVGNode类型，起始节点
        this.to = to; // SVGNode类型，结束节点
    }
}