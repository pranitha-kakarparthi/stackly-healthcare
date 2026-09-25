import { spawn } from "child_process";
import http from "http";

const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9888",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
  ]
);

setTimeout(async () => {
  const list = await new Promise((res) =>
    http.get("http://127.0.0.1:9888/json/list", (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => res(JSON.parse(d)));
    })
  );
  const ws = new WebSocket(list[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  const send = (m, p = {}) =>
    new Promise((r) => {
      const cur = id++;
      const h = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === cur) {
          ws.removeEventListener("message", h);
          r(d);
        }
      };
      ws.addEventListener("message", h);
      ws.send(JSON.stringify({ id: cur, method: m, params: p }));
    });

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 800,
    deviceScaleFactor: 1,
    mobile: true,
    fitWindow: false,
  });

  await new Promise((resolve) => {
    const h = (e) => {
      const d = JSON.parse(e.data);
      if (d.method === "Page.loadEventFired") {
        ws.removeEventListener("message", h);
        resolve();
      }
    };
    ws.addEventListener("message", h);
    send("Page.navigate", {
      url: "file:///c:/Users/prani/Desktop/Stackly%20Projects/Healthcare/index.html",
    });
  });

  await new Promise((r) => setTimeout(r, 500));
  const r = await send("Runtime.evaluate", {
    expression:
      "JSON.stringify({ winWidth: window.innerWidth, docScroll: document.documentElement.scrollWidth, bodyScroll: document.body.scrollWidth, docClient: document.documentElement.clientWidth })",
  });
  console.log(
    "Result after loadEventFired:",
    JSON.parse(r.result.result.value)
  );
  ws.close();
  chrome.kill();
  process.exit(0);
}, 1000);
