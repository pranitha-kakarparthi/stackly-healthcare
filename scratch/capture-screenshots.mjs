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
    "--remote-debugging-port=9999",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
  ]);

  await delay(1200);

  const list = await getJson("http://127.0.0.1:9999/json/list");
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

  // Set device viewport to 360px mobile width
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

  const captures = [
    { file: "appointments.html", name: "appointments_mobile_360.png" },
    { file: "prescriptions.html", name: "prescriptions_mobile_360.png" },
    { file: "records.html", name: "records_mobile_360.png" },
    { file: "care-team.html", name: "care_team_mobile_360.png" },
  ];

  for (const item of captures) {
    const fileUrl = `file:///${path.join(workspaceDir, item.file).replace(/\\/g, "/")}`;
    await send("Page.navigate", { url: fileUrl });
    await delay(700);

    const shotRes = await send("Page.captureScreenshot", { format: "png" });
    if (shotRes.result?.data) {
      const buffer = Buffer.from(shotRes.result.data, "base64");
      const outPath = path.join(artifactDir, item.name);
      fs.writeFileSync(outPath, buffer);
      console.log(`Captured: ${outPath} (${buffer.length} bytes)`);
    }
  }

  ws.close();
  chrome.kill();
  console.log("All verification screenshots captured successfully!");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
