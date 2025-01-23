'use client';
import { useState, useEffect } from 'react';
import { 
  isClassLive, 
  isClassUpcoming, 
  parseTime, 
  formatPSTTime, 
  formatTime, 
  getTimeRemaining,
  getRemainingMinutes 
} from '../utils/time';
import { 
  BuildingOffice2Icon, 
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  UserIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';

interface ClassItem {
  id: string
  courseId: string
  courseCode: string
  courseName: string
  professor: string
  building: string
  room: string
  capacity: number
  time: string
  days: string
  meetingType: string
}

interface LectureListProps {
  classes: ClassItem[]
  mode?: 'live' | 'catalog'
  onReady?: () => void
}

export default function LectureList({ classes, mode = 'live', onReady }: LectureListProps) {
  const [currentTime, setCurrentTime] = useState(formatPSTTime());
  const [sortedClasses, setSortedClasses] = useState<ClassItem[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [, forceUpdate] = useState({});

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatPSTTime());
      forceUpdate({}); // Force update to refresh time remaining
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sort classes when mode or classes change
  useEffect(() => {
    const sortClasses = async () => {
      if (mode === 'catalog') {
        setIsSorting(true);
        // Process in chunks to avoid blocking UI
        const chunkSize = 100;
        const chunks = Math.ceil(classes.length / chunkSize);
        const sorted = [...classes];
        
        for (let i = 0; i < chunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, classes.length);
          const chunk = sorted.slice(start, end);
          
          // Sort this chunk
          chunk.sort((a, b) => {
            const codeA = a.courseCode.toUpperCase();
            const codeB = b.courseCode.toUpperCase();
            if (codeA < codeB) return -1;
            if (codeA > codeB) return 1;
            return getStartTime(a.time) - getStartTime(b.time);
          });
          
          // Replace the chunk in the original array
          sorted.splice(start, chunk.length, ...chunk);
          
          // Let UI update
          await new Promise(resolve => setTimeout(resolve, 0));
        }
        
        // Final merge sort of all chunks
        const finalSorted = sorted.sort((a, b) => {
          const codeA = a.courseCode.toUpperCase();
          const codeB = b.courseCode.toUpperCase();
          if (codeA < codeB) return -1;
          if (codeA > codeB) return 1;
          return getStartTime(a.time) - getStartTime(b.time);
        });
        
        setSortedClasses(finalSorted);
        setIsSorting(false);
        // Only signal ready after sorting is complete
        onReady?.();
      } else {
        onReady?.();
      }
    };

    sortClasses();
  }, [mode, classes, onReady]);

  // Helper function to get start time for sorting
  const getStartTime = (time: string) => {
    const [startTime] = time.split('-');
    return parseTime(startTime).getTime();
  };

  // Split and sort classes
  const liveClasses = classes
    .filter(c => {
      const [startTime, endTime] = c.time.split('-');
      console.log(`Checking if ${c.courseCode} is live:`, c.time);
      return isClassLive(startTime, endTime);
    })
    .sort((a, b) => {
      // Get end times from time strings
      const [, endTimeA] = a.time.split('-');
      const [, endTimeB] = b.time.split('-');
      
      // Sort by most time remaining (descending)
      return getRemainingMinutes(endTimeB) - getRemainingMinutes(endTimeA);
    });

  const upcomingClasses = classes
    .filter(c => {
      const [startTime, endTime] = c.time.split('-');
      console.log(`Checking if ${c.courseCode} is upcoming:`, c.time);
      return isClassUpcoming(startTime, endTime);
    })
    .sort((a, b) => getStartTime(a.time) - getStartTime(b.time));

  const getTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const startDate = parseTime(startTime);
    
    // Get minutes until start
    const diffMins = Math.floor((startDate.getTime() - now.getTime()) / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const renderTableHeader = (showTimeRemaining = false, showBeginsIn = false) => (
    <div className={`grid ${showTimeRemaining ? 'grid-cols-[2fr,1.5fr,1fr,0.7fr,0.7fr,1.2fr,1fr]' : showBeginsIn ? 'grid-cols-[2fr,1.5fr,1fr,0.7fr,0.7fr,1.2fr,1fr]' : 'grid-cols-[2fr,1.5fr,1fr,0.7fr,0.7fr,1.2fr]'} gap-x-2 px-6 py-3 bg-gray-700 text-xs font-medium ${showTimeRemaining ? 'text-gray-100' : 'text-gray-400'} uppercase tracking-wider`}>
      <div className="pl-5">Class</div>
      <div className="pl-7">Instructor</div>
      <div className="pl-1">Building</div>
      <div className="pl-3">Room</div>
      <div className="pl-2">Seats</div>
      <div className="pl-16">Time</div>
      {showTimeRemaining && <div className="pl-4 text-yellow-400">Time Left</div>}
      {showBeginsIn && <div className="pl-4 text-blue-400">Begins In</div>}
    </div>
  );

  const renderClassRow = (classItem: ClassItem, status: 'live' | 'upcoming' | 'other' = 'other', isLast = false) => {
    const dotColor = status === 'live' ? 'bg-green-500' : status === 'upcoming' ? 'bg-yellow-500' : 'bg-gray-500';
    const dotAnimation = status === 'live' ? 'animate-pulse' : '';
    
    // Format the time range nicely
    const [startTime, endTime] = classItem.time.split('-');
    const formattedTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    
    const showTimeRemaining = status === 'live';
    const showBeginsIn = status === 'upcoming';

    // Common cell styles for vertical centering
    const cellClass = `flex items-center min-h-full gap-2 ${status === 'live' ? 'text-white font-medium' : 'text-gray-300'}`;
    const iconClass = `w-5 h-5 ${status === 'live' ? 'text-gray-300' : 'text-gray-400'} flex-shrink-0`;
    
    return (
      <div
        key={classItem.id}
        className={`grid ${showTimeRemaining ? 'grid-cols-[2fr,1.5fr,1fr,0.7fr,0.7fr,1.2fr,1fr]' : showBeginsIn ? 'grid-cols-[2fr,1.5fr,1fr,0.7fr,0.7fr,1.2fr,1fr]' : 'grid-cols-[2fr,1.5fr,1fr,0.7fr,0.7fr,1.2fr]'} gap-x-2 px-6 py-4 text-sm hover:bg-gray-700/50 ${!isLast && 'border-b border-gray-700'} min-h-[4rem]`}
      >
        <div className={cellClass}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${dotColor} ${dotAnimation} flex-shrink-0`} />
            <span className="truncate">{classItem.courseCode} • {classItem.courseName}</span>
          </div>
        </div>
        <div className={cellClass}>
          <UserIcon className={iconClass} />
          <span className="truncate">{classItem.professor}</span>
        </div>
        <div className={cellClass}>
          <BuildingOffice2Icon className={iconClass} />
          <span className="truncate">{classItem.building}</span>
        </div>
        <div className={cellClass}>
          <MapPinIcon className={iconClass} />
          <span>{classItem.room}</span>
        </div>
        <div className={cellClass}>
          <UserGroupIcon className={iconClass} />
          <span>{classItem.capacity}</span>
        </div>
        <div className={cellClass}>
          <ClockIcon className={iconClass} />
          <span className="whitespace-nowrap">{formattedTime}</span>
        </div>
        {showTimeRemaining && (
          <div className={cellClass}>
            <BoltIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <span className="whitespace-nowrap text-yellow-400">{getTimeRemaining(endTime)}</span>
          </div>
        )}
        {showBeginsIn && (
          <div className={cellClass}>
            <ArrowRightIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <span className="whitespace-nowrap text-blue-400">{getTimeUntilStart(startTime)}</span>
          </div>
        )}
      </div>
    );
  };

  if (mode === 'catalog') {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-100">Course Catalog</h1>
            <p className="text-gray-400 mt-2">All classes (not live or upcoming)</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {renderTableHeader()}
          {!isSorting && sortedClasses.map((c, i) => 
            renderClassRow(c, 'other', i === sortedClasses.length - 1)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-4xl font-bold text-blue-400">UCSD Live Lectures</h1>
          <p className="text-gray-400 mt-2">Showing {classes.length} available lectures</p>
        </div>
        <div className="text-xl font-mono text-gray-300">Current Time: {currentTime} PST</div>
      </div>

      {liveClasses.length > 0 && (
        <div>
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)] relative">
            {renderTableHeader(true, false)}
            {liveClasses.map((c, i) => 
              renderClassRow(c, 'live', i === liveClasses.length - 1)
            )}
          </div>
        </div>
      )}

      {upcomingClasses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-300 mb-4">Starting Soon</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden opacity-75">
            {renderTableHeader(false, true)}
            {upcomingClasses.map((c, i) => 
              renderClassRow(c, 'upcoming', i === upcomingClasses.length - 1)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
