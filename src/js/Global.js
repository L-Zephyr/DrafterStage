// 包含所有Class的字典全局变量，key值为id
const ClassMap = (() => {
    let map = {}
    for (let clsItem of DrafterData) {
        // 忽略掉没有方法的class
        if (Object.getOwnPropertyNames(clsItem.methods).length == 0) {
            continue
        }

        // 将Class节点数组转化成 id : class 的字典
        if (clsItem.type == 'class') {
            map[clsItem.id] = clsItem
        }
    }
    return map
})()

/* 
获取所有的类型字典
*/
const getAllClass = () => {
    return ClassMap
}

/* 
根据ID获取指定类型
classId：类型的ID
*/
const getClass = (classId) => {
    return ClassMap[classId]
}

/* 
根据名字来获取类型的详细信息
className: 类型的名字
*/
const getClassForName = (className) => {
    let result = undefined
    // 根据classname查找classid
    for (let clsKey in ClassMap) {
        let cls = ClassMap[clsKey]
        if (cls.name == className) {
            result = cls
            break
        }
    }
    return result
}

/* 
获取指定类型中的方法
classId: 类型Id
methodId: 方法Id
*/
const getMethod = (classId, methodId) => {
    return ClassMap[classId].methods[methodId]
}

export {
    ClassMap,
    getAllClass,
    getClass,
    getMethod,
    getClassForName
}