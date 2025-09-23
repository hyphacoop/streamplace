#!/usr/bin/env node

/**
 * i18n key extraction script using i18next-parser
 * Automatically extracts translation keys from your codebase to messages.json files
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Load manifest to get supported locales
const manifestPath = path.join(__dirname, "../src/i18n/manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// Configuration for i18next-parser
const config = {
  contextSeparator: "_",
  createOldCatalogs: false,
  defaultNamespace: "messages",
  defaultValue: "",
  indentation: 2,
  keepRemoved: true, // Keep existing keys
  keySeparator: false, // Use flat keys like 'settings-title' instead of nested
  namespaceSeparator: false, // No namespace separation

  lexers: {
    js: ["JavascriptLexer"],
    ts: ["JavascriptLexer"],
    jsx: ["JsxLexer"],
    tsx: ["JsxLexer"],
    // Explicitly disable HTML lexers
    html: false,
    htm: false,
    handlebars: false,
    hbs: false,
  },

  locales: manifest.supportedLocales, // Use locales from manifest

  output: "../src/i18n/locales/data/$LOCALE/$NAMESPACE.json",

  input: [
    "../src/**/*.{js,jsx,ts,tsx}",
    "../../components/src/**/*.{js,jsx,ts,tsx}",
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/*.test.{js,jsx,ts,tsx}",
    "!**/*.spec.{js,jsx,ts,tsx}",
  ],

  verbose: true,
  sort: true,
  failOnWarnings: false,
  failOnUpdate: false, // Don't fail when new keys are added

  // Custom function detection
  // Look for: t('key'), useTranslation(), Trans component
  // These match your i18next setup
};

// Create config with absolute paths
const appRoot = path.join(__dirname, "..");
const configWithAbsolutePaths = {
  ...config,
  output: path.join(appRoot, "src/i18n/locales/data/$LOCALE/$NAMESPACE.json"),
  input: [
    path.join(appRoot, "src/**/*.{js,jsx,ts,tsx}"),
    path.join(appRoot, "components/**/*.{js,jsx,ts,tsx}"),
    path.join(path.dirname(appRoot), "components/src/**/*.{js,jsx,ts,tsx}"),
    "!**/node_modules/**",
    "!**/dist/**",
    "!**/*.test.{js,jsx,ts,tsx}",
    "!**/*.spec.{js,jsx,ts,tsx}",
  ],
};

// Write config to temporary file
const configPath = path.join(__dirname, "i18next-parser.config.js");
const configContent = `module.exports = ${JSON.stringify(configWithAbsolutePaths, null, 2)};`;

try {
  // Write config file
  fs.writeFileSync(configPath, configContent);
  console.log("🔍 Extracting i18n keys from codebase...");

  // Run i18next-parser from scripts directory so paths are correct
  const command = `npx i18next-parser --config ${configPath}`;
  execSync(command, { stdio: "inherit", cwd: __dirname });

  console.log("✅ i18n keys extracted successfully!");
  console.log("\nGenerated files:");

  // List generated files
  config.locales.forEach((locale) => {
    const filePath = config.output
      .replace("$LOCALE", locale)
      .replace("$NAMESPACE", config.defaultNamespace);
    if (fs.existsSync(filePath)) {
      console.log(`  📄 ${filePath}`);
    }
  });
} catch (error) {
  console.error("❌ Error extracting i18n keys:", error.message);
  process.exit(1);
} finally {
  // Clean up config file
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
