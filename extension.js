const vscode = require('vscode');
const fs = require('fs')
const MD5 = require('./js-sdk/md5');
const axios = require('axios')

// 这里填开发者的appid
const appid = '20210522000837582';
// 开发者的秘钥
const key = '2R5PWeg6SjlTVGJAtYW0';
const salt = (new Date).getTime();
// // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
const from = 'en';
const to = 'zh';

const pathArr = vscode.workspace.workspaceFolders || [];
// 获取当前工程的根目录
const pathName = pathArr[0].uri.path;
// 生成的文件名称
const fileName = `${pathName.slice(1)}/sultan.md`;
const headerContext = `\n### 单词记录\n| 单词|    汉译| 备注|\n| :-------- | --------:| :--: |`



/**
 * @param {vscode.ExtensionContext} context
 */
function appendWord(data, callback=()=> {}) {
	const url = `http://api.fanyi.baidu.com/api/trans/vip/translate?q=${data.q}&appid=${data.appid}&salt=${data.salt}&from=${data.from}&to=${data.to}&sign=${data.sign}`;
	axios.get(url)
	.then(res=> {
		const { data= {}, status} = res;
		const resultData = data.trans_result[0];
		if(status !== 200) {
			vscode.window.showErrorMessage('翻译出错，请重试')
			return;
		}
		callback(resultData);
		
	})
	.catch((err)=> {
		vscode.window.showErrorMessage(err)
	})
}

function activate(context) {

	let translationAndAppend = vscode.commands.registerTextEditorCommand('memoenglish.translationAndAppend', () => {
		// 获取当前编辑对象
		const editor = vscode.window.activeTextEditor;
		// 获取选中文本
		const selection = editor.selection;
		const selectText = editor.document.getText(selection)
		// 若果选中文本为空则不进行任何处理
		if(!selectText) return;
		const query = selectText;
		const str1 = appid + query + salt +key;
		const sign = MD5(str1);
		const data = {
			q: query,
			appid: appid,
			salt: salt,
			from: from,
			to: to,
			sign: sign
		};
		fs.readFile(fileName, (err, buffer)=> {
			if(err) {
				fs.appendFile(fileName, headerContext,(err)=> {
					if(!err)
					vscode.window.showInformationMessage('成功创建文件')
					appendWord(data, (resultData)=> {
						const context = `\n|${resultData.src}|${resultData.dst}|未添加|`
						fs.appendFile(fileName, context,(err)=> {
							if(!err)
							vscode.window.showInformationMessage('成功添加单词')
						})
					})
				})
			}
			// const fileContext = buffer.toString()
			if(headerContext.includes('### 单词记录')) {
				appendWord(data, (resultData)=> {
					const context = `\n|${resultData.src}|${resultData.dst}|未添加|`
					fs.appendFile(fileName, context,(err)=> {
						if(!err)
						vscode.window.showInformationMessage('成功添加单词')
					})
				})
			}
			// return;
		})
		// const fileContext = buffer.toString()
		return;

		
		
	});

	let translation = vscode.commands.registerCommand('memoenglish.translation', ()=> {
		// 获取当前编辑对象
		const editor = vscode.window.activeTextEditor;
		// 获取选中文本
		const selection = editor.selection;
		const selectText = editor.document.getText(selection)
		// 若果选中文本为空则不进行任何处理
		if(!selectText) return;
		const query = selectText;
		const str1 = appid + query + salt +key;
		const sign = MD5(str1);
		const data = {
			q: query,
			appid: appid,
			salt: salt,
			from: from,
			to: to,
			sign: sign
		};
		appendWord(data, (resultData)=> {
			vscode.window.showInformationMessage(resultData.dst)
		})
	})
	

	context.subscriptions.push(translationAndAppend, translation);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
