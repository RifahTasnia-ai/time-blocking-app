import React, { useState } from 'react';
import { Entry, minutesTo24H, formatDuration, formatDisplayDate } from '../types';

interface ExportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Entry[];
  selectedDate: string;
  onOpenAndroidSourceModal?: () => void;
}

export const ExportSheet: React.FC<ExportSheetProps> = ({
  isOpen,
  onClose,
  entries,
  selectedDate,
  onOpenAndroidSourceModal,
}) => {
  const [range, setRange] = useState<'day' | 'month' | 'all'>('month');
  const [format, setFormat] = useState<'txt' | 'json'>('txt');

  if (!isOpen) return null;

  // Filter entries based on range
  const getFilteredEntries = (): Entry[] => {
    if (range === 'day') {
      return entries.filter((e) => e.date === selectedDate);
    }
    if (range === 'month') {
      const ym = selectedDate.substring(0, 7); // e.g. "2026-10"
      return entries.filter((e) => e.date.startsWith(ym));
    }
    return entries;
  };

  const generateExportContent = () => {
    const filtered = getFilteredEntries().sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startMin - b.startMin;
    });

    if (format === 'json') {
      const data = {
        exportedAt: new Date().toISOString(),
        entries: filtered.map((e) => ({
          date: e.date,
          from: minutesTo24H(e.startMin),
          to: minutesTo24H(e.endMin),
          title: e.title || 'Untitled',
          minutes: e.endMin - e.startMin,
        })),
      };
      return {
        text: JSON.stringify(data, null, 2),
        mime: 'application/json',
        extension: 'json',
      };
    } else {
      // TXT format grouped by date:
      // "06:00 - 07:23 | Studying | 1h 23m"
      const grouped: { [date: string]: Entry[] } = {};
      for (const e of filtered) {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
      }

      const lines: string[] = [];
      const dates = Object.keys(grouped).sort();
      for (const date of dates) {
        lines.push(`=== ${formatDisplayDate(date)} ===`);
        for (const item of grouped[date]) {
          const from = minutesTo24H(item.startMin);
          const to = minutesTo24H(item.endMin);
          const title = item.title || 'Untitled';
          const dur = formatDuration(item.startMin, item.endMin);
          lines.push(`${from} - ${to} | ${title} | ${dur}`);
        }
        lines.push('');
      }

      return {
        text: lines.join('\n').trim(),
        mime: 'text/plain',
        extension: 'txt',
      };
    }
  };

  const handleDownload = () => {
    const { text, mime, extension } = generateExportContent();
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blocks-export-${range}-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 20% Ink Scrim Overlay */}
      <div
        className="fixed inset-0 bg-[#1b1a17]/20 transition-opacity"
        onClick={onClose}
      />

      {/* Parchment Bottom Sheet */}
      <section
        aria-label="Export options"
        aria-modal="true"
        className="w-full max-w-[480px] mx-auto bg-[#fbf9f5] rounded-t-[28px] px-6 flex flex-col z-10 select-none pb-8"
        role="dialog"
      >
        {/* Grab bar */}
        <div className="w-full flex justify-center pt-4 pb-4 cursor-pointer" onClick={onClose}>
          <div className="w-[36px] h-[4px] bg-[#e6e1d6] rounded-full" />
        </div>

        <div className="flex flex-col pt-2">
          {/* Segment 1: Range Selector */}
          <div aria-label="Date range selection" className="flex items-center space-x-6" role="radiogroup">
            <button
              type="button"
              onClick={() => setRange('day')}
              className={`relative pb-2 text-[17px] leading-6 tracking-tight transition-colors cursor-pointer ${
                range === 'day' ? 'text-[#1d1b18] font-normal' : 'text-[#625e54]'
              }`}
            >
              <span>Day</span>
              {range === 'day' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2f4d80]" />
              )}
            </button>

            <span className="w-[3px] h-[3px] rounded-full bg-[#e6e2dc] self-center mb-2" />

            <button
              type="button"
              onClick={() => setRange('month')}
              className={`relative pb-2 text-[17px] leading-6 tracking-tight transition-colors cursor-pointer ${
                range === 'month' ? 'text-[#1d1b18] font-normal' : 'text-[#625e54]'
              }`}
            >
              <span>Month</span>
              {range === 'month' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2f4d80]" />
              )}
            </button>

            <span className="w-[3px] h-[3px] rounded-full bg-[#e6e2dc] self-center mb-2" />

            <button
              type="button"
              onClick={() => setRange('all')}
              className={`relative pb-2 text-[17px] leading-6 tracking-tight transition-colors cursor-pointer ${
                range === 'all' ? 'text-[#1d1b18] font-normal' : 'text-[#625e54]'
              }`}
            >
              <span>All</span>
              {range === 'all' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2f4d80]" />
              )}
            </button>
          </div>

          <div className="h-[32px]" />

          {/* Segment 2: Format Selector */}
          <div aria-label="File format selection" className="flex items-center space-x-6" role="radiogroup">
            <button
              type="button"
              onClick={() => setFormat('txt')}
              className={`relative pb-2 text-[17px] leading-6 tracking-tight transition-colors cursor-pointer ${
                format === 'txt' ? 'text-[#1d1b18] font-normal' : 'text-[#625e54]'
              }`}
            >
              <span>TXT</span>
              {format === 'txt' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2f4d80]" />
              )}
            </button>

            <span className="w-[3px] h-[3px] rounded-full bg-[#e6e2dc] self-center mb-2" />

            <button
              type="button"
              onClick={() => setFormat('json')}
              className={`relative pb-2 text-[17px] leading-6 tracking-tight transition-colors cursor-pointer ${
                format === 'json' ? 'text-[#1d1b18] font-normal' : 'text-[#625e54]'
              }`}
            >
              <span>JSON</span>
              {format === 'json' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#2f4d80]" />
              )}
            </button>
          </div>

          <div className="h-[36px]" />

          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleDownload}
            className="w-full h-[56px] rounded-full bg-[#2f4d80] text-white text-[17px] font-medium tracking-tight flex items-center justify-center active:opacity-90 transition-opacity cursor-pointer"
          >
            Download
          </button>

          {/* Android Code Package Link */}
          {onOpenAndroidSourceModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAndroidSourceModal();
              }}
              className="mt-3 text-[13px] text-[#625e54] text-center hover:text-[#1d1b18] transition-colors py-1"
            >
              Android Studio Native Project (.zip & code)
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
