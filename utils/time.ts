// Get current time in Pacific Time
export const getPSTDate = (): Date => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
};

export const formatPSTTime = (date: Date = getPSTDate()): string => {
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Parse time like "6:00p" to a Date object
export const parseTime = (timeStr: string): Date => {
  const now = getPSTDate();
  const match = timeStr.trim().match(/^(\d+):(\d+)(a|p)$/i);
  
  if (!match) {
    console.error('Invalid time format:', timeStr);
    return now;
  }
  
  let [_, hours, minutes, period] = match;
  let hour = parseInt(hours);
  
  // Convert to 24-hour format
  if (period.toLowerCase() === 'p' && hour !== 12) hour += 12;
  if (period.toLowerCase() === 'a' && hour === 12) hour = 0;
  
  const date = new Date(now);
  date.setHours(hour);
  date.setMinutes(parseInt(minutes));
  date.setSeconds(0);
  date.setMilliseconds(0);
  
  return date;
};

// Check if class runs on current day
export const isClassDay = (days: string): boolean => {
  const pstDate = getPSTDate();
  const dayOfWeek = pstDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert day of week to matching pattern in days string
  const dayMap: { [key: number]: string } = {
    1: 'M',  // Monday
    2: 'Tu', // Tuesday
    3: 'W',  // Wednesday
    4: 'Th', // Thursday
    5: 'F',  // Friday
  };

  const currentDay = dayMap[dayOfWeek];
  if (!currentDay) return false; // Weekend

  // Handle special cases for two-character days (Tu, Th)
  if (currentDay === 'Tu' || currentDay === 'Th') {
    return days.includes(currentDay);
  }

  // For single character days (M, W, F), we need to check if it's not part of Tu/Th
  if (currentDay === 'M') {
    // Check it's not part of Tu
    const mIndex = days.indexOf('M');
    return mIndex >= 0 && (mIndex === days.length - 1 || days[mIndex + 1] !== 'W' || days.includes('MW'));
  }
  
  if (currentDay === 'W') {
    // Check it's not part of MW if that's the pattern
    return days.includes('W') || days.includes('MW');
  }
  
  // For F, simple check is fine
  if (currentDay === 'F') {
    return days.includes('F');
  }

  return false;
};

export const isClassLive = (startTime: string, endTime: string, days: string): boolean => {
  if (!isClassDay(days)) return false;
  
  const now = getPSTDate();
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  return now >= start && now <= end;
};

export const isClassUpcoming = (startTime: string, endTime: string, days: string): boolean => {
  if (!isClassDay(days)) return false;
  
  const now = getPSTDate();
  const start = parseTime(startTime);
  // Class is upcoming if it starts within the next 2 hours
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  return start > now && start <= twoHoursFromNow;
};

// Format time like "6:00p" to "6:00 PM"
export const formatTime = (timeStr: string): string => {
  const match = timeStr.trim().match(/^(\d+):(\d+)(a|p)$/i);
  if (!match) return timeStr;
  
  const period = match[3].toLowerCase() === 'p' ? 'PM' : 'AM';
  return `${match[1]}:${match[2]} ${period}`;
};

export function getTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = parseTime(endTime);
  
  const diffMs = end.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 0) return '0m';
  if (diffMins < 60) return `${diffMins}m`;
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m`;
}

export function getRemainingMinutes(endTime: string): number {
  const now = new Date();
  const end = parseTime(endTime);
  
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}
