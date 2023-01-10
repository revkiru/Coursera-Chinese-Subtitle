async function openBilingual() {
	let tracks = document.getElementsByTagName("track");
	let en;
	let zhcn;
	if (tracks.length) {
		for (let i = 0; i < tracks.length; i++) {
			if (tracks[i].srclang === "en") {
				en = tracks[i];
			} else if (tracks[i].srclang === "zh-CN") {
				zhcn = tracks[i];
			}
		}
		if (en) {
			en.track.mode = "showing";
			if (zhcn) {
				zhcn.track.mode = "showing";
			} else {
				// 用 sleep 让 cues 有充足的时间加载字幕以确保正常工作
				await sleep(500);
				let cues = en.track.cues;
				// 由于逐句翻译会大量请求翻译 API，需要减少请求次数
				const cuesTextList = getCuesTextList(cues);
				// 进行翻译
				for (let i = 0; i < cuesTextList.length; i++) {
					getTranslation(cuesTextList[i][1], (translatedText) => {
						// split + 拼接
						const translatedTextList = translatedText.split("\n\n");
						for (let j = 0; j < translatedTextList.length; j++) {
							cues[cuesTextList[i][0] + j].text +=
								"\n" + translatedTextList[j];
						}
					});
				}
			}
		}
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCuesTextList(cues) {
	// 取出字幕的所有文本内容，整合成为一个列表
	let cuesTextList = [];
	for (let i = 0; i < cues.length; i++) {
		if (
			cuesTextList.length &&
			cuesTextList[cuesTextList.length - 1][1].length +
				cues[i].text.length <
				5000
		) {
			cuesTextList[cuesTextList.length - 1][1] += "\n\n" + cues[i].text;
		} else {
			cuesTextList.push([i, cues[i].text]);
		}
	}
	return cuesTextList;
}

function getTranslation(words, callback) {
	const xhr = new XMLHttpRequest();
	let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh&dt=t&q=${encodeURI(
		words
	)}`;
	xhr.open("GET", url, true);
	xhr.responseType = "text";
	xhr.onload = function () {
		if (xhr.readyState === xhr.DONE) {
			if (xhr.status === 200 || xhr.status === 304) {
				const translatedList = JSON.parse(xhr.responseText)[0];
				let translatedText = "";
				for (let i = 0; i < translatedList.length; i++) {
					translatedText += translatedList[i][0];
				}
				callback(translatedText);
			}
		}
	};
	xhr.send();
}

// 设置监听，如果接收到请求，执行开启双语字幕函数
chrome.runtime.onMessage.addListener(function (request, sender) {
	openBilingual();
});
