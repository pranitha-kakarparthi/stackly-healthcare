import { spawn } from "child_process";
import http from "http";

const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9555",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
  ]
);

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  await delay(1000);
  const versionData = await new Promise((resolve, reject) => {
    http
      .get("http://127.0.0.1:9555/json/version", (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => resolve(JSON.parse(d)));
      })
      .on("error", reject);
  });

  const ws = new WebSocket(versionData.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  const send = (m, p = {}) =>
    new Promise((resolve) => {
      const cur = id++;
      const h = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === cur) {
          ws.removeEventListener("message", h);
          resolve(d);
        }
      };
      ws.addEventListener("message", h);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  const tr = await send("Target.createTarget", { url: "about:blank" });
  const ar = await send("Target.attachToTarget", {
    targetId: tr.result.targetId,
    flatten: true,
  });
  const sId = ar.result.sessionId;

  for (const width of [320, 360, 375, 480]) {
    await send(
      "Emulation.setDeviceMetricsOverride",
      { width, height: 800, deviceScaleFactor: 1, mobile: true },
      sId
    );
    const fileUrl =
      "file:///C:/Users/prani/Desktop/Stackly%20Projects/Healthcare/patient-dashboard.html";
    await send("Page.navigate", { url: fileUrl }, sId);
    await delay(600);

    const evalRes = await send(
      "Runtime.evaluate",
      {
        expression: `(() => {
        const body = document.body;
        const main = document.querySelector('.dashboard-main');
        const sidebar = document.querySelector('.dashboard-sidebar');
        const container = document.querySelector('.dashboard-container');
        const tables = Array.from(document.querySelectorAll('.data-table')).map(t => ({
          width: t.offsetWidth,
          parentWidth: t.parentElement.offsetWidth,
          parentScrollWidth: t.parentElement.scrollWidth
        }));
        const cards = Array.from(document.querySelectorAll('.dash-card')).map(c => ({
          headerText: c.querySelector('h3')?.textContent?.trim().substring(0, 30),
          width: c.offsetWidth,
          scrollWidth: c.scrollWidth,
          rectRight: Math.round(c.getBoundingClientRect().right)
        }));
        return {
          windowWidth: window.innerWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          containerWidth: container?.offsetWidth,
          containerScrollWidth: container?.scrollWidth,
          sidebarWidth: sidebar?.offsetWidth,
          mainWidth: main?.offsetWidth,
          mainScrollWidth: main?.scrollWidth,
          tables,
          wideCards: cards.filter(c => c.rectRight > window.innerWidth || c.scrollWidth > c.width)
        };
      })()`,
        returnByValue: true,
      },
      sId
    );

    console.log(`\n--- Test @ ${width}px ---`);
    console.log(JSON.stringify(evalRes.result?.value, null, 2));
  }

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  chrome.kill();
  process.exit(1);
});
