import React, { useState } from 'react';
import { Entry, minutesTo24H, formatDuration, formatShortDate } from '../types';
import { updateEntryEdges, splitEntry, deleteEntry } from '../storage';

interface DayViewScreenProps {
  date: string;
  entries: Entry[];
  onUpdateEntries: (updated: Entry[]) => void;
  onBack: () => void;
  onShowUndo: (msg: string, undoFn: () => void) => void;
  onOpenTimePicker: (initialMin: number, onSelect: (m: number) => void) => void;
}

export const DayViewScreen: React.FC<DayViewScreenProps> = ({
  date,
  entries,
  onUpdateEntries,
  onBack,
  onShowUndo,
  onOpenTimePicker,
}) => {
  const dayEntries = entries
    .filter((e) => e.date === date)
    .sort((a, b) => a.startMin - b.startMin);

  // Total tracked minutes
  const totalTrackedMin = dayEntries.reduce((sum, e) => sum + (e.endMin - e.startMin), 0);
  const totalHours = Math.floor(totalTrackedMin / 60);
  const totalMins = totalTrackedMin % 60;
  const totalDisplay = `${totalHours}h ${totalMins}m`;

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartMin, setEditStartMin] = useState(0);
  const [editEndMin, setEditEndMin] = useState(0);
  const [splitVal, setSplitVal] = useState<number | null>(null);

  const startEditing = (entry: Entry) => {
    setEditingEntryId(entry.id);
    setEditTitle(entry.title);
    setEditStartMin(entry.startMin);
    setEditEndMin(entry.endMin);
    setSplitVal(Math.floor((entry.startMin + entry.endMin) / 2));
  };

  const handleSaveEdit = (entry: Entry) => {
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

  const handleSplit = (entry: Entry) => {
    if (splitVal && splitVal > entry.startMin && splitVal < entry.endMin) {
      const updated = splitEntry(entries, entry.id, splitVal);
      onUpdateEntries(updated);
      setEditingEntryId(null);
    }
  };

  const handleDelete = (entry: Entry) => {
    const prev = [...entries];
    const updated = deleteEntry(entries, entry.id);
    onUpdateEntries(updated);
    setEditingEntryId(null);

    onShowUndo('Entry deleted', () => {
      onUpdateEntries(prev);
    });
  };

  return (
    <div className="flex-1 w-full max-w-[480px] mx-auto px-6 pt-safe pb-8 bg-[#fdf9f3] flex flex-col select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between w-full h-14">
        <button
          aria-label="Go back"
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 -ml-1 text-[#1d1b18] hover:opacity-60 transition-opacity"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px] leading-none">arrow_back</span>
        </button>
        <h1 className="text-[17px] text-[#1d1b18] font-normal">{formatShortDate(date)}</h1>
        <div className="w-8 h-8" />
      </header>

      {/* Big Editorial Metric Display */}
      <section className="flex flex-col pt-6 pb-10">
        <span className="text-[13px] text-[#625e54] tracking-wide">tracked</span>
        <div className="text-[52px] leading-[56px] text-[#1d1b18] font-light tracking-tight tabular-nums">
          {totalDisplay}
        </div>
      </section>

      {/* Chronological Time Log */}
      <section aria-label="Timeline entries" className="flex flex-col gap-y-7 w-full flex-1">
        {dayEntries.length === 0 ? (
          <div className="py-12 text-center text-[#625e54] text-[15px]">
            No blocks tracked for this date.
          </div>
        ) : (
          dayEntries.map((entry) => {
            const isEditing = editingEntryId === entry.id;
            const from = minutesTo24H(entry.startMin);
            const to = minutesTo24H(entry.endMin);
            const dur = formatDuration(entry.startMin, entry.endMin);
            const isUntitled = !entry.title.trim();

            if (isEditing) {
              return (
                <div
                  key={entry.id}
                  className="flex flex-col bg-[#f2ede8] rounded-2xl p-4 gap-3 border border-[#e6e2dc]"
                >
                  <div className="flex items-center justify-between text-[13px] text-[#625e54]">
                    <span>Edit block</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry)}
                      className="text-[#ba1a1a] hover:underline"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Title Input */}
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Untitled"
                    className="w-full bg-transparent text-[17px] text-[#1d1b18] pb-1 border-b border-[#2f4d80] outline-none"
                  />

                  {/* Start & End Times */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenTimePicker(editStartMin, (m) => setEditStartMin(m))
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
                        onOpenTimePicker(editEndMin, (m) => setEditEndMin(m))
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
                      value={splitVal ? minutesTo24H(splitVal) : from}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(':').map(Number);
                        setSplitVal(h * 60 + m);
                      }}
                      className="bg-[#fdf9f3] px-2 py-1 rounded text-[13px] outline-none border border-[#e6e2dc]"
                    />
                    <button
                      type="button"
                      onClick={() => handleSplit(entry)}
                      className="text-[13px] px-3 py-1 bg-[#fdf9f3] text-[#2f4d80] rounded hover:bg-[#e6e2dc]"
                    >
                      Apply Split
                    </button>
                  </div>

                  {/* Save / Cancel buttons */}
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
                      onClick={() => handleSaveEdit(entry)}
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
                onClick={() => startEditing(entry)}
                className="flex items-baseline justify-between w-full select-none cursor-pointer group hover:opacity-75 transition-opacity"
              >
                <div className="w-28 shrink-0 text-[13px] text-[#625e54] tabular-nums">
                  {from}–{to}
                </div>
                <div
                  className={`flex-1 min-w-0 pr-4 text-[17px] truncate ${
                    isUntitled ? 'text-[#625e54] italic' : 'text-[#1d1b18]'
                  }`}
                >
                  {entry.title || 'Untitled'}
                </div>
                <div className="shrink-0 text-right text-[13px] text-[#625e54] tabular-nums">
                  {dur}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Quiet Endmark of the day */}
      <footer className="pt-12 pb-4 flex justify-center items-center">
        <div className="w-1 h-1 rounded-full bg-[#625e54] opacity-40" />
      </footer>
    </div>
  );
};
