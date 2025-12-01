#!/usr/bin/env node

/**
 * i18n key extraction script
 * 1. Scans the codebase for i18n keys (t('key'), Trans components, etc)
 * 2. Extracts keys into namespace JSON files (common.json, settings.json, etc)
 * 3. Migrates new keys to corresponding .ftl files for translation
 *
 * Usage:
 *   node extract-i18n.js                    # Extract keys and report new ones
 *   node extract-i18n.js --add-to=common    # Add new keys to common.ftl
 *   node extract-i18n.js --add-to=settings  # Add new keys to settings.ftl
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const addToNamespace = args
  .find((arg) => arg.startsWith("--add-to="))
  ?.split("=")[1];

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
 * Returns a map of namespace -> Set of keys
 */
function getExistingFtlKeys(localeDir) {
  const keysByNamespace = {};

  if (!fs.existsSync(localeDir)) {
    return keysByNamespace;
  }

  const ftlFiles = fs
    .readdirSync(localeDir)
    .filter((file) => file.endsWith(".ftl"));

  for (const file of ftlFiles) {
    const namespace = path.basename(file, ".ftl");
    const keys = new Set();

    const content = fs.readFileSync(path.join(localeDir, file), "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      const keyMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\s*=/);
      if (keyMatch) {
        keys.add(keyMatch[1]);
      }
    }

    keysByNamespace[namespace] = keys;
  }

  return keysByNamespace;
}

/**
 * Get all namespaces (json files) in the locale directory
 */
function getNamespaces(localeJsonDir) {
  if (!fs.existsSync(localeJsonDir)) {
    return [];
  }

  return fs
    .readdirSync(localeJsonDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"));
}

/**
 * Add new keys to a .ftl file
 */
function addKeysToFtlFile(localeDir, namespace, newKeys, locale) {
  const targetFile = path.join(localeDir, `${namespace}.ftl`);

  // Create file with header if it doesn't exist
  if (!fs.existsSync(localeDir)) {
    fs.mkdirSync(localeDir, { recursive: true });
  }

  if (!fs.existsSync(targetFile)) {
    const languageName = manifest.languages[locale]?.name || locale;
    const namespaceName =
      namespace.charAt(0).toUpperCase() + namespace.slice(1);
    const header = `# ${namespaceName} translations - ${languageName}\n\n`;
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
  console.log("\n🔄 Analyzing extracted keys...");

  const newKeysByLocaleAndNamespace = {}; // locale -> namespace -> [keys]

  // Process each locale
  for (const locale of manifest.supportedLocales) {
    const localeJsonDir = path.join(LOCALES_JSON_DIR, locale);
    const localeFtlDir = path.join(LOCALES_FTL_DIR, locale);

    if (!fs.existsSync(localeJsonDir)) {
      console.log(`⚠️  No JSON files found for ${locale}`);
      continue;
    }

    // Get all namespaces (json files)
    const namespaces = getNamespaces(localeJsonDir);

    if (namespaces.length === 0) {
      console.log(`⚠️  No namespace files found for ${locale}`);
      continue;
    }

    // Get existing keys from .ftl files
    const existingKeysByNamespace = getExistingFtlKeys(localeFtlDir);

    // Process each namespace
    for (const namespace of namespaces) {
      const jsonPath = path.join(localeJsonDir, `${namespace}.json`);
      const jsonContent = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      const extractedKeys = Object.keys(jsonContent);

      // Get existing keys for this namespace
      const existingKeys = existingKeysByNamespace[namespace] || new Set();

      // Find new keys
      const newKeys = extractedKeys.filter((key) => !existingKeys.has(key));

      if (newKeys.length > 0) {
        if (!newKeysByLocaleAndNamespace[locale]) {
          newKeysByLocaleAndNamespace[locale] = {};
        }
        newKeysByLocaleAndNamespace[locale][namespace] = newKeys;
      }
    }
  }

  // Check if there are any new keys
  const hasNewKeys = Object.keys(newKeysByLocaleAndNamespace).length > 0;

  if (!hasNewKeys) {
    console.log(
      "\n🎉 No new keys found. All extracted keys already exist in .ftl files.",
    );
    return;
  }

  // Display found keys
  console.log("\n📊 New keys found:");
  for (const locale of Object.keys(newKeysByLocaleAndNamespace)) {
    console.log(`\n${locale}:`);
    for (const namespace of Object.keys(newKeysByLocaleAndNamespace[locale])) {
      const keys = newKeysByLocaleAndNamespace[locale][namespace];
      console.log(`  📝 ${namespace} (${keys.length} new keys):`);
      keys.forEach((key) => console.log(`     - ${key}`));
    }
  }

  // If --add-to flag is provided, add keys to that namespace
  if (addToNamespace) {
    console.log(`\n✍️  Adding new keys to ${addToNamespace}.ftl files...`);

    let totalAdded = 0;
    const processedFiles = [];

    for (const locale of Object.keys(newKeysByLocaleAndNamespace)) {
      const localeFtlDir = path.join(LOCALES_FTL_DIR, locale);
      const namespacesForLocale = newKeysByLocaleAndNamespace[locale];

      // Collect all new keys across all namespaces for this locale
      const allNewKeys = [];
      for (const namespace of Object.keys(namespacesForLocale)) {
        allNewKeys.push(...namespacesForLocale[namespace]);
      }

      if (allNewKeys.length === 0) continue;

      // Add all keys to the specified namespace
      const targetFile = addKeysToFtlFile(
        localeFtlDir,
        addToNamespace,
        allNewKeys,
        locale,
      );
      processedFiles.push(path.relative(process.cwd(), targetFile));
      totalAdded += allNewKeys.length;

      console.log(
        `✅ ${locale}: Added ${allNewKeys.length} keys to ${addToNamespace}.ftl`,
      );
    }

    console.log(
      `\n🎉 Migration complete! Added ${totalAdded} new keys to ${addToNamespace}.ftl files.`,
    );
    console.log("\nModified files:");
    processedFiles.forEach((file) => console.log(`   📄 ${file}`));

    console.log("\n💡 Next steps:");
    console.log("   1. Review the new keys in your .ftl files");
    console.log("   2. Replace placeholder values with actual translations");
    console.log("   3. Run `pnpm i18n:compile` to update compiled JSON files");
  } else {
    // Just report
    let totalNewKeys = 0;
    const namespaceSet = new Set();

    for (const locale of Object.keys(newKeysByLocaleAndNamespace)) {
      for (const namespace of Object.keys(
        newKeysByLocaleAndNamespace[locale],
      )) {
        namespaceSet.add(namespace);
        totalNewKeys += newKeysByLocaleAndNamespace[locale][namespace].length;
      }
    }

    console.log(
      `\n💡 Found ${totalNewKeys} new keys across ${namespaceSet.size} namespace(s).`,
    );
    console.log("\nTo add these keys to a specific namespace file, run:");
    Array.from(namespaceSet).forEach((ns) => {
      console.log(`   node extract-i18n.js --add-to=${ns}`);
    });
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
