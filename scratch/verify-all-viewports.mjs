import { spawn } from "child_process";
import http from "http";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const workspaceDir = "C:\\Users\\prani\\Desktop\\Stackly Projects\\Healthcare";

const testPages = [
  // Public pages
  { file: "index.html", auth: false },
  { file: "about.html", auth: false },
  { file: "services.html", auth: false },
  { file: "care-team.html", auth: false },
  { file: "blog.html", auth: false },
  { file: "contact.html", auth: false },
  { file: "404.html", auth: false },
  { file: "sign-in.html", auth: false },
  { file: "sign-up.html", auth: false },
  // Dashboard pages
  { file: "patient-dashboard.html", auth: true, role: "Patient" },
  { file: "doctor-dashboard.html", auth: true, role: "Doctor" },
  { file: "admin-dashboard.html", auth: true, role: "Admin" },
  { file: "appointments.html", auth: true, role: "Patient" },
  { file: "prescriptions.html", auth: true, role: "Patient" },
  { file: "records.html", auth: true, role: "Patient" },
  { file: "settings.html", auth: true, role: "Patient" },
  { file: "dashboard.html", auth: true, role: "Patient" },
];

const testViewports = [320, 360, 375, 414, 480, 768, 1024, 1280];

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
    "--remote-debugging-port=9777",
    "--disable-gpu",
    "--no-sandbox",
    "--allow-file-access-from-files",
  ]);

  await delay(1200);

  const list = await getJson("http://127.0.0.1:9777/json/list");
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

  // Enable necessary CDP domains
  await send("Page.enable");
  await send("Runtime.enable");

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  for (const pageItem of testPages) {
    const fileUrl = `file:///${path.join(workspaceDir, pageItem.file).replace(/\\/g, "/")}`;

    for (const width of testViewports) {
      totalTests++;
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 850,
        deviceScaleFactor: 1,
        mobile: width <= 768,
      });

      // Navigate to page
      await send("Page.navigate", { url: fileUrl });
      await delay(300);

      // If auth needed, seed localStorage and reload
      if (pageItem.auth) {
        await send("Runtime.evaluate", {
          expression: `
            localStorage.setItem('stackly_current_user', JSON.stringify({
              name: 'Dr. Test User',
              email: 'test@thestackly.com',
              role: '${pageItem.role}'
            }));
            localStorage.setItem('stackly_role', '${pageItem.role}');
          `,
        });
      }

      await delay(250);

      // Evaluate geometry
      const evalRes = await send("Runtime.evaluate", {
        expression: `(() => {
          const winWidth = window.innerWidth;
          const docScrollWidth = document.documentElement.scrollWidth;
          const bodyScrollWidth = document.body.scrollWidth;
          const hasPageOverflow = docScrollWidth > winWidth + 1 || bodyScrollWidth > winWidth + 1;

          const main = document.querySelector('.dashboard-main');
          let mainOverhang = 0;
          if (main) {
            const mainRect = main.getBoundingClientRect();
            if (mainRect.right > winWidth + 1) {
              mainOverhang = Math.round(mainRect.right - winWidth);
            }
          }

          // Check visible cards / containers
          let clippedItems = [];
          const testElements = document.querySelectorAll('.dash-card, .dash-welcome-banner, .card, .container, .hero-content, .cta-banner, .settings-section-card');
          for (const el of testElements) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winWidth + 1) {
              clippedItems.push({
                className: el.className,
                right: Math.round(rect.right),
                overhang: Math.round(rect.right - winWidth)
              });
            }
          }

          return {
            winWidth,
            docScrollWidth,
            hasPageOverflow,
            mainOverhang,
            clippedItems
          };
        })()`,
        returnByValue: true,
      });

      const res = evalRes.result?.value;
      if (!res) {
        failures.push({
          file: pageItem.file,
          width,
          error: "Eval returned null",
        });
      } else if (
        res.hasPageOverflow ||
        res.mainOverhang > 0 ||
        res.clippedItems.length > 0
      ) {
        failures.push({
          file: pageItem.file,
          width,
          docScrollWidth: res.docScrollWidth,
          mainOverhang: res.mainOverhang,
          clipped: res.clippedItems,
        });
      } else {
        passedTests++;
      }
    }
  }

  console.log("\n=============================================");
  console.log(`VIEWPORT ALIGNMENT AUDIT COMPLETE`);
  console.log(
    `Total Scenarios Tested: ${totalTests} (17 HTML files x 8 viewports: 320, 360, 375, 414, 480, 768, 1024, 1280px)`
  );
  console.log(`Passed: ${passedTests}`);
  console.log(`Failures: ${failures.length}`);
  console.log("=============================================\n");

  if (failures.length === 0) {
    console.log(
      "SUCCESS! ALL 136 VIEWPORT SCENARIOS RENDER WITH ZERO HORIZONTAL OVERFLOW OR CLIPPING!"
    );
  } else {
    for (const f of failures) {
      console.log(`[FAIL] ${f.file} @ ${f.width}px`);
      if (f.mainOverhang)
        console.log(
          `   - .dashboard-main right edge overhangs viewport by ${f.mainOverhang}px`
        );
      if (f.clipped) {
        for (const c of f.clipped) {
          console.log(
            `   - ${c.className} overhangs by ${c.overhang}px (right=${c.right}px, win=${f.width}px)`
          );
        }
      }
    }
  }

  ws.close();
  chrome.kill();
  process.exit(failures.length === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
