'use client';
import { useState, useEffect, Fragment, useMemo, useCallback } from 'react';
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
  ArrowRightIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { Combobox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

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
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [sortByRecent, setSortByRecent] = useState(false);
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
            <h1 className="text-4xl font-bold text-gray-100">Course Catalog (...give it a second)</h1>
            <p className="text-gray-400 mt-2">Showing {classes.length} total classes</p>
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

  // Extract subjects once and memoize
  const subjects = useMemo(() => {
    console.time('subjects');
    const subjectSet = new Set<string>();
    for (const c of classes) {
      const match = c.courseCode.match(/^([A-Z]+)/);
      if (match) subjectSet.add(match[0]);
    }
    const result = Array.from(subjectSet).sort();
    console.timeEnd('subjects');
    return result;
  }, [classes]);

  // Simple string matching for filtering subjects
  const filteredSubjects = useMemo(() => {
    if (!inputValue.trim()) return subjects;
    const searchValue = inputValue.toLowerCase();
    return subjects.filter(subject => 
      subject.toLowerCase().startsWith(searchValue)
    );
  }, [subjects, inputValue]);

  // Debounced query update
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(inputValue);
    }, 100);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Handle input change immediately for responsiveness
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  // Get minutes elapsed since class started
  const getMinutesElapsed = useCallback((startTime: string) => {
    const now = new Date();
    const startDate = parseTime(startTime);
    return Math.floor((now.getTime() - startDate.getTime()) / 60000);
  }, []);

  // Memoize live classes filtering
  const filteredLiveClasses = useMemo(() => {
    let filtered = selectedSubject
      ? liveClasses.filter(c => c.courseCode.startsWith(selectedSubject))
      : liveClasses;

    // Sort based on toggle
    filtered = [...filtered].sort((a, b) => {
      if (sortByRecent) {
        // Sort by most recently started (least minutes elapsed)
        const [startTimeA] = a.time.split('-');
        const [startTimeB] = b.time.split('-');
        return getMinutesElapsed(startTimeA) - getMinutesElapsed(startTimeB);
      } else {
        // Sort by most time remaining (original sort)
        const [, endTimeA] = a.time.split('-');
        const [, endTimeB] = b.time.split('-');
        return getRemainingMinutes(endTimeB) - getRemainingMinutes(endTimeA);
      }
    });

    return filtered;
  }, [liveClasses, selectedSubject, sortByRecent, getMinutesElapsed]);

  // Memoize handlers
  const handleQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const handleSubjectChange = useCallback((value: string) => {
    setSelectedSubject(value);
    setInputValue('');
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <div>
          <h1 className="text-4xl font-bold text-blue-400">UCSD Live Lectures</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-72">
              <Combobox value={selectedSubject} onChange={handleSubjectChange}>
                <div className="relative">
                  <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-gray-700 text-left border border-gray-600 focus-within:ring-2 focus-within:ring-blue-500">
                    <Combobox.Input
                      className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-200 bg-transparent focus:outline-none"
                      displayValue={(subject: string) => subject || 'All Subjects'}
                      onChange={handleInputChange}
                      value={inputValue}
                      placeholder="Search subjects..."
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </Combobox.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                    afterLeave={() => setInputValue('')}
                  >
                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
                      <Combobox.Option
                        value=""
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-blue-500 text-white' : 'text-gray-200'
                          }`
                        }
                      >
                        {({ selected, active }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              All Subjects
                            </span>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? 'text-white' : 'text-blue-500'
                                }`}
                              >
                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                              </span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                      {filteredSubjects.map((subject) => (
                        <Combobox.Option
                          key={subject}
                          value={subject}
                          className={({ active }) =>
                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                              active ? 'bg-blue-500 text-white' : 'text-gray-200'
                            }`
                          }
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {subject}
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                    active ? 'text-white' : 'text-blue-500'
                                  }`}
                                >
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>
            </div>
            <button
              onClick={() => setSortByRecent(!sortByRecent)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white bg-gray-700 rounded-md border border-gray-600 hover:border-gray-500 transition-colors"
              title={sortByRecent ? "Sort by time remaining" : "Sort by recently started"}
            >
              <ArrowsUpDownIcon className="h-4 w-4" />
              {sortByRecent ? "Recently Started" : "Time Remaining"}
            </button>
            <p className="text-gray-400">
              Showing {filteredLiveClasses.length} live lectures
              {selectedSubject && ` in ${selectedSubject}`}
            </p>
          </div>
        </div>
        <div className="text-xl font-mono text-gray-300">Current Time: {currentTime} PST</div>
      </div>

      {filteredLiveClasses.length > 0 && (
        <div>
          <div className="bg-gray-800 rounded-lg overflow-hidden shadow-[0_0_15px_-3px_rgba(59,130,246,0.4)] relative">
            {renderTableHeader(true)}
            {filteredLiveClasses.map((c, i) => 
              renderClassRow(c, 'live', i === filteredLiveClasses.length - 1)
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
