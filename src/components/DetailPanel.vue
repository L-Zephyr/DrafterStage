<template>
    <div :class="panelClass" class="detail-panel-hidden">
        <ul class="detail-list">
            <li><p class="title">Class</p></li>
            <li><p class="class-name">{{className}}</p></li>

            <li><p class="title">Parameters</p></li>
            <li v-if="parameters.length == 0" class="unable">None</li>
            <li 
                v-for="param in parameters"
                :key="param.id"
            >
                <div class="param-item">
                    <span class="param-tag">TYPE:</span> {{param.type}} <br>
                    <span class="param-tag">NAME:</span> {{param.name}} 
                </div>
            </li>

            <li><p class="title">Invokes</p></li>
            <li v-if="invokes.length == 0" class="unable">None</li>
            <li
                v-for="invoke in invokes"
                :key="invoke.id"
                @click="clickInvokeMethod(invoke)"
            >
                <div class="invoke-item">
                    {{invoke.name}}
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

/* 
    事件：invokeMethodSelected(methodId) 选择某个被调用的方法
*/
export default {
    props: [
        'selectedNode', // SVGNode，当前选中的节点
        'selfOnly', // 是否只显示内部方法
        ],

    data () {
        return {
            panelClass: "detail-panel-hidden", 
            methodData: {}, // 当前选中method节点的数据
            classId: undefined, // 类型ID
        }
    },

    methods: {
        // 更新节点详情, SVGNode
        updateDetailContent(node) {
            if (!node instanceof SVGNode) {
                throw TypeError('Request SVGNode type!')
            }
            let methodId = node.id.substring(5) // 去掉node_前缀
            let clsId = node.classId // 类型ID
            this.methodData = Global.getMethod(clsId, methodId)
            this.classId = clsId
        },

        // 点击调用的方法
        clickInvokeMethod(invoke) {
            Handler.moveToNode(invoke.methodId)
        },
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
                        methodId: 'D' + MD5(invoke.formatedName)
                    })
                } else {
                    let invokeMethod = Global.getMethod(invoke.classId, invoke.methodId)
                    invokes.push({
                        name: Formatter.formateMethod(invokeMethod),
                        classId: invoke.classId,
                        methodId: invoke.methodId,
                    })
                }
            }
            return invokes
        }
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
    border: 1px solid @highlight-color;
    padding: 5px 5px 5px 5px;
    margin-top: 5px;
    margin-bottom: 5px;
    border-radius: 5px;
    word-break: break-all;
    cursor: pointer;
}

.invoke-item:hover {
    border: 1px solid @tag-color;
}

</style>
