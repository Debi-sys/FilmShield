// popup.js

function fetchTriggerWarnings() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const movieTitle = activeTab.title; // Assuming the movie title is in the page title
    chrome.runtime.sendMessage({ action: "fetchWarnings", movieTitle }, (response) => {
      const triggerWarnings = response.triggerWarnings;
      // Display trigger warnings to the user in the popup
      // You can customize the popup HTML to show the warnings as needed
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  fetchTriggerWarnings();
});
