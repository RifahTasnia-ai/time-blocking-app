import React, { useState } from 'react';
import JSZip from 'jszip';
import { ANDROID_CODE_FILES } from '../androidCodeBundle';

interface AndroidProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFileKey, setSelectedFileKey] = useState<string>(
    'MainActivity.kt'
  );
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();

      // Add each file to the zip archive
      for (const [filePath, content] of Object.entries(ANDROID_CODE_FILES)) {
        zip.file(filePath, content);
      }

      // Add root README.md
      zip.file(
        'README.md',
        `# Blocks - Native Android App

A minimalistic daily time-blocking tracker built with Kotlin and Jetpack Compose.

## How to Build & Install

### Method 1: Android Studio (Recommended)
1. Extract this ZIP folder.
2. Open Android Studio -> **File > Open** -> select the unzipped directory.
3. Wait for Gradle sync to complete.
4. Connect your phone via USB with **USB Debugging enabled** (or start an emulator).
5. Press the green **Run (Play)** button, or press Shift+F10.

### Method 2: Command Line (Build APK)
1. Open a terminal in this project root.
2. Run:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
   (On Windows: \`gradlew.bat assembleDebug\`)
3. The built debug APK will be generated at:
   \`app/build/outputs/apk/debug/app-debug.apk\`

### Method 3: Install APK to Phone
- **Via ADB**:
  \`\`\`bash
  adb install -r app/build/outputs/apk/debug/app-debug.apk
  \`\`\`
- **Via Direct Transfer**:
  Copy \`app-debug.apk\` to your phone via Google Drive, WhatsApp, or USB transfer, and tap the APK to install.
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Blocks-Android-Native.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentFileContent =
    ANDROID_CODE_FILES[selectedFileKey] ||
    Object.values(ANDROID_CODE_FILES)[0] ||
    '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="fixed inset-0 bg-[#1b1a17]/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#fdf9f3] rounded-3xl p-5 sm:p-6 shadow-xl z-10 flex flex-col overflow-hidden border border-[#e6e2dc]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e6e2dc]">
          <div>
            <h2 className="text-[18px] font-medium text-[#1d1b18]">
              Native Android Project (Kotlin + Jetpack Compose)
            </h2>
            <p className="text-[12px] text-[#625e54]">
              Single Activity, Room Database, StateFlow, WorkManager, MinSdk 26
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#625e54] hover:bg-[#e6e2dc]"
          >
            ✕
          </button>
        </div>

        {/* Action bar with ZIP download and guide */}
        <div className="py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#e6e2dc]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="px-4 py-2 bg-[#2f4d80] text-white text-[14px] font-medium rounded-full flex items-center gap-1.5 active:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {isDownloading ? 'Packaging ZIP...' : 'Download Project ZIP'}
            </button>
            <span className="text-[12px] text-[#625e54]">
              Ready for Android Studio & ./gradlew assembleDebug
            </span>
          </div>

          <div className="text-[12px] text-[#2f4d80] font-medium">
            100% Native Kotlin & Jetpack Compose
          </div>
        </div>

        {/* File Tabs & Source Viewer */}
        <div className="flex-1 flex flex-col md:flex-row gap-3 py-3 overflow-hidden">
          {/* File list */}
          <div className="w-full md:w-56 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto pr-1 border-r border-[#e6e2dc]/60">
            {Object.keys(ANDROID_CODE_FILES).map((fileName) => {
              const displayName = fileName.split('/').pop() || fileName;
              const isSelected = selectedFileKey === fileName;
              return (
                <button
                  key={fileName}
                  type="button"
                  onClick={() => setSelectedFileKey(fileName)}
                  className={`text-left text-[12px] px-2.5 py-1.5 rounded-lg whitespace-nowrap truncate transition-colors ${
                    isSelected
                      ? 'bg-[#2f4d80] text-white font-medium'
                      : 'text-[#625e54] hover:bg-[#f2ede8]'
                  }`}
                  title={fileName}
                >
                  {displayName}
                </button>
              );
            })}
          </div>

          {/* Code display */}
          <div className="flex-1 bg-[#1d1b18] text-[#f8f3ed] rounded-xl p-3 overflow-auto font-mono text-[12px] leading-relaxed">
            <div className="text-[11px] text-[#9a958a] pb-2 mb-2 border-b border-[#43474f]">
              {selectedFileKey}
            </div>
            <pre className="whitespace-pre overflow-x-auto">
              <code>{currentFileContent}</code>
            </pre>
          </div>
        </div>

        {/* Footer Quick Instructions */}
        <div className="pt-3 border-t border-[#e6e2dc] flex items-center justify-between text-[12px] text-[#625e54]">
          <div>
            Install via: <code>adb install -r app/build/outputs/apk/debug/app-debug.apk</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#f2ede8] text-[#1d1b18] rounded-full hover:bg-[#e6e2dc]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
