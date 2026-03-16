# Build Burn Care as Android APK

## What you need installed
- Node.js (already have it)
- Android Studio — download from https://developer.android.com/studio
- Java JDK 17 — Android Studio installs this automatically

---

## Step 1 — Install dependencies
Open terminal in your project folder:
```bash
npm install
```

## Step 2 — Build the React app
```bash
npm run build
```
This creates the `build/` folder.

## Step 3 — Add Android platform
```bash
npx cap add android
```
This creates an `android/` folder in your project.

## Step 4 — Sync web code to Android
```bash
npx cap sync android
```
Run this every time you make changes to the app.

## Step 5 — Open in Android Studio
```bash
npx cap open android
```
Android Studio will open automatically.

## Step 6 — Build APK in Android Studio
1. Wait for Gradle to finish syncing (bottom bar shows progress)
2. Menu → **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait 2-3 minutes
4. Click **"locate"** in the popup notification
5. APK is at: `android/app/build/outputs/apk/debug/app-debug.apk`

## Step 7 — Install on Android phone
- Transfer the APK file to your phone via USB or WhatsApp
- On phone: tap the APK file → Allow installation from unknown sources → Install

---

## After making code changes
Every time you update the app:
```bash
npm run build
npx cap sync android
```
Then rebuild APK in Android Studio.

---

## App details
- App ID: com.burncare.app
- App Name: Burn Care
- Min Android: 5.0 (API 21)

---

## Troubleshooting
- **Gradle sync fails** → File → Invalidate Caches → Restart
- **SDK not found** → Android Studio → SDK Manager → install Android 14 (API 34)
- **Build fails** → check that Java 17 is selected in File → Project Structure → SDK
