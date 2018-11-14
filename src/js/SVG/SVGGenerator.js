import * as Global from '../Global.js';
import Viz from 'viz.js';
import * as Formatter from '../Formatter.js';
import MD5 from 'crypto-js/md5'
import { SVGData } from './SVGBase'

/*
    options: {
        selfOnly: Bool, // 只展示相同类中的方法
        keywords: Array<String>, // 关键字过滤
        caseSensitive: Bool // 大小写敏感
    }
*/
// 默认配置
const DefaultOptions = {
    selfOnly: true, 
    keywords: [],
    caseSensitive: false,
    specifyIds: [], // 仅显示特定id的节点，为空则表示无限制，在类图模式中表示类型的id，在调用图模式中表示方法id
}

/**
 * @typedef {object} Options - 选项
 * @property {boolean} selfOnly
 * @property {boolean} keywords
 * @property {boolean} caseSensitive
 * @property {string[]} specifyIds - 仅显示指定id的节点
 */

/**
 * 合并选项
 * @param {Options} options 选项
 */
function mergeOptions(options) {
    let opts = options
    if (opts === undefined) {
        opts = DefaultOptions
    }

    if (opts.selfOnly === undefined) opts.selfOnly = DefaultOptions.selfOnly
    if (opts.keywords === undefined) opts.keywords = DefaultOptions.keywords
    if (opts.caseSensitive === undefined) opts.caseSensitive = DefaultOptions.caseSensitive
    if (opts.specifyIds === undefined) opts.specifyIds = DefaultOptions.specifyIds
    return opts
}

/**
 * 生成指定类型的方法调用图SVG
 * @param {string} clsId - 类型id
 * @param {Options} options - 选项
 */
function generateCallGraphForClass(clsId, options) {
    options = mergeOptions(options)
    let cls = Global.getClass(clsId)
    if (cls !== undefined) {
        console.log(`Class: ${cls.name}, methods count: ${Object.keys(cls.methods).length}`);
        let generator = new CallGraphGenerator(cls.methods, options)
        let dot = generator.generate()
        return generateSVG(dot)
    } else {
        return null
    }
}

/**
 * 生成类图的SVG
 * @param {Options} options - 选项
 */
function genereateClassMap(options) {
    options = mergeOptions(options)
    let generator = new InheritGraphGenerator(Global.getAllClass(), options)
    let dot = generator.generate()
    return generateSVG(dot)
}

/**
 * 根据dot语言生成SVG
 * @param {string} dot dot代码
 */
function generateSVG(dot) {
    let html = Viz(dot, {
        format: "svg",
        engine: "dot"
    })
    return html
}

// ------------ Class ----------------

// 根据方法的信息生成dot
class DotGenerator {
    constructor(options) {
        this.dot = ""
        this.options = options
        this.nodes = new Set() // 所有的节点ID
        this.lines = new Set() // 所有的连线ID
    }

    // 检查节点是否存在
    hasNode(nodeId) {
        return this.nodes.has('node_' + nodeId)
    }

    // 检查指定两个节点之间是否存在连线
    hasLink(fromId, toId) {
        let line = 'line_' + fromId + '_' + toId
        return this.lines.has(line)
    }

    // 生成dot
    generate() {
        throw TypeError("Shoule be implement at subclass!")
    }

    begin(name = "") {
        this.dot += "digraph " + name + " { bgcolor=\"transparent\";node[style=\"filled\",fillcolor=\"transparent\",fill=\"transparent\",shape=\"record\"];"
    }

    end() {
        this.dot += "}"
    }

    // 添加节点，参数为String类型，节点的ID带有node_前缀
    addNode(text, id) {
        // 是否在指定节点中
        if (this.options.specifyIds.length > 0 && this.options.specifyIds.indexOf(id) < 0) {
            return
        }
        text = text.replace(new RegExp('>', 'g'), '\\>')
        text = text.replace(new RegExp('<', 'g'), '\\<')
        text = text.replace(new RegExp('->', 'g'), '\\-\\>')

        let nodeId = 'node_' + id
        if (this.nodes.has(nodeId)) {
            return
        }
        this.nodes.add(nodeId)
        this.dot += id + '[id=' + nodeId + ',label="' + text + '"];'
    }

