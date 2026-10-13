# Blocks - Native Android Time-Blocking App

Blocks is a minimalistic daily time-blocking tracker built for Android using **Kotlin** and **Jetpack Compose**. It features an archival paper aesthetic inspired by Japanese stationery and Swiss typographic restraint.

## Architecture & Tech Stack

- **Single Activity**: \`MainActivity.kt\` with Jetpack Compose
- **UI Toolkit**: Jetpack Compose with custom Warm Paper Minimalist Theme (\`PaperSurface\`, \`InkPrimary\`, \`AccentIndigo\`)
- **State Management**: \`ViewModel\` + \`StateFlow\`
- **Database**: Room (offline-only SQLite, schema version 1, zero networking, no login required)
- **Time Model**: Stored as minutes since midnight (0–1440), 24-hour display (23:59 for 1440), date formatted as \`yyyy-MM-dd\`
- **Background Jobs**: WorkManager for daily Day Auto-Close near 23:59 and periodic 2-hour notification reminders for untitled blocks
- **Edge-to-Edge**: Android 15/16 edge-to-edge support with proper window insets

---

## How to Build & Install the Debug APK

### Option 1: Open in Android Studio (Recommended)

1. Open **Android Studio** (Koala, Ladybug, Meerkat, or newer).
2. Select **File > Open** and choose the \`android/\` folder.
3. Allow Gradle to sync dependencies.
4. Connect your Android device via USB (ensure **Developer Options** and **USB Debugging** are enabled on your device).
5. Select your device in the top device selector.
6. Click the green **Run (Play)** button (or press \`Shift + F10\`).
7. Android Studio will build \`assembleDebug\` and automatically install the APK to your phone.

---

### Option 2: Build APK via Command Line

From within the \`android/\` directory, run:

```bash
# On Linux / macOS:
./gradlew assembleDebug

# On Windows:
gradlew.bat assembleDebug
```

The output debug APK will be created at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Option 3: Install APK to Your Phone via ADB (USB Debugging)

1. Enable **Developer Options** on your Android phone:
   - Go to **Settings > About Phone**.
   - Tap **Build Number** 7 times until you see *"You are now a developer!"*.
2. Enable **USB Debugging**:
   - Go to **Settings > System > Developer Options**.
   - Toggle **USB Debugging** ON.
3. Connect your phone to your computer via USB cable.
4. On your phone, tap **Allow USB debugging** when prompted.
5. In your computer terminal, run:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```
6. The "Blocks" app icon will appear on your phone home screen!

---

### Option 4: Install APK Directly Without ADB

1. Copy the generated \`app-debug.apk\` file to your phone via:
   - USB File Transfer / MTP
   - Google Drive / OneDrive
   - Direct Bluetooth or messaging transfer
2. Open your phone's **Files** app.
3. Tap on \`app-debug.apk\`.
4. If prompted, allow "Install unknown apps" for your file manager.
5. Tap **Install** and open **Blocks**.

---

## App Features & Behaviors

1. **Track Screen**:
   - Chronological journal list (oldest to newest, newest at the bottom).
   - Temporal fading: older entries gently fade out upwards.
   - Dual time displays with live clock and pulsating indicator dot.
   - Editing "now" freezes the clock and turns the label blue; tapping resumes live ticking.
   - Gap auto-fill: if "from" is later than the last entry, the gap is automatically saved as an Untitled block.
   - Overlap auto-trim: if "from" precedes the last entry, overlapping blocks are trimmed with a 5-second Undo snackbar.
   - Inline row editing, touching-edge adjustment, and block splitting.
   - Left-swipe to delete with 5-second Undo.
   - "N untitled" counter with sequential walkthrough dialog.
2. **Time Picker Bottom Sheet**:
   - Two tactile snap-scrolling wheels (hours 00–23, minutes 00–59).
   - Selection window bounded by 1px hairlines.
   - Live updates with no OK button.
   - Direct digit typing option.
3. **Calendar Screen**:
   - Month matrix starting on Monday.
   - Subtle dot indicators on dates with tracked blocks.
   - Selected date indicator with dark filled circle.
4. **Day View Screen**:
   - Large editorial metric display: `tracked` label + `14h 20m` in 52px font.
   - Full chronological entries list with durations.
   - Inline editing and split actions.
5. **Export Sheet**:
   - Filter by Day, Month, or All.
   - Formats: TXT (`06:00 - 07:23 | Studying | 1h 23m`) and JSON.
   - System share sheet and file save.
