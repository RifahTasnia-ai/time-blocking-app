import React, { useState, useEffect } from 'react';
import { Entry, minutesTo24H, formatDuration, formatShortDate } from '../types';

interface UntitledWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  untitledEntries: Entry[];
  onSaveTitle: (entryId: string, newTitle: string) => void;
}

export const UntitledWalkthroughModal: React.FC<UntitledWalkthroughModalProps> = ({
  isOpen,
  onClose,
  untitledEntries,
  onSaveTitle,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [titleInput, setTitleInput] = useState('');

  useEffect(() => {
    setCurrentIndex(0);
    setTitleInput('');
  }, [isOpen]);

  if (!isOpen || untitledEntries.length === 0) return null;

  const currentEntry = untitledEntries[currentIndex];
  if (!currentEntry) {
    onClose();
    return null;
  }

  const handleNext = () => {
    if (titleInput.trim()) {
      onSaveTitle(currentEntry.id, titleInput.trim());
    }
    setTitleInput('');
    if (currentIndex + 1 < untitledEntries.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    setTitleInput('');
    if (currentIndex + 1 < untitledEntries.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const from = minutesTo24H(currentEntry.startMin);
  const to = minutesTo24H(currentEntry.endMin);
  const dur = formatDuration(currentEntry.startMin, currentEntry.endMin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-[#1b1a17]/25" onClick={onClose} />
      <div className="relative w-full max-w-[380px] bg-[#fbf9f5] rounded-3xl p-6 shadow-sm z-10 flex flex-col">
        <div className="flex items-center justify-between text-[13px] text-[#625e54] mb-3">
          <span>{formatShortDate(currentEntry.date)}</span>
          <span>
            {currentIndex + 1} of {untitledEntries.length}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <span className="text-[28px] font-light text-[#1d1b18] tabular-nums">
            {from}–{to}
          </span>
          <span className="text-[14px] text-[#625e54] tabular-nums">{dur}</span>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            autoFocus
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNext();
              }
            }}
            placeholder="What were you doing?"
            className="w-full bg-transparent text-[18px] text-[#1d1b18] pb-1.5 outline-none border-b border-[#2f4d80] placeholder:text-[#625e54]/60"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 h-12 rounded-full bg-[#f2ede8] text-[#625e54] text-[15px] font-medium"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 h-12 rounded-full bg-[#2f4d80] text-white text-[15px] font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
