document.getElementById("generatePreview").addEventListener("click", async () => {
  const url = document.getElementById("urlInput").value.trim();
  if (!url) {
    document.getElementById("status").textContent = "Please enter a valid URL.";
    return;
  }

  try {
    // Fetch the HTML content of the URL using CORS proxy
    const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error("Unable to fetch the URL content.");

    const htmlContent = await response.text();

    // Extract metadata from the HTML (like title, description, and image)
    const metadata = extractMetadata(htmlContent, url);

    // Sanitize the HTML to remove unsafe elements (like scripts, iframes, etc.)
    const sanitizedContent = sanitizeHTML(htmlContent);

    // Send the sanitized content and metadata to the content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: insertPreview,
      args: [sanitizedContent, metadata]
    });

    document.getElementById("status").textContent = "Preview generated successfully!";
  } catch (error) {
    document.getElementById("status").textContent = `Error: ${error.message}`;
  }
});

// Function to sanitize HTML
function sanitizeHTML(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, iframe, link, style").forEach(el => el.remove()); // Remove unsafe tags
  return doc.body.innerHTML;
}

// Function to extract metadata (title, description, and image)
function extractMetadata(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title = doc.querySelector("title") ? doc.querySelector("title").innerText : url;
  const description = doc.querySelector('meta[name="description"]') ? doc.querySelector('meta[name="description"]').content : 'No description available';
  const image = doc.querySelector('meta[property="og:image"]') ? doc.querySelector('meta[property="og:image"]').content : 'https://via.placeholder.com/80';

  return { url, title, description, image };
}

// Function to inject the preview into the Gmail compose window
function insertPreview(sanitizedHTML, metadata) {
  const emailBody = document.querySelector(".editable");
  if (emailBody) {
    // Creating the preview HTML
    const previewHTML = `
      <div style="
        border: 1px solid #ddd; 
        border-radius: 8px; 
        padding: 16px; 
        max-width: 100%; 
        background-color: #f9f9f9;
        margin: 10px 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      ">
        <a href="${metadata.url}" target="_blank" style="text-decoration: none; color: inherit;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${metadata.image}" alt="Preview image" style="
              max-width: 80px; 
              height: auto; 
              border-radius: 6px;
              object-fit: cover;
            ">
            <div style="flex-grow: 1;">
              <h3 style="
                font-size: 16px; 
                color: #333; 
                margin: 0; 
                font-weight: 600;
              ">${metadata.title}</h3>
              <p style="
                font-size: 12px; 
                color: #555; 
                margin: 8px 0 0;
                line-height: 1.4;
              ">${metadata.description}</p>
            </div>
          </div>
        </a>
      </div>
    `;

    // Allow users to insert email content above and below the preview
    emailBody.innerHTML += `
      <div contenteditable="true" style="margin-bottom: 10px;">Write above this preview...</div>
      ${previewHTML}
      <div contenteditable="true" style="margin-top: 10px;">Write below this preview...</div>
    `;
  } else {
    alert("Unable to find Gmail editor. Please ensure you're in the Gmail compose window.");
  }
}
