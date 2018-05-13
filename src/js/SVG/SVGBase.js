// 根据id获取g标签
const elementById = (id) => {
    return SVGData.svgRoot.querySelector("g[id=" + id + "]")
}

// SVG数据
let SVGData = {
    svgRoot: undefined, // SVG的根元素, SVGElement
    classId: undefined, // 当前类型的ID 
    nodes: {}, // 保存所有的节点，id : SVGNode
    lines: {}, // 保存所有连线，id : SVGLine
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

export {
    SVGBase,
    elementById,
    SVGData
}