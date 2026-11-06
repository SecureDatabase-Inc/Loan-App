/**
 * Prepare (and optionally build) the Android package.
 *
 *   npm run build:android:debug
 *   npm run build:android:release
 *
 * Flags:
 *   --release   release build (requires RELEASE_* signing env vars)
 *
 * This script deliberately stops before invoking Gradle if the Android SDK is
 * not installed, and prints the toolchain installation proposal instead of
 * claiming an APK was produced.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const release = process.argv.includes("--release");

const flavor = release ? "release" : "debug";

function run(cmd, args, env) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: root, env: { ...process.env, ...env }, stdio: "inherit", shell: true });
  if (r.status !== 0) {
    console.error(`Command failed: ${cmd}`);
    process.exit(r.status ?? 1);
  }
}

// 1. Validate the API endpoint for this flavor.
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (!apiUrl) {
  console.error("NEXT_PUBLIC_API_URL must be set (see client/.env.example).");
  process.exit(1);
}
if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(apiUrl)) {
  console.error("Capacitor builds must not point at localhost/loopback.");
  process.exit(1);
}
if (release && !apiUrl.startsWith("https://")) {
  console.error("Release builds require an explicit HTTPS API endpoint.");
  process.exit(1);
}

// 2. Static export with native target.
run("node", ["node_modules/next/dist/bin/next", "build"], {
  NEXT_PUBLIC_APP_TARGET: "capacitor",
  NEXT_PUBLIC_BUILD_FLAVOR: flavor,
});

// 3. Copy web assets into the Android project.
run("npx", ["cap", "sync", "android"]);

// 4. Toolchain check.
// 4. Toolchain check.
const sdkRoot =
  process.env.ANDROID_SDK_ROOT ||
  process.env.ANDROID_HOME ||
  (process.platform === "win32"
    ? path.join(process.env.USERPROFILE || "", "Android", "Sdk")
    : path.join(process.env.HOME || "", "Android", "Sdk"));
const adb = sdkRoot ? path.join(sdkRoot, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb") : null;
const hasSdk = Boolean(sdkRoot && adb && fs.existsSync(adb));

if (!hasSdk) {
  console.log(`
============================================================
ANDROID TOOLCHAIN NOT INSTALLED — build stopped here.
No APK was generated. (Preparation up to "cap sync" succeeded.)

To complete Phase 5, install the following (approval granted separately):

Required software
  - JDK 17 or 21 (LTS). Recommended: Eclipse Temurin 21.
    Current machine has JDK 25 only, which is newer than what AGP supports.
  - Android Studio (latest stable) OR the command-line tools.
  - Android SDK Platform 35 (or the targetSdkVersion in android/build.gradle).
  - Android SDK Build-Tools 35.x.
  - Android SDK Platform-Tools (adb).
  - Android Emulator (optional, for testing).

Download sizes (approximate)
  - JDK 21 (Temurin): ~200 MB
  - Android Studio: ~1.1 GB installer, ~4-6 GB installed
  - SDK platforms + build-tools: ~1-2 GB
  - Total: ~6-8 GB

Installation locations (Windows defaults)
  - JDK: C:\\Program Files\\Eclipse Adoptium\\jdk-21.x.x
  - Android SDK: C:\\Users\\<user>\\AppData\\Local\\Android\\Sdk
  - Android Studio: C:\\Program Files\\Android\\Android Studio

Environment variables to change
  - JAVA_HOME -> JDK 21 home
  - ANDROID_HOME / ANDROID_SDK_ROOT -> Android SDK root
  - PATH -> add %ANDROID_HOME%\\platform-tools and %ANDROID_HOME%\\cmdline-tools\\latest\\bin

Existing installations that may be affected
  - Current JDK 25 remains installed; JAVA_HOME must be switched to 21 for Gradle.
  - Node / npm are unaffected.

Once installed, re-run:
  npm run build:android:${flavor}
which will then invoke Gradle:
  cd android && gradlew ${release ? "assembleRelease" : "assembleDebug"}

Signing (release only): set RELEASE_KEYSTORE, RELEASE_KEYSTORE_PASSWORD,
RELEASE_KEY_ALIAS, RELEASE_KEY_PASSWORD. Never commit the keystore.
============================================================
`);
  process.exit(0);
}

// 5. Gradle build (only if the SDK is present).
const javaHome = process.env.JAVA_HOME || "C:/Users/Nana Obeng/tools/jdk-21.0.13+9";
const task = release ? "assembleRelease" : "assembleDebug";
const gradleCwd = path.join(root, "android");
console.log(`\n> cd ${gradleCwd} && gradlew.bat ${task}`);
const gradleRun = spawnSync("gradlew.bat", [task], {
  cwd: gradleCwd,
  env: { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdkRoot, ANDROID_SDK_ROOT: sdkRoot },
  stdio: "inherit",
  shell: true,
});
if (gradleRun.status !== 0) {
  console.error("Gradle build failed.");
  process.exit(gradleRun.status ?? 1);
}
console.log(`\nBuild finished. Output: android/app/build/outputs/apk/${flavor}/`);
