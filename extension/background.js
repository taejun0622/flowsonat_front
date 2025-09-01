// FlowSonat Instagram Controller - Background Service Worker

// Extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('🚀 FlowSonat Instagram Controller extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('instagram.com')) {
    // Toggle controller state
    chrome.tabs.sendMessage(tab.id, {
      type: 'FLOWSONAT_TOGGLE'
    });
  } else {
    // Show notification for non-Instagram pages
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'FlowSonat Controller',
      message: 'This extension only works on Instagram pages'
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.type) {
    case 'FLOWSONAT_GET_STATUS':
      sendResponse({ status: 'active' });
      break;
      
    case 'FLOWSONAT_ACTIVATE_CONTROLLER':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'FLOWSONAT_ACTIVATE'
          });
        }
      });
      break;
      
    case 'FLOWSONAT_DEACTIVATE_CONTROLLER':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'FLOWSONAT_DEACTIVATE'
          });
        }
      });
      break;
      
    case 'FLOWSONAT_EXECUTE_ACTION':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('instagram.com')) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: message.action,
            data: message.data
          });
        }
      });
      break;
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('instagram.com')) {
    // Inject content script if needed
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
      // Script might already be injected
    });
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && tab.url.includes('instagram.com')) {
      // Update extension icon or state for Instagram tabs
      chrome.action.setBadgeText({
        tabId: activeInfo.tabId,
        text: 'ON'
      });
      chrome.action.setBadgeBackgroundColor({
        tabId: activeInfo.tabId,
        color: '#667eea'
      });
    } else {
      chrome.action.setBadgeText({
        tabId: activeInfo.tabId,
        text: ''
      });
    }
  });
});
