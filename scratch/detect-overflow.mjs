import { spawn } from "child_process";
import http from "http";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const workspaceDir = "C:\\Users\\prani\\Desktop\\Stackly Projects\\Healthcare";

const htmlFiles = [
  "index.html",
  "about.html",
  "services.html",
  "care-team.html",
  "blog.html",
  "contact.html",
  "404.html",
  "sign-in.html",
  "sign-up.html",
  "patient-dashboard.html",
  "doctor-dashboard.html",
  "admin-dashboard.html",
  "appointments.html",
  "prescriptions.html",
  "records.html",
  "settings.html",
  "dashboard.html",
];

const viewports = [320, 360, 375, 480];

function getJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9444",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
  ]);

  let connected = false;
  let versionData = null;
  for (let i = 0; i < 20; i++) {
    await delay(300);
    try {
      versionData = await getJson("http://127.0.0.1:9444/json/version");
      if (versionData && versionData.webSocketDebuggerUrl) {
        connected = true;
        break;
      }
    } catch (e) {}
  }

  if (!connected) {
    console.error("Could not connect to Chrome debugging port");
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(versionData.webSocketDebuggerUrl);

  let msgId = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data);
      callbacks.delete(data.id);
    }
  };

  await new Promise((r) => (ws.onopen = r));

  function sendCommand(method, params = {}, sessionId) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
    });
  }

  const targetRes = await sendCommand("Target.createTarget", {
    url: "about:blank",
  });
  const targetId = targetRes.result.targetId;
  const attachRes = await sendCommand("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const sessionId = attachRes.result.sessionId;

  await sendCommand("Page.enable", {}, sessionId);

  const results = [];

  for (const file of htmlFiles) {
    const fileUrl = `file:///${path.join(workspaceDir, file).replace(/\\/g, "/")}`;

    for (const width of viewports) {
      await sendCommand(
        "Emulation.setDeviceMetricsOverride",
        {
          width,
          height: 800,
          deviceScaleFactor: 1,
          mobile: true,
        },
        sessionId
      );

      await sendCommand("Page.navigate", { url: fileUrl }, sessionId);
      await delay(350);

      const evalRes = await sendCommand(
        "Runtime.evaluate",
        {
          expression: `(() => {
          const winWidth = window.innerWidth;
          let clippedElements = [];

          // Query visible elements
          const elements = document.querySelectorAll('body *:not(script):not(style):not(svg):not(path)');
          for (const el of elements) {
            // Ignore hidden elements or off-screen drawers
            if (el.closest('.mobile-nav-drawer') && !el.closest('.mobile-nav-overlay.open')) continue;
            if (el.closest('.dash-sidebar-backdrop')) continue;
            if (el.classList.contains('mobile-nav-drawer')) continue;
            if (el.classList.contains('mobile-nav-overlay')) continue;
            // Ignore elements inside horizontally scrollable containers (like .data-table inside .data-table-container)
            if (el.closest('.data-table-container') && !el.classList.contains('data-table-container')) continue;

            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

            const rect = el.getBoundingClientRect();
            // Check if element extends past the right viewport boundary
            if (rect.right > winWidth + 2 && rect.width > 0 && rect.height > 0) {
              clippedElements.push({
                tag: el.tagName.toLowerCase(),
                className: (typeof el.className === 'string' ? el.className.trim() : ''),
                text: (el.textContent || '').trim().substring(0, 40),
                rectRight: Math.round(rect.right),
                rectWidth: Math.round(rect.width),
                overflowAmount: Math.round(rect.right - winWidth)
              });
            }
          }

          return {
            winWidth,
            clippedElements: clippedElements.slice(0, 8)
          };
        })()`,
          returnByValue: true,
        },
        sessionId
      );

      const check = evalRes.result?.value;
      if (check && check.clippedElements.length > 0) {
        results.push({
          file,
          width,
          clipped: check.clippedElements,
        });
      }
    }
  }

  console.log("\n=======================================");
  console.log(`CLIPPED ELEMENTS REPORT: ${results.length} issues found`);
  console.log("=======================================");

  for (const r of results) {
    console.log(
      `\n[CLIPPED] ${r.file} @ ${r.width}px (exceeds viewport by up to ${Math.max(...r.clipped.map((c) => c.overflowAmount))}px):`
    );
    for (const c of r.clipped) {
      console.log(
        `   - <${c.tag}> class="${c.className}" overflow=+${c.overflowAmount}px [width=${c.rectWidth}px, right=${c.rectRight}px] text="${c.text}"`
      );
    }
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
