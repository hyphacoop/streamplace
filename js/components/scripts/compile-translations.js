#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Load language manifest
const MANIFEST_PATH = path.join(
  __dirname,
  "..",
  "src",
  "i18n",
  "manifest.json",
);
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));

// Configuration
const LOCALES_SOURCE_DIR = path.join(__dirname, "..", "locales");
const LOCALES_OUTPUT_DIR = path.join(__dirname, "..", "public", "locales");
const OUTPUT_FILENAME = "messages.json";

/**
 * Recursively find all .ftl files in a directory
 */
function findFtlFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFtlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".ftl")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Read and combine all .ftl files for a locale
 */
function combineLocaleFiles(localeDir) {
  const ftlFiles = findFtlFiles(localeDir);

  if (ftlFiles.length === 0) {
    console.warn(`⚠️  No .ftl files found in ${localeDir}`);
    return "";
  }

  const contents = [];

  for (const filePath of ftlFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const relativePath = path.relative(localeDir, filePath);

      contents.push(`# === ${relativePath} ===`);
      contents.push(content.trim());
      contents.push(""); // Empty line separator
    } catch (error) {
      console.error(`❌ Error reading ${filePath}:`, error.message);
    }
  }

  return contents.join("\n");
}

/**
 * Parse FTL content and generate JSON with key-value pairs
 * Handles multiline constructs like pluralization rules
 */
function generateJsonFromFtl(content) {
  const translations = {};
  const lines = content.split("\n");

  let currentKey = null;
  let currentValue = [];
  let insideMultiline = false;
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip comments and empty lines when not inside a multiline construct
    if (
      !insideMultiline &&
      (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("##"))
    ) {
      continue;
    }

    // Check for new key = value pair
    const keyMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(.*)$/);

    if (keyMatch && !insideMultiline) {
      // Save previous key if exists
      if (currentKey) {
        translations[currentKey] = currentValue.join("\n").trim();
      }

      const [, key, value] = keyMatch;
      currentKey = key;
      currentValue = [value];

      // Check if this starts a multiline construct (contains opening brace)
      const openBraces = (value.match(/\{/g) || []).length;
      const closeBraces = (value.match(/\}/g) || []).length;
      braceCount = openBraces - closeBraces;

      if (braceCount > 0) {
        insideMultiline = true;
      } else {
        // Single line value, save immediately
        translations[currentKey] = value.trim();
        currentKey = null;
        currentValue = [];
      }
    } else if (insideMultiline && currentKey) {
      // Continue accumulating multiline value
      currentValue.push(line); // Preserve original formatting including indentation

      // Count braces to detect end of multiline construct
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceCount += openBraces - closeBraces;

      if (braceCount <= 0) {
        // End of multiline construct
        translations[currentKey] = currentValue.join("\n").trim();
        currentKey = null;
        currentValue = [];
        insideMultiline = false;
        braceCount = 0;
      }
    }
  }

  // Handle any remaining key
  if (currentKey) {
    translations[currentKey] = currentValue.join("\n").trim();
  }

  return JSON.stringify(translations, null, 2);
}

/**
 * Main compilation function
 */
function compileTranslations() {
  console.log("🌍 Compiling translation files...");

  if (!fs.existsSync(LOCALES_SOURCE_DIR)) {
    console.error(`❌ Locales directory not found: ${LOCALES_SOURCE_DIR}`);
    process.exit(1);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(LOCALES_OUTPUT_DIR)) {
    fs.mkdirSync(LOCALES_OUTPUT_DIR, { recursive: true });
  }

  // Get supported locales from manifest, but only include those with actual data directories
  const manifestLocales = manifest.supportedLocales;
  const locales = manifestLocales.filter((locale) => {
    const localeDir = path.join(LOCALES_SOURCE_DIR, locale);
    return fs.existsSync(localeDir) && fs.statSync(localeDir).isDirectory();
  });

  if (locales.length === 0) {
    console.error(`❌ No locale directories found in ${LOCALES_SOURCE_DIR}`);
    process.exit(1);
  }

  let totalFiles = 0;

  // Process each locale
  for (const locale of locales) {
    const localeSourceDir = path.join(LOCALES_SOURCE_DIR, locale);
    const localeOutputDir = path.join(LOCALES_OUTPUT_DIR, locale);
    const outputPath = path.join(localeOutputDir, OUTPUT_FILENAME);

    console.log(`📦 Processing locale: ${locale}`);

    // Create locale output directory
    if (!fs.existsSync(localeOutputDir)) {
      fs.mkdirSync(localeOutputDir, { recursive: true });
    }

    // Combine all .ftl files for this locale
    const combinedContent = combineLocaleFiles(localeSourceDir);

    if (!combinedContent.trim()) {
      console.warn(`⚠️  Skipping ${locale} - no content found`);
      continue;
    }

    // Generate JSON from FTL content
    const jsonContent = generateJsonFromFtl(combinedContent);

    // Write the output file
    try {
      fs.writeFileSync(outputPath, jsonContent, "utf-8");
      console.log(`✅ Generated: ${path.relative(process.cwd(), outputPath)}`);
      totalFiles++;
    } catch (error) {
      console.error(`❌ Error writing ${outputPath}:`, error.message);
    }
  }

  console.log(`🎉 Compilation complete! ${totalFiles} files generated.`);
}

// Run the compilation
compileTranslations();
