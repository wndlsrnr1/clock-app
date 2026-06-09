import { chmodSync, copyFileSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDirectory, "..");
const distDirectory = join(projectRoot, "dist");
const releaseDirectory = join(projectRoot, "release", "Clock Rhythm", "macOS");
const downloadDirectory = join(projectRoot, "download");
const neutralinoMacUniversalBinary = join(projectRoot, "bin", "neutralino-mac_universal");
const packagedMacExecutable = join(distDirectory, "clock-rhythm", "clock-rhythm-mac_universal.app");
const releaseMacBundle = join(releaseDirectory, "Clock Rhythm.app");
const releaseMacContents = join(releaseMacBundle, "Contents");
const releaseMacExecutableDirectory = join(releaseMacContents, "MacOS");
const releaseMacResourcesDirectory = join(releaseMacContents, "Resources");
const releaseMacExecutable = join(releaseMacExecutableDirectory, "Clock Rhythm");
const releaseMacRuntimeExecutable = join(releaseMacResourcesDirectory, "Clock RhythmRuntime");
const releaseMacInfoPlist = join(releaseMacContents, "Info.plist");
const downloadArchive = join(downloadDirectory, "Clock Rhythm macOS.zip");

function runCommand(description, command, args, options = {}) {
  console.log("");
  console.log(`==> ${description}`);
  execFileSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    ...options,
  });
}

function ensureFileExists(path, description) {
  if (!existsSync(path)) {
    throw new Error(`${description} was not found: ${path}`);
  }

  if (statSync(path).size <= 0) {
    throw new Error(`${description} is empty: ${path}`);
  }
}

function ensureNeutralinoMacBinary() {
  if (existsSync(neutralinoMacUniversalBinary)) {
    return;
  }

  runCommand("Download Neutralino runtime binaries", "npx", ["--no-install", "neu", "update"]);
}

function createMacInfoPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>Clock Rhythm</string>
  <key>CFBundleIdentifier</key>
  <string>app.clock.personal-time-manager</string>
  <key>CFBundleName</key>
  <string>Clock Rhythm</string>
  <key>CFBundleDisplayName</key>
  <string>Clock Rhythm</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>CFBundleVersion</key>
  <string>0.1.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>11.0</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>
`;
}

function createMacLauncherScript() {
  return `#!/bin/sh
set -eu

app_support_directory="$HOME/Library/Application Support/Clock Rhythm"
runtime_directory="$app_support_directory/runtime"
runtime_executable="$runtime_directory/Clock RhythmRuntime"

mkdir -p "$runtime_directory"
cp "$(dirname "$0")/../Resources/Clock RhythmRuntime" "$runtime_executable"
chmod 755 "$runtime_executable"

exec "$runtime_executable" "$@"
`;
}

function createMacBundle() {
  rmSync(releaseMacBundle, { force: true, recursive: true });
  mkdirSync(releaseMacExecutableDirectory, { recursive: true });
  mkdirSync(releaseMacResourcesDirectory, { recursive: true });
  copyFileSync(packagedMacExecutable, releaseMacRuntimeExecutable);
  writeFileSync(releaseMacExecutable, createMacLauncherScript());
  chmodSync(releaseMacExecutable, 0o755);
  writeFileSync(releaseMacInfoPlist, createMacInfoPlist());
  runCommand("Ad-hoc sign macOS app bundle", "codesign", ["--force", "--deep", "--sign", "-", releaseMacBundle]);
  ensureFileExists(releaseMacExecutable, "release macOS executable");
  ensureFileExists(releaseMacRuntimeExecutable, "release macOS runtime executable");
}

function packageMacDownload() {
  runCommand("Run tests", "npm", ["run", "test"]);
  runCommand("Run typecheck", "npm", ["run", "typecheck"]);
  runCommand("Run lint", "npm", ["run", "lint"]);
  runCommand("Run dependency boundary check", "npm", ["run", "deps"]);
  runCommand("Build frontend", "npm", ["run", "build"]);
  ensureNeutralinoMacBinary();
  runCommand("Build embedded macOS universal executable", "npx", [
    "--no-install",
    "neu",
    "build",
    "--release",
    "--macos-bundle",
    "--embed-resources",
    "--clean",
  ]);

  ensureFileExists(packagedMacExecutable, "macOS universal executable");
  mkdirSync(releaseDirectory, { recursive: true });
  mkdirSync(downloadDirectory, { recursive: true });
  createMacBundle();

  runCommand("Create macOS download archive", "ditto", [
    "-c",
    "-k",
    "--keepParent",
    "Clock Rhythm.app",
    downloadArchive,
  ], { cwd: releaseDirectory });

  ensureFileExists(downloadArchive, "macOS download archive");

  console.log("");
  console.log("Repository macOS download archive:");
  console.log(`  ${downloadArchive}`);
  console.log("Packaged macOS app bundle:");
  console.log(`  ${releaseMacBundle}`);
}

packageMacDownload();
