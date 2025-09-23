#!/usr/bin/env node

/**
 * Migrate extracted JSON keys back to .ftl files
 * Takes new keys from messages.json and adds them to .ftl files
 * If a key already exists in *.ftl, it is skipped
 */

const fs = require("fs");
const path = require("path");

// Load manifest to get supported locales
const manifestPath = path.join(__dirname, "../src/i18n/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const LOCALES_BASE_DIR = path.join(__dirname, "../src/i18n/locales/data");

/**
 * Read existing .ftl files for a locale and extract existing keys
 */
function getExistingFtlKeys(localeDir) {
  const existingKeys = new Set();

  if (!fs.existsSync(localeDir)) {
    return existingKeys;
  }

  const ftlFiles = fs.readdirSync(localeDir).filter((f) => f.endsWith(".ftl"));

  for (const file of ftlFiles) {
    const content = fs.readFileSync(path.join(localeDir, file), "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      // Match key = value pattern
      const keyMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\s*=/);
      if (keyMatch) {
        existingKeys.add(keyMatch[1]);
      }
    }
  }

  return existingKeys;
}

/**
 * Add new keys to the appropriate .ftl file
 */
function addKeysToFtlFile(localeDir, newKeys, locale) {
  // Determine which .ftl file to add to (default to common.ftl)
  const targetFile = path.join(localeDir, "common.ftl");

  // Create the file if it doesn't exist
  if (!fs.existsSync(targetFile)) {
    const header = `# Common translations - ${manifest.languages[locale]?.name || locale}\n\n`;
    fs.writeFileSync(targetFile, header);
  }

  // Read existing content
  let content = fs.readFileSync(targetFile, "utf8");

  // Add new keys at the end
  const newEntries = newKeys.map((key) => `${key} = ${key}`).join("\n");

  if (!content.endsWith("\n")) {
    content += "\n";
  }

  content += "\n# Newly extracted keys\n";
  content += newEntries + "\n";

  fs.writeFileSync(targetFile, content);

  return targetFile;
}

/**
 * Main migration function
 */
function migrateKeysToFtl() {
  console.log("🔄 Migrating extracted keys to .ftl files...");

  let totalNewKeys = 0;
  const processedFiles = [];

  for (const locale of manifest.supportedLocales) {
    const localeDir = path.join(LOCALES_BASE_DIR, locale);
    const messagesJsonPath = path.join(localeDir, "messages.json");

    if (!fs.existsSync(messagesJsonPath)) {
      console.log(`⚠️  No messages.json found for ${locale}, skipping...`);
      continue;
    }

    // Read extracted keys from messages.json
    const messagesJson = JSON.parse(fs.readFileSync(messagesJsonPath, "utf8"));
    const extractedKeys = Object.keys(messagesJson);

    // Get existing keys from .ftl files
    const existingKeys = getExistingFtlKeys(localeDir);

    // Find new keys that don't exist in .ftl files
    const newKeys = extractedKeys.filter((key) => !existingKeys.has(key));

    if (newKeys.length === 0) {
      console.log(`✅ ${locale}: No new keys to migrate`);
      continue;
    }

    console.log(`📝 ${locale}: Found ${newKeys.length} new keys to migrate:`);
    newKeys.forEach((key) => console.log(`   - ${key}`));

    // Add new keys to .ftl file
    const targetFile = addKeysToFtlFile(localeDir, newKeys, locale);
    processedFiles.push(path.relative(process.cwd(), targetFile));
    totalNewKeys += newKeys.length;
  }

  if (totalNewKeys === 0) {
    console.log(
      "🎉 No new keys found - all extracted keys already exist in .ftl files!",
    );
  } else {
    console.log(
      `🎉 Migration complete! Added ${totalNewKeys} new keys to .ftl files:`,
    );
    processedFiles.forEach((file) => console.log(`   📄 ${file}`));

    console.log("\n💡 Next steps:");
    console.log("   1. Review the new keys in your .ftl files");
    console.log(
      "   2. Replace the placeholder values with actual translations",
    );
    console.log("   3. Run `pnpm run i18n:compile` to update the JSON files");
    console.log("   4. Delete the test-i18n.tsx file when done");
  }
}

// Run the migration
migrateKeysToFtl();
