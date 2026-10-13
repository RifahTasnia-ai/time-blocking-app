import React, { useState } from 'react';
import { Entry, padZero } from '../types';

interface CalendarScreenProps {
  entries: Entry[];
  onSelectDate: (dateStr: string) => void;
  onBack: () => void;
  onOpenExport: () => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  entries,
  onSelectDate,
  onBack,
  onOpenExport,
}) => {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${padZero(today.getMonth() + 1)}-${padZero(today.getDate())}`;

  // Month metadata
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Build grid: Monday = 0, Sunday = 6
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // In JS getDay(), Sunday is 0, Monday is 1...
  // Shift so Monday is index 0
  const mondayOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Set of dates that have entries
  const entryDateSet = new Set(entries.map((e) => e.date));

  return (
    <div className="flex-1 w-full max-w-[480px] mx-auto px-6 pt-4 pb-8 bg-[#fdf9f3] flex flex-col select-none">
      {/* Minimal Top Navigation Bar */}
      <header className="flex items-center justify-between w-full h-14">
        <button
          aria-label="Go back"
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 -ml-1 text-[#1d1b18] active:opacity-40 transition-opacity"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px] leading-none">arrow_back</span>
        </button>
        <button
          onClick={onOpenExport}
          className="text-[13px] text-[#2f4d80] font-medium tracking-tight active:opacity-50 transition-opacity"
          type="button"
        >
          Export
        </button>
      </header>

      {/* Month Header */}
      <div className="flex items-center justify-between w-full mt-6 mb-6">
        <button
          aria-label="Previous month"
          onClick={handlePrevMonth}
          className="flex items-center justify-center w-8 h-8 text-[#1d1b18] active:opacity-40 transition-opacity"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px] leading-none">chevron_left</span>
        </button>
        <div className="flex flex-col items-center justify-center">
          <span className="text-[13px] text-[#625e54] tracking-normal mb-0.5">
            {currentYear}
          </span>
          <h1 className="text-[22px] text-[#1d1b18] font-light tracking-tight">
            {monthNames[currentMonth]}
          </h1>
        </div>
        <button
          aria-label="Next month"
          onClick={handleNextMonth}
          className="flex items-center justify-center w-8 h-8 text-[#1d1b18] active:opacity-40 transition-opacity"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px] leading-none">chevron_right</span>
        </button>
      </div>

      {/* Calendar Matrix */}
      <div className="w-full">
        {/* Day of Week Headings (Monday Start) */}
        <div className="grid grid-cols-7 w-full text-center mb-4">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <span key={i} className="text-[13px] text-[#625e54] font-normal">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Numerical Grid */}
        <div className="grid grid-cols-7 w-full gap-y-4 text-center tabular-nums">
          {/* Leading empty cells */}
          {Array.from({ length: mondayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 opacity-0 pointer-events-none" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYear}-${padZero(currentMonth + 1)}-${padZero(dayNum)}`;
            const hasEntries = entryDateSet.has(dateStr);
            const isToday = dateStr === todayStr;

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className="group flex flex-col items-center justify-center h-10 relative cursor-pointer"
                type="button"
              >
                <div
                  className={`flex items-center justify-center w-[34px] h-[34px] rounded-full transition-colors ${
                    isToday ? 'font-medium text-[#2f4d80]' : 'text-[#1d1b18]'
                  }`}
                >
                  <span className="text-[17px] leading-none">{dayNum}</span>
                </div>
                {hasEntries && (
                  <span className="w-1 h-1 rounded-full bg-[#625e54] absolute bottom-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
