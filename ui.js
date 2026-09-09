// Dynamic cursor glowing backlight tracking engine
const wash = document.getElementById('wash');
if (wash) {
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    wash.style.setProperty('--mx', `${x}%`);
    wash.style.setProperty('--my', `${y}%`);
  });
}

// Proxy search input interception and form pipeline routing
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('proxy-form');
  const input = document.getElementById('proxy-search');
  
  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let url = input.value.trim();
      
      // Auto-wrap plain keywords into query lookups
      if (!url.includes('.') || url.includes(' ')) {
        url = 'https://duckduckgo.com' + encodeURIComponent(url);
      } else if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
      }
      
      // Routes parameters down into your live active server.js proxy endpoint
      window.location.href = `/proxy?url=${encodeURIComponent(url)}`;
    });
  }
});
