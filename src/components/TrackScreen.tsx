import React, { useState, useEffect, useRef } from 'react';
import {
  Entry,
  minutesTo24H,
  formatDuration,
  formatDisplayDate,
  getNowMinutes,
} from '../types';
import {
  getYesterdayDateString,
  addEntry,
  updateEntryEdges,
  splitEntry,
  deleteEntry,
} from '../storage';

interface TrackScreenProps {
  currentDate: string;
  entries: Entry[];
  onUpdateEntries: (newEntries: Entry[]) => void;
  onOpenCalendar: () => void;
  onOpenTimePicker: (initialMin: number, label: string, onSelect: (m: number) => void) => void;
  onOpenUntitledWalkthrough: () => void;
  onShowUndo: (msg: string, undoFn: () => void) => void;
  onOpenAndroidSourceModal: () => void;
}

export const TrackScreen: React.FC<TrackScreenProps> = ({
  currentDate,
  entries,
  onUpdateEntries,
  onOpenCalendar,
  onOpenTimePicker,
  onOpenUntitledWalkthrough,
  onShowUndo,
  onOpenAndroidSourceModal,
}) => {
  // Filter today's entries, sorted oldest to newest
  const dayEntries = entries
    .filter((e) => e.date === currentDate)
    .sort((a, b) => a.startMin - b.startMin);

  // Untitled count for today
  const untitledToday = dayEntries.filter((e) => !e.title.trim()).length;

  // Last entry end time
  const lastEntryEnd =
    dayEntries.length > 0 ? dayEntries[dayEntries.length - 1].endMin : 0;

  // Composer State
  const [fromMin, setFromMin] = useState<number>(lastEntryEnd);
  const [toMin, setToMin] = useState<number>(getNowMinutes());
  const [isLiveClock, setIsLiveClock] = useState<boolean>(true);
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  // Inline Row Edit State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editStartMin, setEditStartMin] = useState<number>(0);
  const [editEndMin, setEditEndMin] = useState<number>(0);
  const [splitMin, setSplitMin] = useState<number | null>(null);

  // Swipe-to-delete state
  const [swipedEntryId, setSwipedEntryId] = useState<string | null>(null);
  const touchStartXRef = useRef<number>(0);

  // Keep `fromMin` aligned when entries change, unless user manually touched it
  useEffect(() => {
    setFromMin(lastEntryEnd);
  }, [lastEntryEnd]);

  // Live Clock Interval
  useEffect(() => {
    if (!isLiveClock) return;

    const tick = () => {
      setToMin(getNowMinutes());
    };
    tick();

    const interval = setInterval(tick, 5000); // update regularly
    return () => clearInterval(interval);
  }, [isLiveClock]);

  // Ask for notification permission after first Add
  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  // Add Handler
  const handleAdd = () => {
    if (fromMin >= toMin) return;

    const res = addEntry(entries, currentDate, fromMin, toMin, activityTitle);
    onUpdateEntries(res.updatedEntries);

    // After Add:
    setActivityTitle('');
    setFromMin(toMin); // from = the new end time
    setIsLiveClock(true); // now goes live again

    requestNotificationPermission();

    // If overlap auto-trim occurred, show snackbar with Undo
    if (res.trimmedCount > 0) {
      const snap = res.previousEntriesSnapshot;
      onShowUndo(
        `Trimmed ${res.trimmedCount} overlapping block${res.trimmedCount > 1 ? 's' : ''}`,
        () => {
          onUpdateEntries(snap);
        }
      );
    }
  };

  // Live toggle handler: resume live
  const handleResumeLive = () => {
    setIsLiveClock(true);
    setToMin(getNowMinutes());
  };

  // Row swipe gestures for delete
  const handleTouchStart = (e: React.TouchEvent, entryId: string) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent, entry: Entry) => {
    const deltaX = touchStartXRef.current - e.changedTouches[0].clientX;
    if (deltaX > 80) {
      // Swiped left
      handleDeleteRow(entry);
    }
  };

  const handleDeleteRow = (entry: Entry) => {
    const prev = [...entries];
    const updated = deleteEntry(entries, entry.id);
    onUpdateEntries(updated);
    setEditingEntryId(null);

    onShowUndo('Block removed', () => {
      onUpdateEntries(prev);
    });
  };

  const handleSaveInlineEdit = (entry: Entry) => {
    const updated = updateEntryEdges(
      entries,
      entry,
      editStartMin,
      editEndMin,
      editTitle
    );
    onUpdateEntries(updated);
    setEditingEntryId(null);
  };

  const handleApplySplit = (entry: Entry) => {
    if (splitMin && splitMin > entry.startMin && splitMin < entry.endMin) {
      const updated = splitEntry(entries, entry.id, splitMin);
      onUpdateEntries(updated);
      setEditingEntryId(null);
    }
  };

  const isAddDisabled = fromMin >= toMin;

  // Calculate temporal fade: older rows fade
  const getRowOpacity = (index: number, total: number) => {
    if (total <= 1) return 1.0;
    const ratio = index / (total - 1); // 0 (oldest) to 1 (newest)
    // Map to 0.35 -> 1.0
    return 0.35 + ratio * 0.65;
  };

  return (
    <div className="flex-1 w-full max-w-[480px] mx-auto px-6 pt-safe pb-safe bg-[#fdf9f3] flex flex-col justify-between select-none min-h-[calc(100vh-2rem)]">
      {/* Top Header & Date Navigation */}
      <header className="flex flex-col w-full pt-2">
        <div className="flex items-center justify-between h-12">
          <span className="text-[13px] text-[#625e54] tracking-wide font-normal">
            {formatDisplayDate(currentDate)}
          </span>
          <div className="flex items-center gap-3">
            <button
              aria-label="Android native code"
              onClick={onOpenAndroidSourceModal}
              className="text-[12px] text-[#2f4d80] border border-[#2f4d80]/30 px-2.5 py-0.5 rounded-full hover:bg-[#2f4d80]/5 transition-colors"
              title="View and download complete native Android Kotlin project"
            >
              Native Kotlin (APK)
            </button>
            <button
              aria-label="Open Calendar"
              onClick={onOpenCalendar}
              className="flex items-center justify-center text-[#1d1b18] hover:opacity-60 transition-opacity"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px] leading-none font-extralight">
                calendar_today
              </span>
            </button>
          </div>
        </div>

        {/* Quiet Sub-Row: Yesterday & N untitled */}
        <div className="flex items-center justify-between pb-4">
          <button
            onClick={() => {
              // Could switch to yesterday view or calendar
              onOpenCalendar();
            }}
            className="text-[13px] text-[#625e54] hover:text-[#1d1b18] transition-colors flex items-center gap-0.5 cursor-pointer"
            type="button"
          >
            <span>‹</span>
            <span>Yesterday</span>
          </button>

          {untitledToday > 0 ? (
            <button
              onClick={onOpenUntitledWalkthrough}
              className="text-[13px] text-[#625e54] hover:text-[#2f4d80] tracking-tight transition-colors cursor-pointer"
              type="button"
            >
              {untitledToday} untitled
            </button>
          ) : (
            <span className="text-[13px] text-[#625e54] tracking-tight">
              0 untitled
            </span>
          )}
        </div>
      </header>

      {/* Middle: Chronological Entries List (Oldest to newest, newest at bottom, older rows fade) */}
      <main className="flex-1 flex flex-col justify-end space-y-4 pt-2 pb-6 overflow-y-auto">
        {dayEntries.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-16 text-[#625e54] text-[15px] font-light">
            Start logging your day below.
          </div>
        ) : (
          dayEntries.map((entry, index) => {
            const isEditing = editingEntryId === entry.id;
            const from = minutesTo24H(entry.startMin);
            const to = minutesTo24H(entry.endMin);
            const dur = formatDuration(entry.startMin, entry.endMin);
            const isUntitled = !entry.title.trim();
            const opacityVal = getRowOpacity(index, dayEntries.length);

            if (isEditing) {
              return (
                <div
                  key={entry.id}
                  className="flex flex-col bg-[#f2ede8] rounded-2xl p-4 gap-3 border border-[#e6e2dc] shadow-none"
                >
                  <div className="flex items-center justify-between text-[13px] text-[#625e54]">
                    <span>Edit block</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(entry)}
                      className="text-[#ba1a1a] hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Untitled"
                    className="w-full bg-transparent text-[17px] text-[#1d1b18] pb-1 border-b border-[#2f4d80] outline-none"
                  />

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTimePicker(editStartMin, 'start', (m) =>
                          setEditStartMin(m)
                        )
                      }
                      className="flex-1 py-2 px-3 bg-[#fdf9f3] rounded-lg text-left"
                    >
                      <div className="text-[11px] text-[#625e54]">from</div>
                      <div className="text-[20px] font-light tabular-nums text-[#1d1b18]">
                        {minutesTo24H(editStartMin)}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenTimePicker(editEndMin, 'to', (m) =>
                          setEditEndMin(m)
                        )
                      }
                      className="flex-1 py-2 px-3 bg-[#fdf9f3] rounded-lg text-left"
                    >
                      <div className="text-[11px] text-[#625e54]">to</div>
                      <div className="text-[20px] font-light tabular-nums text-[#1d1b18]">
                        {minutesTo24H(editEndMin)}
                      </div>
                    </button>
                  </div>

                  {/* Split Action */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[12px] text-[#625e54]">Split at:</span>
                    <input
                      type="time"
                      value={splitMin ? minutesTo24H(splitMin) : from}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(':').map(Number);
                        setSplitMin(h * 60 + m);
                      }}
                      className="bg-[#fdf9f3] px-2 py-1 rounded text-[13px] outline-none border border-[#e6e2dc]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplySplit(entry)}
                      className="text-[13px] px-3 py-1 bg-[#fdf9f3] text-[#2f4d80] rounded hover:bg-[#e6e2dc]"
                    >
                      Split
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingEntryId(null)}
                      className="text-[14px] text-[#625e54] px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveInlineEdit(entry)}
                      className="text-[14px] text-white bg-[#2f4d80] px-4 py-1.5 rounded-full"
                    >
                      Save
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={entry.id}
                onTouchStart={(e) => handleTouchStart(e, entry.id)}
                onTouchEnd={(e) => handleTouchEnd(e, entry)}
                onClick={() => {
                  setEditingEntryId(entry.id);
                  setEditTitle(entry.title);
                  setEditStartMin(entry.startMin);
                  setEditEndMin(entry.endMin);
                  setSplitMin(Math.floor((entry.startMin + entry.endMin) / 2));
                }}
                style={{ opacity: opacityVal }}
                className="flex items-baseline justify-between transition-opacity duration-300 cursor-pointer group"
                title="Tap to edit, swipe left to delete"
              >
                <span className="text-[13px] text-[#625e54] w-24 tabular-nums font-normal shrink-0">
                  {from}–{to}
                </span>
                <span
                  className={`text-[17px] flex-1 px-2 truncate ${
                    isUntitled ? 'text-[#625e54] italic' : 'text-[#1d1b18]'
                  }`}
                >
                  {entry.title || 'Untitled'}
                </span>
                <span className="text-[13px] text-[#625e54] text-right tabular-nums font-normal shrink-0">
                  {dur}
                </span>
              </div>
            );
          })
        )}
      </main>

      {/* Bottom Workspace / Composer */}
      <section className="flex flex-col mt-auto pt-4 pb-6">
        {/* Dual Synchronous Time Counters */}
        <div className="grid grid-cols-2 items-end relative">
          {/* From Segment */}
          <div
            onClick={() => {
              onOpenTimePicker(fromMin, 'from', (newM) => {
                setFromMin(newM);
              });
            }}
            className="flex flex-col pr-6 cursor-pointer"
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[12px] leading-none text-[#625e54] lowercase">
                from
              </span>
            </div>
            <span className="text-[48px] leading-none text-[#1d1b18] tabular-nums tracking-tighter font-light hover:opacity-80 transition-opacity">
              {minutesTo24H(fromMin)}
            </span>
          </div>

          {/* 1px Hairline Column Divider */}
          <div className="absolute left-1/2 top-2 bottom-1 w-[1px] bg-[#e6e2dc] pointer-events-none -translate-x-1/2" />

          {/* To / Now Segment */}
          <div className="flex flex-col pl-6">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] leading-none text-[#625e54] lowercase">
                to
              </span>
              {isLiveClock ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-normal leading-none text-[#625e54]">
                    now
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2f4d80] inline-block animate-pulse" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleResumeLive}
                  className="text-[12px] font-medium leading-none text-[#2f4d80] hover:opacity-80 transition-opacity cursor-pointer"
                  title="Click to resume live clock"
                >
                  Now
                </button>
              )}
            </div>

            <span
              onClick={() => {
                onOpenTimePicker(toMin, 'to', (newM) => {
                  setToMin(newM);
                  setIsLiveClock(false); // Freezes live clock, turns now label blue
                });
              }}
              className="text-[48px] leading-none text-[#1d1b18] tabular-nums tracking-tighter font-light cursor-pointer hover:opacity-80 transition-opacity"
            >
              {minutesTo24H(toMin)}
            </span>
          </div>
        </div>

        {/* Freeform Inline Field with Focus Underline */}
        <div className="relative mt-6 mb-6">
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={activityTitle}
            onChange={(e) => setActivityTitle(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isAddDisabled) {
                handleAdd();
              }
            }}
            placeholder="What are you doing?"
            className="w-full bg-transparent text-[22px] text-[#1d1b18] placeholder:text-[#625e54]/70 pb-2 outline-none font-normal"
          />
          {/* Neutral Hairline Base */}
          <div className="w-full h-[1px] bg-[#e6e2dc] transition-colors" />
          {/* Accent Active Focus Indicator Line */}
          <div
            className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-[#2f4d80] transition-transform duration-200 origin-left ${
              isInputFocused ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </div>

        {/* Singular Primary Pill Action */}
        <button
          type="button"
          disabled={isAddDisabled}
          onClick={handleAdd}
          className={`w-full h-14 rounded-full bg-[#2f4d80] text-white text-[17px] font-medium tracking-tight flex items-center justify-center transition-all ${
            isAddDisabled
              ? 'opacity-35 pointer-events-none'
              : 'active:opacity-80 cursor-pointer'
          }`}
        >
          Add
        </button>
      </section>
    </div>
  );
};
