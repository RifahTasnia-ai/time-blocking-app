import React, { useState, useEffect, useRef } from 'react';
import { padZero } from '../types';

interface TimePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  minutes: number; // 0 - 1440
  onChange: (newMinutes: number) => void;
  label?: string; // e.g., "from" or "to"
}

export const TimePickerSheet: React.FC<TimePickerSheetProps> = ({
  isOpen,
  onClose,
  minutes,
  onChange,
  label = 'Time',
}) => {
  const currentHour = Math.min(23, Math.floor(minutes / 60));
  const currentMin = Math.min(59, minutes % 60);

  const [mode, setMode] = useState<'wheel' | 'type'>('wheel');
  const [typedHour, setTypedHour] = useState(padZero(currentHour));
  const [typedMin, setTypedMin] = useState(padZero(currentMin));

  useEffect(() => {
    setTypedHour(padZero(currentHour));
    setTypedMin(padZero(currentMin));
  }, [currentHour, currentMin]);

  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(5);
      } catch {
        // Ignore if blocked
      }
    }
  };

  const updateHour = (h: number) => {
    const validH = (h + 24) % 24;
    triggerHaptic();
    onChange(validH * 60 + currentMin);
  };

  const updateMin = (m: number) => {
    const validM = (m + 60) % 60;
    triggerHaptic();
    onChange(currentHour * 60 + validM);
  };

  const hourColumnRef = useRef<HTMLDivElement>(null);
  const minColumnRef = useRef<HTMLDivElement>(null);

  // Drag interaction for wheel
  const setupDrag = (
    ref: React.RefObject<HTMLDivElement | null>,
    isHour: boolean
  ) => {
    let startY = 0;
    let accumulated = 0;

    const onTouchStart = (e: TouchEvent | MouseEvent) => {
      startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      accumulated = 0;
    };

    const onTouchMove = (e: TouchEvent | MouseEvent) => {
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const delta = startY - y;
      startY = y;
      accumulated += delta;

      if (Math.abs(accumulated) > 26) {
        const step = accumulated > 0 ? 1 : -1;
        if (isHour) {
          updateHour(currentHour + step);
        } else {
          updateMin(currentMin + step);
        }
        accumulated = 0;
      }
    };

    const elem = ref.current;
    if (!elem) return;

    elem.addEventListener('touchstart', onTouchStart, { passive: true });
    elem.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      elem.removeEventListener('touchstart', onTouchStart);
      elem.removeEventListener('touchmove', onTouchMove);
    };
  };

  useEffect(() => {
    if (!isOpen || mode !== 'wheel') return;
    const cleanHour = setupDrag(hourColumnRef, true);
    const cleanMin = setupDrag(minColumnRef, false);
    return () => {
      cleanHour?.();
      cleanMin?.();
    };
  }, [isOpen, mode, currentHour, currentMin]);

  // Handle wheel mouse scroll
  const handleHourWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const step = e.deltaY > 0 ? 1 : -1;
    updateHour(currentHour + step);
  };

  const handleMinWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const step = e.deltaY > 0 ? 1 : -1;
    updateMin(currentMin + step);
  };

  if (!isOpen) return null;

  const offsets = [-2, -1, 0, 1, 2];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 20% Ink Scrim Overlay */}
      <div
        className="fixed inset-0 bg-[#1b1a17]/20 transition-opacity"
        onClick={onClose}
      />

      {/* Parchment Bottom Sheet Container */}
      <div className="relative w-full max-w-[480px] mx-auto bg-[#fbf9f5] rounded-t-[28px] px-6 pt-3 pb-8 flex flex-col items-center select-none shadow-none z-10">
        {/* Tactile Grab Bar */}
        <div className="w-full flex justify-center py-2 cursor-pointer" onClick={onClose}>
          <div className="w-[36px] h-[4px] rounded-full bg-[#e6e1d6]" />
        </div>

        {/* Header / Mode Switcher */}
        <div className="w-full flex items-center justify-between mt-1 mb-2">
          <span className="text-[13px] text-[#625e54] capitalize tracking-wide font-normal">
            Adjust {label}
          </span>
          <button
            type="button"
            onClick={() => setMode(mode === 'wheel' ? 'type' : 'wheel')}
            className="text-[13px] text-[#2f4d80] font-medium tracking-tight hover:opacity-80 transition-opacity"
          >
            {mode === 'wheel' ? 'Type digits' : 'Wheel picker'}
          </button>
        </div>

        {mode === 'wheel' ? (
          /* Dual Scrolling Time Wheel Layout */
          <div className="relative w-full py-4 flex justify-center items-center overflow-hidden touch-none">
            {/* Selection Window: Hairline border */}
            <div className="absolute inset-x-6 pointer-events-none z-20 top-1/2 -translate-y-1/2 h-[56px] flex flex-col justify-between">
              <div className="h-[1px] w-full bg-[#e6e1d6]" />
              <div className="h-[1px] w-full bg-[#e6e1d6]" />
            </div>

            {/* Top and Bottom Archival Paper Scrim Gradients */}
            <div className="absolute top-0 inset-x-0 h-16 pointer-events-none z-30 bg-gradient-to-b from-[#fbf9f5] via-[#fbf9f5]/80 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-16 pointer-events-none z-30 bg-gradient-to-t from-[#fbf9f5] via-[#fbf9f5]/80 to-transparent" />

            {/* Dual Wheels */}
            <div className="flex items-center justify-center w-full max-w-[280px]">
              {/* Hours Column */}
              <div
                ref={hourColumnRef}
                onWheel={handleHourWheel}
                className="flex-1 flex flex-col items-center relative py-1 cursor-ns-resize"
              >
                {offsets.map((offset) => {
                  const val = (currentHour + offset + 24) % 24;
                  const isCenter = offset === 0;
                  const isNear = Math.abs(offset) === 1;
                  return (
                    <button
                      key={`h-${offset}`}
                      type="button"
                      onClick={() => updateHour(val)}
                      className={`h-[44px] flex items-center justify-center font-light tabular-nums transition-all ${
                        isCenter
                          ? 'h-[56px] opacity-100 text-[42px] leading-[56px] text-[#1d1b18] font-normal tracking-tight'
                          : isNear
                          ? 'opacity-45 text-[40px] leading-[44px] text-[#1d1b18]'
                          : 'opacity-15 text-[40px] leading-[44px] text-[#1d1b18]'
                      }`}
                    >
                      {padZero(val)}
                    </button>
                  );
                })}
              </div>

              {/* Quiet Colon Divider */}
              <div className="w-8 flex items-center justify-center text-[40px] leading-[56px] font-light text-[#1d1b18] z-10 pb-1 select-none">
                :
              </div>

              {/* Minutes Column */}
              <div
                ref={minColumnRef}
                onWheel={handleMinWheel}
                className="flex-1 flex flex-col items-center relative py-1 cursor-ns-resize"
              >
                {offsets.map((offset) => {
                  const val = (currentMin + offset + 60) % 60;
                  const isCenter = offset === 0;
                  const isNear = Math.abs(offset) === 1;
                  return (
                    <button
                      key={`m-${offset}`}
                      type="button"
                      onClick={() => updateMin(val)}
                      className={`h-[44px] flex items-center justify-center font-light tabular-nums transition-all ${
                        isCenter
                          ? 'h-[56px] opacity-100 text-[42px] leading-[56px] text-[#1d1b18] font-normal tracking-tight'
                          : isNear
                          ? 'opacity-45 text-[40px] leading-[44px] text-[#1d1b18]'
                          : 'opacity-15 text-[40px] leading-[44px] text-[#1d1b18]'
                      }`}
                    >
                      {padZero(val)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Direct Digit Typing Mode */
          <div className="w-full flex flex-col items-center py-6">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="23"
                value={typedHour}
                onChange={(e) => {
                  setTypedHour(e.target.value);
                  const h = parseInt(e.target.value, 10);
                  if (!isNaN(h) && h >= 0 && h <= 23) {
                    onChange(h * 60 + currentMin);
                  }
                }}
                className="w-20 text-center text-[42px] font-light text-[#1d1b18] bg-transparent border-b-2 border-[#2f4d80] outline-none tabular-nums"
              />
              <span className="text-[36px] font-light text-[#1d1b18]">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={typedMin}
                onChange={(e) => {
                  setTypedMin(e.target.value);
                  const m = parseInt(e.target.value, 10);
                  if (!isNaN(m) && m >= 0 && m <= 59) {
                    onChange(currentHour * 60 + m);
                  }
                }}
                className="w-20 text-center text-[42px] font-light text-[#1d1b18] bg-transparent border-b-2 border-[#2f4d80] outline-none tabular-nums"
              />
            </div>
            <p className="text-[12px] text-[#625e54] mt-3">24-hour format (00–23 : 00–59)</p>
          </div>
        )}

        {/* Close hint */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-3 rounded-full bg-[#f2ede8] text-[#1d1b18] text-[15px] font-medium tracking-tight active:opacity-80"
        >
          Done
        </button>
      </div>
    </div>
  );
};
