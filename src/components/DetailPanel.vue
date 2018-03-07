<template>
    <div :class="panelClass" class="detail-panel-hidden">
        <ul class="detail-list">
            <li><p class="title">Class</p></li>
            <li><p class="class-name">{{className}}</p></li>

            <li><p class="title">{{isInheritMode ? 'Super Class' : 'Parameters'}}</p></li>
            <li v-if="paramtersOrSuper.length == 0" class="unable">None</li>
            <li 
                v-for="data in paramtersOrSuper"
                :key="data.id"
            >
                <!-- 方法调用图模式 -->
                <div class="param-item" v-if="!isInheritMode">
                    <span class="param-tag">TYPE:</span> {{data.type}} <br>
                    <span class="param-tag">NAME:</span> {{data.name}} 
                </div>
                <!-- 类图模式 -->
                <div :class="['param-item', 'clickable']" @click="clickListItem(data)" v-else>
                    {{data.name}}
                </div>
            </li>

            <li><p class="title">{{isInheritMode ? 'Protocols' : 'Invokes'}}</p></li>
            <li v-if="invokesOrProtocols.length == 0" class="unable">None</li>
            <li
                v-for="data in invokesOrProtocols"
                :key="data.id"
                @click="clickListItem(data)"
            >
                <div :class="['invoke-item', 'clickable']">
                    {{data.name}}
                </div>
            </li>
        </ul>
    </div>
</template>

<script>

import {
    SVGHandler,
    SVGLine,
    SVGNode,
    Handler
} from '../js/SVGHandler'
import * as Global from '../js/Global.js'
import * as Formatter from '../js/Formatter.js'
import MD5 from 'crypto-js/md5'

export default {
    props: [
        'selectedNode', // SVGNode，当前选中的节点
        'selfOnly', // 是否只显示内部方法
        "isInheritMode", // 是否为类图模式
        ],

    data () {
        return {
            panelClass: "detail-panel-hidden", 
            methodData: {}, // 当前选中节点的数据，method或class
            classId: undefined, // 类型ID
        }
    },

    methods: {
        // 更新节点详情, SVGNode
        updateDetailContent(node) {
            if (!node instanceof SVGNode) {
                throw TypeError('Request SVGNode type!')
            }

            if (!this.isInheritMode) { // 方法调用图模式
                let clsId = node.classId // 类型ID
                let methodId = node.id.substring(5) // 去掉node_前缀
                this.methodData = Global.getMethod(clsId, methodId)
                this.classId = clsId
            } else if (node.title()) { // 类图模式
                let cls = Global.getClassForName(node.title())
                if (cls) {
                    this.classId = cls.id
                } else {
                    this.panelClass = 'detail-panel-hidden'
                }
            }
        },

        // 点击列表中的选项
        clickListItem(invoke) {
            Handler.moveToNode(invoke.id)
        },

        // 方法参数的数组, Array<{name:, type:}>
        parameters() {
            if (this.methodData === undefined) {
                return []
            }

            let params = new Array()
            for (let key in this.methodData.params) {
                let param = this.methodData.params[key]
                if (param.sel && param.type) {
                    params.push({
                        name: param.sel,
                        type: param.type
                    })
                }
            }
            return params
        },

        // 调用的方法数组, Array<{name:}>
        invokes() {
            if (this.methodData === undefined) {
                return []
            }

            let invokes = new Array()
            for (let key in this.methodData.invokes) {
                let invoke = this.methodData.invokes[key]
                if (invoke.formatedName) {
                    if (this.selfOnly) {
                        continue
                    }
                    invokes.push({
                        name: invoke.formatedName,
                        id: 'D' + MD5(invoke.formatedName)
                    })
                } else {
                    let invokeMethod = Global.getMethod(invoke.classId, invoke.methodId)
                    invokes.push({
                        name: Formatter.formateMethod(invokeMethod),
                        id: invoke.methodId,
                    })
                }
            }
            return invokes
        },

        // 父类
        superClass() {
            let cls = Global.getClass(this.classId)
            if (!cls) {
                return []
            }

            let superCls = cls.super
            if (!superCls || superCls.length == 0) {
                return []
            }

            let superId = "cls" + MD5(superCls)
            return [{
                name: superCls,
                id: superId
            }]
        },

        // 协议数组
        protocols() {
            let cls = Global.getClass(this.classId)
            if (!cls) {
                return []
            }

            let protocols = new Array()
            for (let key in cls.protocols) {
                let protocol = cls.protocols[key]
                protocols.push({
                    name: protocol.name,
                    id: "pro" + MD5(protocol.name)
                })
            }
            return protocols
        }
    },

    watch: {
        // 改变选中的节点，node为null表示未选中任何节点
        selectedNode(node) {
            if (node != null) {
                console.log('显示详情面板')
                this.panelClass = 'detail-panel-show'
                this.updateDetailContent(node)
            } else {
                console.log('隐藏详情面板')
                this.panelClass = 'detail-panel-hidden'
            }
        },
    },

    computed: {
        // 当前选中的类型名
        className() {
            if (!this.classId || !this.methodData) {
                return "Unkown"
            }
            return Global.getClass(this.classId).name // 类型名
        },

        paramtersOrSuper() {
            if (this.isInheritMode) {
                return this.superClass()
            } else {
                return this.parameters()
            }
        },

        invokesOrProtocols() {
            if (this.isInheritMode) {
                return this.protocols()
            } else {
                return this.invokes()
            }
        },
    }
}
    
</script>

<style scoped lang="less">

@import '../style/common.less';

* {
    font-family: Menlo, Monaco, 'Courier New', monospace;
}

.detail-panel-hidden {
    border-left: 1px solid @separator-color;
    background-color: white;
    overflow-y: auto;
    width: 300px;
    position: fixed;
    top: 0px;
    bottom: 0px;
    right: -300px;
    opacity: 0;
    transition: 0.25s right, 0s 0.25s opacity;
}

.detail-panel-show {
    right: 0px;
    opacity: 1;
    transition: 0.25s right;
}

.detail-list {
    padding: 50px 15px 0 15px;
    list-style: none;
    vertical-align: top;
    width: 250px;
    height: 100%;
}

.title {
    color: black;
    font-weight: bold;
    font-size: 20px;
}

.unable {
    color: @disable-color;
}

.class-name {
    color: @class-name-color;
    word-wrap: break-word;
}

.param-item {
    border-radius: 5px;
    background-color: @highlight-color;
    padding: 5px 5px 5px 5px;
    margin-top: 5px;
    margin-bottom: 5px;
    word-break: break-all;
}

.param-tag {
    background-color: @tag-color;
    border-radius: 5px;
    color: white;
    font-family: Courier, monospace;
    border-radius: 2px;
    padding: 0px 5px 0px 5px;
}

.invoke-item {
    background-color: @highlight-color;
    padding: 5px 5px 5px 5px;
    margin-top: 5px;
    margin-bottom: 5px;
    border-radius: 5px;
    word-break: break-all;
}

.invoke-item:hover {
    border: 1px solid @tag-color;
}

.clickable {
    border: 1px solid @highlight-color;
    cursor: pointer;
}

.clickable:hover {
    border: 1px solid @tag-color;
}

</style>
