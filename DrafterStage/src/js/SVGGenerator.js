import * as Global from './Global.js';
import Viz from 'viz.js';
import * as Formatter from './Formatter.js';
import MD5 from 'crypto-js/md5'

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
    caseSensitive: false
}

// 合并选项
const mergeOptions = (options) => {
    let opts = options
    if (opts.selfOnly === undefined) opts.selfOnly = DefaultOptions.selfOnly
    if (opts.keywords === undefined) opts.keywords = DefaultOptions.keywords
    if (opts.caseSensitive === undefined) opts.caseSensitive = DefaultOptions.caseSensitive
    return opts
}

// 生成指定类型的方法调用图SVG
const generateCallGraphForClass = (clsId, options) => {
    options = mergeOptions(options)
    let cls = Global.getClass(clsId)
    if (cls !== undefined) {
        let generator = new CallGraphGenerator(cls.methods, options)
        let dot = generator.generate()
        return generateSVG(dot)
    } else {
        return null
    }
}

// 生成类图的SVG
const genereateInheritGraph = (options) => {
    options = mergeOptions(options)
    let generator = new InheritGraphGenerator(Global.getAllClass(), options)
    let dot = generator.generate()
    return generateSVG(dot)
}

// 根据dot语言生成SVG
const generateSVG = (dot) => {
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

    begin() {
        this.dot += "digraph { node[style=filled,fillcolor=white,shape=record];"
    }

    end() {
        this.dot += "}"
    }

    // 添加节点，参数为String类型
    addNode(text, id) {
        text = text.replace('>', '\\>')
        text = text.replace('<', '\\<')
        text = text.replace('->', '\\-\\>')

        let nodeId = 'node_' + id
        if (this.nodes.has(nodeId)) {
            return
        }
        this.nodes.add(nodeId)
        this.dot += id + '[id=' + nodeId + ',label="' + text + '"];'
    }

    // 添加连线，参数为method的对象
    link(fromId, toId) {
        // 只能连接存在的节点
        if (!this.hasNode(fromId) || !this.hasNode(toId)) {
            return
        }

        let line = 'line_' + fromId + '_' + toId
        if (this.lines.has(line)) {
            return
        }
        this.lines.add(line)
        this.dot += fromId + '->' + toId + '[id="' + line + '"];'
    }
}

// 生成方法调用图
class CallGraphGenerator extends DotGenerator {
    constructor(methods, options) {
        super(options)
        this.methods = methods
    }

    generate() {
        this.begin()
        // 添加节点
        for (let methodKey in this.methods) {
            let method = this.methods[methodKey]
            this.addNode(Formatter.formateMethod(method), method.id)
        }
        // 处理节点的方法调用
        for (let methodKey in this.methods) {
            let method = this.methods[methodKey]
            let fromId = method.id
            // TODO: 处理其他class中的方法调用
            for (let key in method.invokes) {
                let invoke = method.invokes[key]
                if (invoke.methodId && this.hasNode(invoke.methodId)) {
                    this.link(fromId, invoke.methodId)
                } else if (invoke.formatedName) {
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
        if (this.options.selfOnly) {
            valid = nodeId in this.methods
        }
        // 关键字过滤
        if (this.options.keywords.length > 0 && valid) {
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
        this.begin()

        this.end()
    }
}

export {
    generateCallGraphForClass,
    genereateInheritGraph
}