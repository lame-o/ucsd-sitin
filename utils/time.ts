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
  
  console.log(`Parsed "${timeStr}" to:`, date.toLocaleTimeString());
  return date;
};

export const isClassLive = (startTime: string, endTime: string): boolean => {
  const now = getPSTDate();
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  console.log('Class time check:');
  console.log('Current:', now.toLocaleTimeString());
  console.log('Start:', start.toLocaleTimeString());
  console.log('End:', end.toLocaleTimeString());
  
  const isLive = now >= start && now <= end;
  console.log('Is live:', isLive);
  return isLive;
};

export const isClassUpcoming = (startTime: string, endTime: string): boolean => {
  const now = getPSTDate();
  const start = parseTime(startTime);
  
  // Class is upcoming if it starts within the next 2 hours
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  console.log('Upcoming check:');
  console.log('Current:', now.toLocaleTimeString());
  console.log('Start:', start.toLocaleTimeString());
  console.log('Two hours from now:', twoHoursFromNow.toLocaleTimeString());
  
  const isUpcoming = start > now && start <= twoHoursFromNow;
  console.log('Is upcoming:', isUpcoming);
  return isUpcoming;
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
