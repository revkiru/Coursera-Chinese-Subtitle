// 通过点击图标 icon，发送请求
chrome.browserAction.onClicked.addListener(() => {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {});
	});
});
