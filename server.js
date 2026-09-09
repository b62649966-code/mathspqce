const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   1. MIDDLEWARE
========================= */
app.use(express.static("public"));
app.use(express.json());

app.use(
  session({
    secret: "advanced-proxy-engine-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

/* =========================
   2. UTIL
========================= */
const normalizeUrl = (url) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `https://${url}`;
};

const rewriteDom = (html, targetUrl) => {
  const $ = cheerio.load(html);

  const selectors = {
    a: "href",
    form: "action",
    link: "href",
    script: "src",
    img: "src",
    iframe: "src",
    source: "src",
  };

  Object.entries(selectors).forEach(([tag, attr]) => {
    $(tag).each((_, el) => {
      let val = $(el).attr(attr);

      if (!val) return;
      if (
        val.startsWith("data:") ||
        val.startsWith("#") ||
        val.startsWith("javascript:") ||
        val.startsWith("mailto:") ||
        val.startsWith("tel:")
      )
        return;

      try {
        const absolute = new URL(val, targetUrl).href;

        if (tag === "a" || tag === "form") {
          $(el).attr(
            attr,
            `/proxy?url=${encodeURIComponent(absolute)}`
          );
        } else {
          $(el).attr(attr, absolute);
        }
      } catch (e) {}
    });
  });

  $("head").prepend(`
    <base href="${targetUrl}">
    <meta name="referrer" content="no-referrer">
  `);

  $("meta[http-equiv='Content-Security-Policy']").remove();
  $("meta[http-equiv='X-Frame-Options']").remove();

  return $.html();
};

/* =========================
   3. PROXY ROUTE
========================= */
app.get("/proxy", async (req, res) => {
  const targetUrl = normalizeUrl(req.query.url);

  if (!targetUrl) {
    return res.status(400).send("Missing URL");
  }

  // session history
  if (!req.session.history) {
    req.session.history = [];
    req.session.index = -1;
  }

  try {
    const response = await axios.get(targetUrl, {
      timeout: 15000,
      responseType: "text",
      decompress: true,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      validateStatus: () => true,
    });

    if (response.status === 200) {
      req.session.history = req.session.history.slice(
        0,
        req.session.index + 1
      );
      req.session.history.push(targetUrl);
      req.session.index++;
    }

    const html = rewriteDom(response.data, targetUrl);

    res.set({
      "Content-Security-Policy":
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
      "X-Frame-Options": "ALLOWALL",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    });

    res.send(html);
  } catch (err) {
    res.status(500).send(`
      <div style="color:red;font-family:Arial">
        <h2>Proxy Error</h2>
        <p>${err.message}</p>
      </div>
    `);
  }
});

/* =========================
   4. NAVIGATION API
========================= */
app.get("/nav/status", (req, res) => {
  res.json({
    current: req.session.history?.[req.session.index] || null,
    historyCount: req.session.history?.length || 0,
    index: req.session.index || 0,
  });
});

app.get("/nav/back", (req, res) => {
  if (req.session.index > 0) req.session.index--;
  res.json({ url: req.session.history?.[req.session.index] || null });
});

app.get("/nav/forward", (req, res) => {
  if (req.session.index < req.session.history.length - 1)
    req.session.index++;
  res.json({ url: req.session.history?.[req.session.index] || null });
});

/* =========================
   5. START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Proxy running: http://localhost:${PORT}`);
});