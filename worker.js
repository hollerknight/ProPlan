// Use the browser-agnostic `browser` namespace
var browser = (typeof chrome !== 'undefined') ? chrome : browser;

// Function to handle clicks on the extension icon
browser.action.onClicked.addListener(async function(tab) {
  // Create a new tab with ProPlan.html when the icon is clicked
  await browser.tabs.create({ url: 'ProPlan.html' });
});

// Function to handle messages from other parts of the extension
browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  console.log('Received message:', request);
  
  // Example of handling local storage
  if (request.action === 'saveData') {
    const { key, value } = request;
    localStorage.setItem(key, value);
    sendResponse({ response: `Data saved: ${key} = ${value}` });
  } else if (request.action === 'getData') {
    const { key } = request;
    const value = localStorage.getItem(key);
    sendResponse({ response: `Data retrieved: ${key} = ${value}` });
  } else {
    sendResponse({ response: 'Unknown action' });
  }
});