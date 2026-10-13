export interface Entry {
  id: string;
  date: string; // 'yyyy-MM-dd'
  startMin: number; // 0 - 1440
  endMin: number; // 0 - 1440
  title: string; // Empty or string. Empty title displays as "Untitled"
  createdAt: number;
  updatedAt: number;
}

export function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function minutesTo24H(mins: number): string {
  if (mins >= 1440) return '23:59';
  if (mins < 0) return '00:00';
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${padZero(hours)}:${padZero(minutes)}`;
}

export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatDuration(startMin: number, endMin: number): string {
  const diff = Math.max(0, endMin - startMin);
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = padZero(date.getMonth() + 1);
  const d = padZero(date.getDate());
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(dateStr: string): string {
  // Returns e.g. "Tue, 13 Oct" or "13 Oct"
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday}, ${day} ${month}`;
}

export function formatShortDate(dateStr: string): string {
  // Returns e.g. "13 Oct"
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month}`;
}

export function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}
