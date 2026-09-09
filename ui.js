// Dynamic cursor glowing backlight tracking engine
const wash = document.getElementById("wash");

if (wash) {
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;

    wash.style.setProperty("--mx", `${x}%`);
    wash.style.setProperty("--my", `${y}%`);
  });
}

// Your live Render backend
const PROXY_BASE = "https://mathspqce.onrender.com";

// Proxy search input interception and form pipeline routing
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("proxy-form");
  const input = document.getElementById("proxy-search");

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let url = input.value.trim();

    if (!url) return;

    // Convert search text into a DuckDuckGo search
    if (url.includes(" ") || !url.includes(".")) {
      url =
        "https://duckduckgo.com/?q=" +
        encodeURIComponent(url);
    }
    // Add https:// when the user enters a domain only
    else if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    // Send the request to Render, not GitHub Pages/jsDelivr
    window.location.href =
      `${PROXY_BASE}/proxy?url=${encodeURIComponent(url)}`;
  });
});
