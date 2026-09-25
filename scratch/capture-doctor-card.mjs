import { spawn } from "child_process";
import http from "http";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const workspaceDir = "C:\\Users\\prani\\Desktop\\Stackly Projects\\Healthcare";
const artifactDir =
  "C:\\Users\\prani\\.gemini\\antigravity\\brain\\edc9da60-fd69-47f9-99c1-10ebee928e18";

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
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9996",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
  ]);

  await delay(1200);

  const list = await getJson("http://127.0.0.1:9996/json/list");
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

  // Seed auth
  await send("Page.navigate", {
    url: `file:///${path.join(workspaceDir, "sign-in.html").replace(/\\/g, "/")}`,
  });
  await delay(400);
  await send("Runtime.evaluate", {
    expression: `
      localStorage.setItem('stackly_current_user', JSON.stringify({
        name: 'Pranitha Kakarparthi',
        email: 'pranitha@example.com',
        role: 'Patient'
      }));
      localStorage.setItem('stackly_role', 'Patient');
    `,
  });

  const fileUrl = `file:///${path.join(workspaceDir, "care-team.html").replace(/\\/g, "/")}`;
  await send("Page.navigate", { url: fileUrl });
  await delay(700);

  await send("Runtime.evaluate", {
    expression:
      'document.querySelector(".care-card-actions").scrollIntoView({ behavior: "instant", block: "center" })',
  });
  await delay(300);

  const shotRes = await send("Page.captureScreenshot", { format: "png" });
  const buffer = Buffer.from(shotRes.result.data, "base64");
  const outPath = path.join(artifactDir, "care_doctor_card_360.png");
  fs.writeFileSync(outPath, buffer);
  console.log(`Captured: ${outPath} (${buffer.length} bytes)`);

  ws.close();
  chrome.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
