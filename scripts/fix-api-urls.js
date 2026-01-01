/**
 * Script to fix all localhost:5000 references to use dynamic API URLs
 * Run with: node scripts/fix-api-urls.js
 */

const fs = require("fs");
const path = require("path");

const frontendDir = path.join(__dirname, "..", "frontend");

// Files to process
const filesToFix = [
  "app/stories/create/page.tsx",
  "app/posts/[slug]/page.tsx",
  "app/posts/[slug]/edit/page.tsx",
  "app/posts/create/page.tsx",
  "app/profile/[username]/page.tsx",
  "app/profile/user/page.tsx",
  "app/welcome/page.tsx",
  "app/contact/page.tsx",
  "app/messages/page.tsx",
  "app/messages/[userId]/page.tsx",
  "app/messages/create-group/page.tsx",
  "app/dashboard/admin/page_enhanced.tsx",
  "app/dashboard/moderator/page.tsx",
  "app/dashboard/seller/bookings/[id]/page.tsx",
  "components/common/OptimizedImage.tsx",
  "components/common/Avatar.tsx",
  "lib/auth-utils.ts",
  "lib/debug-auth.js",
];

// Import to add at top of files
const importToAdd = `import { getAPIURL, getBaseURL } from "@/lib/apiConfig";`;

function fixFile(filePath) {
  const fullPath = path.join(frontendDir, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Skip (not found): ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, "utf8");
  let modified = false;

  // Check if already has import
  if (!content.includes("apiConfig")) {
    // Find the last import statement and add our import after it
    const importMatch = content.match(/^(import .+;?\n)+/m);
    if (importMatch) {
      const lastImport = importMatch[0];
      content = content.replace(lastImport, lastImport + importToAdd + "\n");
      modified = true;
    }
  }

  // Replace patterns
  const replacements = [
    // process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
    [
      /process\.env\.NEXT_PUBLIC_API_URL \|\| ["']http:\/\/localhost:5000\/api["']/g,
      "getAPIURL()",
    ],
    // "http://localhost:5000/api"
    [/"http:\/\/localhost:5000\/api/g, "`${getAPIURL()}`"],
    // `http://localhost:5000/api
    [/`http:\/\/localhost:5000\/api/g, "`${getAPIURL()}"],
    // "http://localhost:5000"
    [/"http:\/\/localhost:5000"/g, "getBaseURL()"],
    // || "http://localhost:5000"
    [/\|\| ["']http:\/\/localhost:5000["']/g, "|| getBaseURL()"],
    // `http://localhost:5000$
    [/`http:\/\/localhost:5000\$/g, "`${getBaseURL()}$"],
  ];

  for (const [pattern, replacement] of replacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`No changes: ${filePath}`);
  }
}

console.log("Fixing API URLs in frontend files...\n");

for (const file of filesToFix) {
  fixFile(file);
}

console.log("\nDone!");
