#!/usr/bin/env node

/**
 * i18n key extraction script
 * 1. Scans the codebase for i18n keys (t('key'), Trans components, etc)
 * 2. ExtractsJSONmessages.json
 * 3. Migrates new keys to json files for translation
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Paths
const COMPONENTS_ROOT = path.join(__dirname, "..");
const APP_ROOT = path.join(__dirname, "..", "..", "app");
const MANIFEST_PATH = path.join(COMPONENTS_ROOT, "locales/manifest.json");
const LOCALES_FTL_DIR = path.join(COMPONENTS_ROOT, "locales");
const LOCALES_JSON_DIR = path.join(COMPONENTS_ROOT, "public/locales");

// Load manifest
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));

// Configuration for i18next-parser
const parserConfig = {
  contextSeparator: "_",
  createOldCatalogs: false,
  defaultNamespace: "messages",
  defaultValue: "",
  indentation: 2,
  keepRemoved: true,
  keySeparator: false,
  namespaceSeparator: false,

  lexers: {
    js: ["JavascriptLexer"],
    ts: ["JavascriptLexer"],
    jsx: ["JsxLexer"],
    tsx: ["JsxLexer"],
    html: false,
    htm: false,
    handlebars: false,
    hbs: false,
  },

  locales: manifest.supportedLocales,
  output: path.join(LOCALES_JSON_DIR, "$LOCALE/$NAMESPACE.json"),
  input: [
    path.join(COMPONENTS_ROOT, "src/**/*.{js,jsx,ts,tsx}"),
    path.join(APP_ROOT, "src/**/*.{js,jsx,ts,tsx}"),
    path.join(APP_ROOT, "components/**/*.{js,jsx,ts,tsx}"),
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/*.test.{js,jsx,ts,tsx}",
    "!**/*.spec.{js,jsx,ts,tsx}",
  ],

  verbose: true,
  sort: true,
  failOnWarnings: false,
  failOnUpdate: false,
};

/**
 * Extract keys from codebase using i18next-parser
 */
function extractKeys() {
  const configPath = path.join(__dirname, ".i18next-parser.config.js");
  const configContent = `module.exports = ${JSON.stringify(parserConfig, null, 2)};`;

  try {
    fs.writeFileSync(configPath, configContent);
    console.log("🔍 Extracting i18n keys from codebase...");

    execSync(`npx i18next-parser --config ${configPath}`, {
      stdio: "inherit",
      cwd: __dirname,
    });

    console.log("✅ Keys extracted successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error extracting i18n keys:", error.message);
    return false;
  } finally {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
}

/**
 * Read existing keys from .ftl files in a locale directory
 */
function getExistingFtlKeys(localeDir) {
  const existingKeys = new Set();

  if (!fs.existsSync(localeDir)) {
    return existingKeys;
  }

  const ftlFiles = fs
    .readdirSync(localeDir)
    .filter((file) => file.endsWith(".ftl"));

  for (const file of ftlFiles) {
    const content = fs.readFileSync(path.join(localeDir, file), "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      const keyMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\s*=/);
      if (keyMatch) {
        existingKeys.add(keyMatch[1]);
      }
    }
  }

  return existingKeys;
}

/**
 * Add new keys to a .ftl file
 */
function addKeysToFtlFile(localeDir, newKeys, locale) {
  const targetFile = path.join(localeDir, "common.ftl");

  // Create file with header if it doesn't exist
  if (!fs.existsSync(localeDir)) {
    fs.mkdirSync(localeDir, { recursive: true });
  }

  if (!fs.existsSync(targetFile)) {
    const languageName = manifest.languages[locale]?.name || locale;
    const header = `# Common translations - ${languageName}\n\n`;
    fs.writeFileSync(targetFile, header);
  }

  // Append new keys
  let content = fs.readFileSync(targetFile, "utf8");

  if (!content.endsWith("\n")) {
    content += "\n";
  }

  content += "\n# Newly extracted keys\n";
  content += newKeys.map((key) => `${key} = ${key}`).join("\n") + "\n";

  fs.writeFileSync(targetFile, content);

  return targetFile;
}

/**
 * Migrate extracted JSON keys to .ftl files
 */
function migrateKeysToFtl() {
  console.log("\n🔄 Migrating extracted keys to .ftl files...");

  let totalNewKeys = 0;
  const processedFiles = [];

  for (const locale of manifest.supportedLocales) {
    const localeJsonDir = path.join(LOCALES_JSON_DIR, locale);
    const localeFtlDir = path.join(LOCALES_FTL_DIR, locale);
    const messagesJsonPath = path.join(localeJsonDir, "messages.json");

    if (!fs.existsSync(messagesJsonPath)) {
      console.log(
        `⚠️  No messages.json found for ${locale}! You may need to run pnpm i18n:compile first!`,
      );
      continue;
    }

    // Read extracted keys
    const messagesJson = JSON.parse(fs.readFileSync(messagesJsonPath, "utf8"));
    const extractedKeys = Object.keys(messagesJson);

    // Get existing keys from .ftl files
    const existingKeys = getExistingFtlKeys(localeFtlDir);

    // Find new keys
    const newKeys = extractedKeys.filter((key) => !existingKeys.has(key));

    if (newKeys.length === 0) {
      console.log(`✅ ${locale}: Found 0 keys to migrate.`);
      continue;
    }

    console.log(`📝 ${locale}: Found ${newKeys.length} new keys to migrate:`);
    newKeys.forEach((key) => console.log(`   - ${key}`));

    // Add to .ftl file
    const targetFile = addKeysToFtlFile(localeFtlDir, newKeys, locale);
    processedFiles.push(path.relative(process.cwd(), targetFile));
    totalNewKeys += newKeys.length;
  }

  // Summary
  if (totalNewKeys === 0) {
    console.log("\n🎉 No new keys found.");
  } else {
    console.log(
      `\n🎉 Migration complete! Added ${totalNewKeys} new keys to .ftl files:`,
    );
    processedFiles.forEach((file) => console.log(`   📄 ${file}`));

    console.log("\n💡 Next steps:");
    console.log("   1. Review the new keys in your .ftl files");
    console.log("   2. Replace placeholder values with actual translations");
    console.log("   3. Run `pnpm i18n:compile` to update compiled JSON files");
  }
}

function main() {
  const success = extractKeys();

  if (success) {
    migrateKeysToFtl();
  } else {
    process.exit(1);
  }
}

main();
