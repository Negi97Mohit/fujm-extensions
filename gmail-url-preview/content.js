chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "insertPreview") {
      const emailBody = document.querySelector(".editable");
      if (emailBody) {
        emailBody.innerHTML += message.previewHTML;
      } else {
        console.error("Gmail compose area not found.");
      }
    }
  });
  