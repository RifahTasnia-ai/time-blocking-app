import React, { useState, useEffect } from 'react';
import { Entry } from './types';
import {
  loadAllEntries,
  saveAllEntries,
  runDayAutoClose,
  getTodayDateString,
} from './storage';
import { TrackScreen } from './components/TrackScreen';
import { TimePickerSheet } from './components/TimePickerSheet';
import { CalendarScreen } from './components/CalendarScreen';
import { DayViewScreen } from './components/DayViewScreen';
import { ExportSheet } from './components/ExportSheet';
import { UntitledWalkthroughModal } from './components/UntitledWalkthroughModal';
import { AndroidProjectModal } from './components/AndroidProjectModal';

export default function App() {
  const [entries, setEntries] = useState<Entry[]>(() => loadAllEntries());
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayDateString());
  const [currentScreen, setCurrentScreen] = useState<'TRACK' | 'CALENDAR' | 'DAY_VIEW'>('TRACK');
  const [selectedDayViewDate, setSelectedDayViewDate] = useState<string>(() => getTodayDateString());

  // Modal / Sheet States
  const [showExportSheet, setShowExportSheet] = useState<boolean>(false);
  const [showUntitledWalkthrough, setShowUntitledWalkthrough] = useState<boolean>(false);
  const [showAndroidSourceModal, setShowAndroidSourceModal] = useState<boolean>(false);

  // Time Picker State
  const [timePicker, setTimePicker] = useState<{
    isOpen: boolean;
    minutes: number;
    label: string;
    onSelect: (m: number) => void;
  }>({
    isOpen: false,
    minutes: 0,
    label: 'time',
    onSelect: () => {},
  });

  // Undo Snackbar State (5 seconds)
  const [undoSnackbar, setUndoSnackbar] = useState<{
    message: string;
    onUndo: () => void;
    id: number;
  } | null>(null);

  // Catch-up day auto-close at app start and resume
  useEffect(() => {
    const closed = runDayAutoClose(entries);
    setEntries(closed);

    const onFocus = () => {
      setEntries((prev) => runDayAutoClose(prev));
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Sync entries updates
  const handleUpdateEntries = (newEntries: Entry[]) => {
    setEntries(newEntries);
    saveAllEntries(newEntries);
  };

  const showUndo = (message: string, onUndo: () => void) => {
    const id = Date.now();
    setUndoSnackbar({ message, onUndo, id });
    setTimeout(() => {
      setUndoSnackbar((current) => (current?.id === id ? null : current));
    }, 5000);
  };

  // Untitled entries for walkthrough (current date or all)
  const untitledEntries = entries
    .filter((e) => e.date === currentDate && !e.title.trim())
    .sort((a, b) => a.startMin - b.startMin);

  const handleSaveUntitledTitle = (entryId: string, newTitle: string) => {
    const updated = entries.map((e) =>
      e.id === entryId ? { ...e, title: newTitle.trim(), updatedAt: Date.now() } : e
    );
    handleUpdateEntries(updated);
  };

  const openTimePicker = (
    initialMin: number,
    label: string,
    onSelect: (m: number) => void
  ) => {
    setTimePicker({
      isOpen: true,
      minutes: initialMin,
      label,
      onSelect: (m) => {
        onSelect(m);
        setTimePicker((prev) => ({ ...prev, minutes: m }));
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#fdf9f3] text-[#1d1b18] flex flex-col justify-start relative antialiased selection:bg-[#e6e2dc]">
      {/* Main Screen Content */}
      <div className="flex-1 w-full flex flex-col">
        {currentScreen === 'TRACK' && (
          <TrackScreen
            currentDate={currentDate}
            entries={entries}
            onUpdateEntries={handleUpdateEntries}
            onOpenCalendar={() => setCurrentScreen('CALENDAR')}
            onOpenTimePicker={openTimePicker}
            onOpenUntitledWalkthrough={() => setShowUntitledWalkthrough(true)}
            onShowUndo={showUndo}
            onOpenAndroidSourceModal={() => setShowAndroidSourceModal(true)}
          />
        )}

        {currentScreen === 'CALENDAR' && (
          <CalendarScreen
            entries={entries}
            onBack={() => setCurrentScreen('TRACK')}
            onSelectDate={(dateStr) => {
              setSelectedDayViewDate(dateStr);
              setCurrentScreen('DAY_VIEW');
            }}
            onOpenExport={() => setShowExportSheet(true)}
          />
        )}

        {currentScreen === 'DAY_VIEW' && (
          <DayViewScreen
            date={selectedDayViewDate}
            entries={entries}
            onUpdateEntries={handleUpdateEntries}
            onBack={() => setCurrentScreen('CALENDAR')}
            onShowUndo={showUndo}
            onOpenTimePicker={(initialMin, onSelect) =>
              openTimePicker(initialMin, 'block', onSelect)
            }
          />
        )}
      </div>

      {/* Snap-Scrolling Time Picker Sheet */}
      <TimePickerSheet
        isOpen={timePicker.isOpen}
        onClose={() => setTimePicker((prev) => ({ ...prev, isOpen: false }))}
        minutes={timePicker.minutes}
        onChange={timePicker.onSelect}
        label={timePicker.label}
      />

      {/* Export Sheet */}
      <ExportSheet
        isOpen={showExportSheet}
        onClose={() => setShowExportSheet(false)}
        entries={entries}
        selectedDate={selectedDayViewDate || currentDate}
        onOpenAndroidSourceModal={() => setShowAndroidSourceModal(true)}
      />

      {/* Untitled Walkthrough Modal */}
      <UntitledWalkthroughModal
        isOpen={showUntitledWalkthrough}
        onClose={() => setShowUntitledWalkthrough(false)}
        untitledEntries={untitledEntries}
        onSaveTitle={handleSaveUntitledTitle}
      />

      {/* Native Android Project & Code Bundle Modal */}
      <AndroidProjectModal
        isOpen={showAndroidSourceModal}
        onClose={() => setShowAndroidSourceModal(false)}
      />

      {/* 5-Second Undo Toast */}
      {undoSnackbar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[360px] w-[90%] bg-[#1d1b18] text-[#fdf9f3] px-5 py-3.5 rounded-full flex items-center justify-between shadow-lg animate-fade-in">
          <span className="text-[14px] truncate">{undoSnackbar.message}</span>
          <button
            type="button"
            onClick={() => {
              undoSnackbar.onUndo();
              setUndoSnackbar(null);
            }}
            className="text-[14px] font-medium text-[#abc7ff] hover:text-white ml-4 pl-3 border-l border-white/20 active:opacity-75 transition-opacity"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}
