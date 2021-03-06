<template>
    <div :class="panelClass" class="detail-panel-hidden">
        <ul class="detail-list">
            <!-- 类型名称 -->
            <li>
                <p class="title">Class</p>
            </li>
            <li>
                <p class="class-name">{{className}}</p>
            </li>

            <!-- 参数名或父类名 -->
            <li>
                <p class="title">{{callGraphMode ? 'Parameters' : 'Super Class'}}</p>
            </li>
            <li v-if="paramtersOrSuper.length == 0" class="unable">None</li>
            <li v-for="data in paramtersOrSuper" :key="data.id">
                <!-- 方法调用图模式 -->
                <div class="param-item" v-if="callGraphMode">
                    <span class="param-tag">TYPE:</span> {{data.type}} <br>
                    <span class="param-tag">NAME:</span> {{data.name}}
                </div>
                <!-- 类图模式 -->
                <div :class="['param-item', 'clickable']" @click="clickListItem(data.id)" v-else>
                    {{data.name}}
                </div>
            </li>

            <!-- 访问等级 -->
            <li v-show="accessControlLevel !== null">
                <p class="title">Access Level</p>
            </li>
            <li v-show="accessControlLevel !== null">
                <p class="class-name">{{accessControlLevel}}</p>
            </li>

            <!-- 方法调用或协议 -->
            <li>
                <p class="title">{{callGraphMode ? 'Invokes': 'Protocols'}}</p>
            </li>
            <li v-if="invokesOrProtocols.length == 0" class="unable">None</li>
            <li v-for="data in invokesOrProtocols" :key="data.id" @click="clickListItem(data.id)">
                <div :class="['invoke-item', 'clickable']">
                    {{data.name}}
                </div>
            </li>

            <!-- 高亮方法子节点 -->
            <li><p class="title">Operations</p></li>
            <li><button @click="pickCallees" class="button">Pick Callees</button></li>
            <li><button @click="pickCallers" class="button">Pick Callers</button></li>
            <li><button @click="pickDescendants" class="button"> Pick Descendants</button></li>
            <li><button @click="pickAncestors" class="button">Pick Ancestors</button></li>
        </ul>
    </div>
</template>

<script>
import { SVGHandler, Handler } from "../js/SVG/SVGHandler";
import * as Global from "../js/Global.js";
import * as Formatter from "../js/Formatter.js";
import MD5 from "crypto-js/md5";
import { mapState, mapMutations } from "vuex";
import SVGNode from "../js/SVG/SVGNode";

