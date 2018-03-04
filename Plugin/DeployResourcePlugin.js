const fs = require('fs')
const os = require('os')
const path = require('path')

function DeployResourcePlugin(options) {

}

function copyFile(from, to) {
    fs.createReadStream(from).pipe(fs.createWriteStream(to))
}

// recursive rmdir
function rmdir(dir) {
    var list = fs.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
        var filename = path.join(dir, list[i]);
        var stat = fs.statSync(filename);

        if (filename == "." || filename == "..") {
            // pass these files
        } else if (stat.isDirectory()) {
            // rmdir recursively
            rmdir(filename);
        } else {
            // rm fiilename
            fs.unlinkSync(filename);
        }
    }
    fs.rmdirSync(dir);
};

// 编译完成后将结果文件拷贝到 ~/.drafter 文件夹中
DeployResourcePlugin.prototype.apply = function (compiler) {
    compiler.plugin('after-emit', function (compilation, callback) {
        let bundlePath = './public/bundle.js'
        let htmlPath = './public/index.html'
        
        let targetDir = os.homedir() + '/.drafter' // 目标文件夹
        let targetHtml = targetDir + '/index.html'
        let targetJs = targetDir + '/bundle.js'

        if (fs.existsSync(targetDir)) {
            rmdir(targetDir)
        }

        fs.mkdirSync(targetDir)
        copyFile(htmlPath, targetHtml)
        copyFile(bundlePath, targetJs)

        callback()
    })
}

module.exports = DeployResourcePlugin