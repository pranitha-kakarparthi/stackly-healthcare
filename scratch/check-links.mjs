import fs from "fs";
import path from "path";

const workspace = "C:\\Users\\prani\\Desktop\\Stackly Projects\\Healthcare";
const htmlFiles = fs.readdirSync(workspace).filter((f) => f.endsWith(".html"));

let brokenLinks = 0;

for (const file of htmlFiles) {
  const content = fs.readFileSync(path.join(workspace, file), "utf8");
  const hrefMatches = content.matchAll(/href=["']([^"']+)["']/g);
  for (const m of hrefMatches) {
    const href = m[1];
    if (
      href.startsWith("#") ||
      href.startsWith("http") ||
      href.startsWith("tel:") ||
      href.startsWith("mailto:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }
    const target = href.split("?")[0].split("#")[0];
    if (!target) continue;
    const targetPath = path.join(workspace, target);
    if (!fs.existsSync(targetPath)) {
      brokenLinks++;
      console.log(`[BROKEN LINK] in ${file}: "${href}" -> not found`);
    }
  }
}

console.log(`\nLink Check Completed. Total broken links: ${brokenLinks}`);
if (brokenLinks === 0) {
  console.log("STRICT 100% VALID INTERNAL LINKS! Zero broken references.");
} else {
  process.exit(1);
}
