// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// When the extension is installed or upgraded ...
chrome.runtime.onInstalled.addListener(function() {
  // Replace all rules ...
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    // With a new rule ...
    chrome.declarativeContent.onPageChanged.addRules([
      {
        // That fires when a page's URL contains a 'g' ...
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { urlContains: 'canvas.skku.edu' },
          })
        ],
        // And shows the extension's page action.
        actions: [ new chrome.declarativeContent.ShowPageAction() ]
      }
    ]);
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'OPEN_TOKEN_TAB') {
    (async () => {
      chrome.storage.local.set({ isCookie : true })
      const tab = await getTokenTab(request.data);
      sendResponse({ tab });
    })();
    return true;
  } else if (request.action === 'CLOSE_TOKEN_TAB') {
    chrome.tabs.remove(request.tabId);
    sendResponse({ success: true });
  }
  
});

function getTokenTab(data) {
  return new Promise((resolve) => {
    if (data[0]) {
      let index = 0;
      while (!Object.keys(data[index]).includes('name')) index += 1;
      chrome.tabs.create({url: `https://canvas.skku.edu/courses/${data[index].id}/external_tools/5`, active: false}, (tab) => {
        resolve(tab);
      });
    }
  });
}
