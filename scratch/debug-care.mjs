import { spawn } from "child_process";
import http from "http";

const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--remote-debugging-port=9995",
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

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  await delay(1200);
  const list = await getJson("http://127.0.0.1:9995/json/list");
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

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 360,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send("Page.navigate", {
    url: "file:///C:/Users/prani/Desktop/Stackly%20Projects/Healthcare/sign-in.html",
  });
  await delay(400);
  await send("Runtime.evaluate", {
    expression:
      'localStorage.setItem("stackly_current_user", JSON.stringify({ name: "Test", role: "Patient" })); localStorage.setItem("stackly_role", "Patient");',
  });
  await send("Page.navigate", {
    url: "file:///C:/Users/prani/Desktop/Stackly%20Projects/Healthcare/care-team.html",
  });
  await delay(700);

  const res = await send("Runtime.evaluate", {
    expression: `(() => {
      const actions = document.querySelector(".care-card-actions");
      const btns = Array.from(actions.querySelectorAll("button")).map(b => ({
        text: b.textContent.trim(),
        rect: b.getBoundingClientRect(),
        display: window.getComputedStyle(b).display,
        visibility: window.getComputedStyle(b).visibility,
        offsetWidth: b.offsetWidth,
        offsetHeight: b.offsetHeight
      }));
      return JSON.stringify({ actionsRect: actions.getBoundingClientRect(), btns });
    })()`,
  });

  console.log("Care actions debug:", JSON.parse(res.result.result.value));
  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
