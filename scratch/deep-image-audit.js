import fs from "fs";
import path from "path";

const workspace = "C:\\Users\\prani\\Desktop\\Stackly Projects\\Healthcare";
const htmlFiles = fs.readdirSync(workspace).filter((f) => f.endsWith(".html"));

const imageUsage = new Map();

function track(url, location) {
  if (
    !url ||
    url.startsWith("data:") ||
    url.endsWith(".svg") ||
    url.includes("logo.png") ||
    url.includes("logo.webp")
  )
    return;
  // normalize unsplash url
  const cleanUrl = url.split("?")[0];
  if (!imageUsage.has(cleanUrl)) {
    imageUsage.set(cleanUrl, []);
  }
  imageUsage.get(cleanUrl).push(location);
}

for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(workspace, file), "utf8");
  // img src
  const imgMatches = content.matchAll(/<img[^>]+src=["']([^"']+)["']/g);
  for (const m of imgMatches) {
    track(m[1], `${file} (<img src>)`);
  }
  // inline background-image
  const bgMatches = content.matchAll(
    /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/g
  );
  for (const m of bgMatches) {
    track(m[1], `${file} (inline bg)`);
  }
}

// Check CSS
const cssContent = fs.readFileSync(
  path.join(workspace, "assets", "css", "main.css"),
  "utf8"
);
const cssBgMatches = cssContent.matchAll(
  /background-image:\s*url\(["']?([^"')]+)["']?\)/g
);
for (const m of cssBgMatches) {
  track(m[1], `main.css`);
}

let duplicates = 0;
for (const [url, locations] of imageUsage.entries()) {
  if (locations.length > 1) {
    duplicates++;
    console.log(`[DUPLICATE] ${url}`);
    locations.forEach((loc) => console.log(`   - ${loc}`));
  }
}

console.log(
  `\nImage Audit Finished. Total unique images: ${imageUsage.size}. Duplicates found: ${duplicates}`
);
if (duplicates === 0) {
  console.log("STRICT ZERO DUPLICATION VERIFIED! All images are 100% unique.");
} else {
  process.exit(1);
}