export default {
    props: [],

    data() {
        return {
            panelClass: "detail-panel-hidden",
            /**
             * 当前选中节点的数据，类图模式下为class，调用图模式下为method
             */
            nodeData: {}, 
            /**
             * 类型Id
             * @type {string}
             */
            classId: undefined
        };
    },

    watch: {
        // 改变选中的节点，node为null表示未选中任何节点
        selectedNode(node) {
            if (node != null) {
                this.panelClass = "detail-panel-show";
                this.updateDetailContent(node);
            } else {
                this.panelClass = "detail-panel-hidden";
            }
        }
    },

    methods: {
        ...mapMutations([
            'SET_IS_PICK_MODE'
        ]),

        /**
         * 更新节点详情
         * @param {SVGNode} node - 节点类型
         */
        updateDetailContent(node) {
            if (!node instanceof SVGNode) {
                throw TypeError("Request SVGNode type!");
            }

            if (this.callGraphMode) {
                // 方法调用图模式
                let clsId = node.classId; // 类型ID
                let methodId = node.id.substring(5); // 去掉node_前缀
                this.nodeData = Global.getMethod(clsId, methodId);
                this.classId = clsId;
            } else if (node.title()) {
                // 类图模式
                let cls = Global.getClassForName(node.title());
                if (cls) {
                    this.classId = cls.id;
                } else {
                    this.panelClass = "detail-panel-hidden";
                }
            }
        },

        /**
         * 筛选当前节点及其子节点
         */
        pickCallees() {
            Handler.pickCallees(this.selectedNode)
        },
        
        /**
         * 筛选当前节点及其所有后代节点
         */
        pickDescendants() {
            Handler.pickCallees(this.selectedNode, true)
        },

        /**
         * 筛选当前节点及其上一层父节点
         */
        pickCallers() {
            Handler.pickCallers(this.selectedNode)
        },

        /**
         * 筛选当前节点及其所有祖先节点
         */
        pickAncestors() {
            Handler.pickCallers(this.selectedNode, true)
        },

        /**
         * 点击列表中的选项
         * @param {string} id - 节点的id
         */
        clickListItem(id) {
            Handler.moveToNode(id);
        },

        /**
         * 方法参数的数组
         * @returns { {name: string, type: string}[] }
         */
        parameters() {
            if (this.nodeData === undefined) {
                return [];
            }

            let params = new Array();
            for (let key in this.nodeData.params) {
                let param = this.nodeData.params[key];
                if (param.sel && param.type) {
                    params.push({
                        name: param.sel,
                        type: param.type
                    });
                }
            }
            return params;
        },

        /**
         * 返回调用的方法数组
         * @returns { {name: string, id: string}[] }
         */
        invokes() {
            if (this.nodeData === undefined) {
                return [];
            }

            let invokes = new Array();
            for (let key in this.nodeData.invokes) {
                let invoke = this.nodeData.invokes[key];
                if (invoke.formatedName) {
                    if (this.selfOnly) {
                        continue;
                    }
                    invokes.push({
                        name: invoke.formatedName,
                        id: "D" + MD5(invoke.formatedName)
                    });
                } else {
                    let invokeMethod = Global.getMethod(
                        invoke.classId,
                        invoke.methodId
                    );
                    invokes.push({
                        name: Formatter.formateMethod(invokeMethod),
                        id: invoke.methodId
                    });
                }
            }
            return invokes;
        },

        /**
         * 父类类型
         * @returns { {name: string, id: string}[] }
         */
        superClass() {
            let cls = Global.getClass(this.classId);
            if (!cls) {
                return [];
            }

            let superCls = cls.super;
            if (!superCls || superCls.length == 0) {
                return [];
            }

            let superId = "cls" + MD5(superCls);
            return [
                {
                    name: superCls,
                    id: superId
                }
            ];
        },

        /**
         * 协议数组
         * @returns { {name: string, id: string}[] }
         */
        protocols() {
            let cls = Global.getClass(this.classId);
            if (!cls) {
                return [];
            }

            let protocols = new Array();
            for (let key in cls.protocols) {
                let protocol = cls.protocols[key];
                protocols.push({
                    name: protocol.name,
                    id: "pro" + MD5(protocol.name)
                });
            }
            return protocols;
        }
    },

    computed: {
        ...mapState(["selfOnly", "callGraphMode", "selectedNode"]),

        /**
         * @return {string} - 当前选中的类型名
         */
        className() {
            if (!this.classId || !this.nodeData) {
                return "Unkown";
            }
            return Global.getClass(this.classId).name; // 类型名
        },

        /**
         * 根据当前模式返回参数列表或是父类
         * @returns { {name: string, type: string}[] }
         */
        paramtersOrSuper() {
            if (!this.callGraphMode) {
                return this.superClass();
            } else {
                return this.parameters();
            }
        },

        /**
         * 根据当前模式返回调用方法或是协议
         * @returns { {name: string, type: string}[] }
         */
        invokesOrProtocols() {
            if (!this.callGraphMode) {
                return this.protocols();
            } else {
                return this.invokes();
            }
        },

        /**
         * 方法的访问等级
         * @returns {string}
         */
        accessControlLevel() {
            if (this.nodeData === undefined || this.nodeData.accessControl === undefined) {
                return null
            }
            let name = this.nodeData.accessControl
            return name.charAt(0).toUpperCase() + name.slice(1); // capitalize
        }
    }
};
</script>

<style scoped lang="less">
@import "../style/common.less";

* {
    font-family: Menlo, Monaco, "Courier New", monospace;
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

.button {
    height: 30px;
    border: 1px solid lightgray;
    border-radius: 3px;
    margin-bottom: 10px;
    outline: none;
}

.button:hover {
    border: 1px solid gray;
    cursor: pointer;
}

</style>
