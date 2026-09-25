import { spawn } from "child_process";
import http from "http";

const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9666",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
  ]
);

function getJson(url) {
  return new Promise((res, rej) =>
    http
      .get(url, (r) => {
        let d = "";
        r.on("data", (c) => (d += c));
        r.on("end", () => res(JSON.parse(d)));
      })
      .on("error", rej)
  );
}

async function run() {
  await new Promise((r) => setTimeout(r, 1000));
  const list = await getJson("http://127.0.0.1:9666/json/list");
  const page = list.find((t) => t.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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

  await send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 800,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.navigate", {
    url: "file:///C:/Users/prani/Desktop/Stackly%20Projects/Healthcare/patient-dashboard.html",
  });
  await new Promise((r) => setTimeout(r, 800));

  const res = await send("Runtime.evaluate", {
    expression:
      'JSON.stringify({ docWidth: document.documentElement.scrollWidth, winWidth: window.innerWidth, bodyWidth: document.body.offsetWidth, mainWidth: document.querySelector(".dashboard-main")?.offsetWidth, mainScroll: document.querySelector(".dashboard-main")?.scrollWidth, sidebarWidth: document.querySelector(".dashboard-sidebar")?.offsetWidth })',
  });
  console.log("Direct evaluate:", res);

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
