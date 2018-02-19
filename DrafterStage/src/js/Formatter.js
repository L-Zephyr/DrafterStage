// 将方法格式化成字符串表示
/* 数据格式：
{
    "type": "method",
    "classId": "clsid1", // 所在类型的id
    "static": true, // 是否为静态方法
    "name": "methodA", // 方法名, OC没有这个字段
    "params": [
        {
            "type": "Int", // 参数类型
            "sel": "addB", // 参数名
            "name": "b", // 方法中对应的变量名
        }
    ],
    "returnType": "void", // 返回值类型
    "id": "methodaid", // 方法唯一的ID
    "invokes": [{ // 方法中调用的其他方法n
        "methodId": "methodbid", // 方法的id
        "classId": "clsid", // 方法所在class的id，无法获取则为空
    }],
}
*/
const formateMethod = (method) => {
    let formated = ""
    if (method.isSwift) { // Swift
        if (method.static) {
            formated += 'static '
        }
        formated += 'func '                 // func
        formated += method.name             // method
        formated += '('                     // (

        let paramStr = method.params.map((param) => {
            return param.sel + ' ' + param.name + ' :'
        }).join(", ")
        formated += paramStr

        formated += ')'                         // )
        formated += '->' + method.returnType    // -> type    
    } else { // Objective-C
        if (method.static) {
            formated += '+'
        } else {
            formated += '-'
        }
        formated += '['                                // [

        let paramStr = method.params.map((param) => {
            let str = param.sel
            if (param.type && param.type.length > 0) {
                str += ':' // 参数不显示具体类型
            }
            return str
        }).join(' ')
        formated += paramStr

        formated += ']'                               // ]
    }

    return formated
}

export {
    formateMethod
}