    // 添加连线，参数为method的对象，连线的ID带有line_前缀
    link(fromId, toId, style="") {
        // 只能连接存在的节点
        if (!this.hasNode(fromId) || !this.hasNode(toId)) {
            return
        }

        let line = 'line_' + fromId + '_' + toId
        if (this.lines.has(line)) { // 不能重复添加连线
            return
        }
        this.lines.add(line)
        this.dot += `${fromId}->${toId}[id="${line}",${style}]`
    }
}

// 生成方法调用图
class CallGraphGenerator extends DotGenerator {
    constructor(methods, options) {
        super(options)
        this.methods = methods // [String: JSON], key为方法的id 
    }

    generate() {
        this.begin("CallGraph")

        let isUsable = (id) => {
            if (this.options.specifyIds.length > 0) {
                if (this.options.specifyIds.indexOf(id) >= 0) {
                    return true
                }
                return false
            }
            return true
        }

        // 添加Class内部的方法节点
        for (let methodKey in this.methods) {
            let method = this.methods[methodKey]
            this.addNode(Formatter.formateMethod(method), method.id)
        }
        
        // 处理节点的方法调用
        for (let methodKey in this.methods) {
            let method = this.methods[methodKey]
            let fromId = method.id
            for (let key in method.invokes) {
                let invoke = method.invokes[key]
                if (invoke.methodId) { // 调用的是一个class内部方法
                    if (isUsable(invoke.methodId) && this.hasNode(invoke.methodId)) {
                        this.link(fromId, invoke.methodId)
                    }
                } else if (invoke.formatedName) { // 调用的是外部方法
                    // 添加外部方法节点
                    let name = invoke.formatedName
                    let toId = 'D' + MD5(name) // 防止md5后的值以数字开头
                    this.addNode(name, toId)
                    this.link(fromId, toId)
                } else {
                    throw "错误: 缺少formatedName字段!"
                }
            }
        }
        this.end()
        return this.dot
    }

    addNode(text, id) {
        if (this.validate(text, id)) {
            super.addNode(text, id)
        }
    }

    // 节点过滤
    validate(text, nodeId) {
        let valid = true
        // 过滤内部方法
        if (valid && this.options.selfOnly) {
            valid = nodeId in this.methods
        }
        // 关键字过滤
        if (valid && this.options.keywords.length > 0) {
            valid = false
            if (this.options.caseSensitive) {
                text = text.toLowerCase()
            }
            for (let keyword of this.options.keywords) {
                if (text.match(new RegExp(keyword.toLowerCase())).length > 0) {
                    valid = true
                }
            }
        }
        return valid
    }
}

// 生成类图
class InheritGraphGenerator extends DotGenerator {
    constructor(classList, options) {
        super(options)
        this.classList = classList
    }

    generate() {
        this.begin("inheritance")

        for (let key in this.classList) {
            let cls = this.classList[key]
            if (cls.type == "class") {
                // 添加class节点
                let nodeId = "cls" + MD5(cls.name)
                this.addNode(cls.name, nodeId)  // 用md5加上cls标识作为id

                // 添加protocol节点和连线
                for (let proKey in cls.protocols) {
                    let protocol = cls.protocols[proKey]
                    let protoId = "pro" + MD5(protocol.name)
                    this.addNode("<<protocol>>\\n" + protocol.name, protoId)
                    this.link(nodeId, protoId, "arrowhead=empty style=dashed")
                }

                // 添加superClass节点
                if (cls.super !== undefined && cls.super.length > 0) {
                    let superId = "cls" + MD5(cls.super)
                    this.addNode(cls.super, superId)
                    this.link(nodeId, superId, "arrowhead=empty")
                }
            }
        }

        this.end()
        return this.dot
    }
}

export {
    generateCallGraphForClass,
    genereateClassMap
}