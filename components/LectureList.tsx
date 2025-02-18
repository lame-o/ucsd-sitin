'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
  isClassLive,
  parseTime, 
  formatPSTTime, 
  formatTime, 
  getTimeRemaining,
  getRemainingMinutes,
  isClassDay
} from '../utils/time';
import { 
  BuildingOffice2Icon, 
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  UserIcon,
  ArrowRightIcon,
  ArrowsUpDownIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import CourseTooltip from './CourseTooltip';
import { fetchCourseDescriptions } from '@/utils/airtable';

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

interface CourseDescription {
  code: string
  description: string
}

export default function LectureList({ classes, mode = 'live', onReady }: LectureListProps) {
  // Remove duplicate classes at the start
  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();
    return classes.filter(c => {
      // Create a unique key combining all relevant fields
      const key = `${c.courseCode}-${c.professor}-${c.building}-${c.room}-${c.time}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [classes]);

  const [currentTime, setCurrentTime] = useState(formatPSTTime());
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedUpcomingSubject, setSelectedUpcomingSubject] = useState<string>('');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<number>(60); // Default 1 hour (60 minutes)
  const [selectedCatalogSubject, setSelectedCatalogSubject] = useState<string>('');
  const [selectedCatalogDay, setSelectedCatalogDay] = useState<string>('');
  const [sortByRecent, setSortByRecent] = useState(false);
  const [courseDescriptions, setCourseDescriptions] = useState<Record<string, CourseDescription>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Show 50 items per page

  // Extract all unique subjects and create subject descriptions
  const { groupedSubjects, subjectDescriptions } = useMemo(() => {
    const subjectSet = new Set<string>();
    const descriptions: Record<string, string> = {
      'AAS': 'African American Studies',
      'ANBI': 'Anthro/Biological Anthropology',
      'ANAR': 'Anthropological Archaeology',
      'ANTH': 'Anthropology',
      'ANSC': 'Anthropology/Sociocultural',
      'ASTR': 'Astronomy and Astrophysics',
      'BENG': 'Bioengineering',
      'BIEB': 'Biol/Ecology, Behavior, & Evol',
      'BICD': 'Biol/Genetics,Cellular&Develop',
      'BIPN': 'Biology/Animal Physiol&Neurosc',
      'BIBC': 'Biology/Biochemistry',
      'BILD': 'Biology/Lower Division',
      'BIMM': 'Biology/Molec Biol, Microbiol',
      'CENG': 'Chemical Engineering',
      'CHEM': 'Chemistry and Biochemistry',
      'CHIN': 'Chinese Studies',
      'CCS': 'Climate Change Studies',
      'COGS': 'Cognitive Science',
      'COMM': 'Communication',
      'CSS': 'Computational Social Science',
      'CSE': 'Computer Science & Engineering',
      'CGS': 'Critical Gender Studies',
      'CAT': 'Culture, Art, & Technology',
      'DSC': 'Data Science',
      'DSGN': 'Design',
      'DOC': 'Dimensions of Culture',
      'ECON': 'Economics',
      'EDS': 'Education Studies',
      'ECE': 'Electrical & Computer Engineer',
      'ENG': 'Engineering',
      'ENVR': 'Environmental Studies',
      'ESYS': 'Environmental Systems',
      'ETHN': 'Ethnic Studies',
      'GLBH': 'Global Health',
      'GSS': 'Global South Studies',
      'HITO': 'History Topics',
      'HIAF': 'History of Africa',
      'HIEA': 'History of East Asia',
      'HIEU': 'History of Europe',
      'HILA': 'History of Latin America',
      'HISC': 'History of Science',
      'HISA': 'History of South Asia',
      'HINE': 'History of the Near East',
      'HIUS': 'History of the United States',
      'HILD': 'History, Lower Division',
      'HDS': 'Human Developmental Sciences',
      'HUM': 'Humanities',
      'INTL': 'International Studies',
      'JAPN': 'Japanese Studies',
      'JWSP': 'Jewish Studies Program',
      'LATI': 'Latin American Studies',
      'LAWS': 'Law and Society',
      'LIAB': 'Linguistics/Arabic',
      'LIGN': 'Linguistics/General',
      'LIHL': 'Linguistics/Heritage Languages',
      'LISP': 'Linguistics/Spanish',
      'LTAM': 'Literature of the Americas',
      'LTCS': 'Literature/Cultural Studies',
      'LTEU': 'Literature/European & Eurasian',
      'LTFR': 'Literature/French',
      'LTGM': 'Literature/German',
      'LTGK': 'Literature/Greek',
      'LTIT': 'Literature/Italian',
      'LTKO': 'Literature/Korean',
      'LTLA': 'Literature/Latin',
      'LTRU': 'Literature/Russian',
      'LTSP': 'Literature/Spanish',
      'LTWR': 'Literature/Writing',
      'LTEN': 'Literatures in English',
      'LTWL': 'Literatures of the World',
      'LTEA': 'Literatures/East Asian',
      'MMW': 'Making of the Modern World',
      'MATH': 'Mathematics',
      'MAE': 'Mechanical & Aerospace Engin',
      'MUS': 'Music',
      'MGT': 'Rady School of Management',
      'NANO': 'NanoEngineering',
      'PHIL': 'Philosophy',
      'PHYS': 'Physics',
      'POLI': 'Political Science',
      'PSYC': 'Psychology',
      'PH': 'Public Health',
      'RELI': 'Religion, Study of',
      'SIO': 'Scripps Inst of Oceanography',
      'SOCI': 'Sociology',
      'SE': 'Structural Engineering',
      'SYN': 'Synthesis',
      'TDAC': 'Theatre / Acting',
      'TDDE': 'Theatre / Design',
      'TDDR': 'Theatre / Directing&Stage Mgmt',
      'TDGE': 'Theatre / General',
      'TDHD': 'Dance/History',
      'TDTR': 'Dance/Theory',
      'TDHT': 'Theatre / History & Theory',
      'TMC': 'Thurgood Marshall College',
      'USP': 'Urban Studies & Planning',
      'VIS': 'Visual Arts',
      'WCWP': 'Warren College Writing Program'
    };

    // Get all subjects from classes
    uniqueClasses.forEach(c => {
      const match = c.courseCode.match(/^([A-Z]+)/);
      if (match) subjectSet.add(match[0]);
    });

    // Sort subjects and add dividers
    const sortedSubjects = Array.from(subjectSet).sort();
    const grouped: (string | null)[] = [];
    let lastInitial = '';

    sortedSubjects.forEach(subject => {
      const initial = subject[0];
      if (initial !== lastInitial) {
        if (lastInitial !== '') {
          grouped.push(null); // Add divider
        }
        lastInitial = initial;
      }
      grouped.push(subject);
    });

    return {
      groupedSubjects: grouped,
      subjectDescriptions: descriptions
    };
  }, [uniqueClasses]);

  // Fetch course descriptions once when component mounts
  useEffect(() => {
    const loadDescriptions = async () => {
      const { records, error } = await fetchCourseDescriptions();
      if (!error && records) {
        const descriptionsMap = records.reduce((acc, desc) => {
          acc[desc.code] = desc;
          return acc;
        }, {} as Record<string, CourseDescription>);
        setCourseDescriptions(descriptionsMap);
      }
    };
    
    loadDescriptions();
  }, []); // Only runs once on mount

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatPSTTime());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sort classes when mode or classes change
  useEffect(() => {
    const sortClasses = async () => {
      if (mode === 'catalog') {
        // Process in chunks to avoid blocking UI
        const chunkSize = 100;
        const chunks = Math.ceil(uniqueClasses.length / chunkSize);
        const sorted = [...uniqueClasses];
        
        for (let i = 0; i < chunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, uniqueClasses.length);
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
        
        // Remove the finalSorted assignment and just do the final sort on 'sorted'
        sorted.sort((a, b) => {
          const codeA = a.courseCode.toUpperCase();
          const codeB = b.courseCode.toUpperCase();
          if (codeA < codeB) return -1;
          if (codeA > codeB) return 1;
          return getStartTime(a.time) - getStartTime(b.time);
        });
        
        onReady?.();
      }
    };

    // Only sort if we have classes
    if (uniqueClasses.length > 0) {
      sortClasses();
    }
  }, [mode, uniqueClasses, onReady]);

  // Helper function to get start time for sorting
  const getStartTime = (time: string) => {
    const [startTime] = time.split('-');
    return parseTime(startTime).getTime();
  };

  // Memoize live classes filtering
  const filteredLiveClasses = useMemo(() => {
    return uniqueClasses
      .filter((c) => {
        const [startTime, endTime] = c.time.split('-');
        const isLive = isClassLive(startTime, endTime, c.days);
        return isLive && (!selectedSubject || c.courseCode.startsWith(selectedSubject));
      })
      .sort((a, b) => {
        if (sortByRecent) {
          const [startTimeA] = a.time.split('-');
          const [startTimeB] = b.time.split('-');
          return parseTime(startTimeB).getTime() - parseTime(startTimeA).getTime();
        } else {
          const [, endTimeA] = a.time.split('-');
          const [, endTimeB] = b.time.split('-');
          return getRemainingMinutes(endTimeB) - getRemainingMinutes(endTimeA);
        }
      });
  }, [uniqueClasses, selectedSubject, sortByRecent, currentTime]);

  // Call onReady when live classes are ready
  useEffect(() => {
    if (mode === 'live' && uniqueClasses.length > 0) {
      onReady?.();
    }
  }, [mode, uniqueClasses, onReady]);

  const upcomingClasses = useMemo(() => {
    return uniqueClasses
      .filter((c) => {
        const [startTime, endTime] = c.time.split('-');
        // A class is upcoming if it's not live and starts within the selected timeframe
        const isLive = isClassLive(startTime, endTime, c.days);
        if (isLive) return false;
        
        const startDate = parseTime(startTime);
        const minutesUntilStart = (startDate.getTime() - new Date().getTime()) / 60000;
        return isClassDay(c.days) && minutesUntilStart > 0 && minutesUntilStart <= selectedTimeFrame;
      })
      .sort((a, b) => getStartTime(a.time) - getStartTime(b.time));
  }, [uniqueClasses, selectedTimeFrame, currentTime]);

  // Count unique subjects in filtered classes
  const catalogSubjectsCount = uniqueClasses
    .filter(c => {
      if (selectedCatalogSubject && !c.courseCode.startsWith(selectedCatalogSubject)) return false;
      if (selectedCatalogDay && !c.days.includes(selectedCatalogDay)) return false;
      return true;
    })
    .reduce((subjects, c) => {
      const match = c.courseCode.match(/^([A-Z]+)/);
      if (match) subjects.add(match[0]);
      return subjects;
    }, new Set<string>())
    .size;

  // Get count of unique subjects in live lectures
  const liveSubjectsCount = useMemo(() => {
    const subjectSet = new Set<string>();
    filteredLiveClasses.forEach(c => {
      const match = c.courseCode.match(/^([A-Z]+)/);
      if (match) subjectSet.add(match[0]);
    });
    return subjectSet.size;
  }, [filteredLiveClasses]);

  // Get count of unique subjects in upcoming lectures
  const upcomingSubjectsCount = useMemo(() => {
    const subjectSet = new Set<string>();
    upcomingClasses.forEach(c => {
      const match = c.courseCode.match(/^([A-Z]+)/);
      if (match) subjectSet.add(match[0]);
    });
    return subjectSet.size;
  }, [upcomingClasses]);

  // Filter upcoming classes by subject
  const filteredUpcomingClasses = useMemo(() => {
    return selectedUpcomingSubject
      ? upcomingClasses.filter(c => c.courseCode.startsWith(selectedUpcomingSubject))
      : upcomingClasses;
  }, [upcomingClasses, selectedUpcomingSubject]);

  // Add a memoized set of subjects that have live lectures
  const liveSubjectsSet = useMemo(() => {
    const subjects = new Set<string>();
    uniqueClasses.forEach(c => {
      const [startTime, endTime] = c.time.split('-');
      if (isClassLive(startTime, endTime, c.days)) {
        const subject = c.courseCode.match(/^[A-Z]+/)?.[0] || '';
        if (subject) subjects.add(subject);
      }
    });
    return subjects;
  }, [uniqueClasses, currentTime]);

  const getTimeUntilStart = (startTime: string) => {
    const now = new Date();
    const startDate = parseTime(startTime);
    
    // Get minutes until start
    const diffMins = Math.floor((startDate.getTime() - now.getTime()) / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const renderTableHeader = (mode: 'live' | 'upcoming' | 'catalog') => (
    <div className={`grid ${mode === 'live' ? 'grid-cols-[2fr,1.5fr,0.7fr,0.7fr,0.5fr,1fr,0.7fr]' : mode === 'upcoming' ? 'grid-cols-[2fr,1.5fr,0.7fr,0.7fr,0.5fr,1fr,0.7fr]' : 'grid-cols-[2fr,1.5fr,0.7fr,0.7fr,0.5fr,0.5fr,1fr]'} gap-x-2 px-6 py-3 bg-gray-700 text-xs font-medium ${mode === 'live' ? 'text-gray-100' : 'text-gray-400'} uppercase tracking-wider`}>
      <div className="pl-6">Class</div>
      <div className="pl-10">Professor</div>
      <div className="pl-2">Building</div>
      <div className="pl-4">Room</div>
      <div className="pl-2">Seats</div>
      {!(mode === 'live' || mode === 'upcoming') && <div className="pl-2">Days</div>}
      <div className="pl-[75px]">Time</div>
      {(mode === 'live' || mode === 'upcoming') && (
        <div className={`text-right pr-2 ${mode === 'upcoming' ? 'text-gray-400' : 'text-white'}`}>
          {mode === 'live' ? 'Time Left' : 'Begins In'}
        </div>
      )}
    </div>
  );

  const renderClassRow = (classItem: ClassItem, status: 'live' | 'upcoming' | 'catalog', isLast: boolean) => {
    const dotColor = status === 'live' ? 'bg-green-500 shadow-green-500/75 shadow-[0_0_5px_3px]' : 'bg-gray-500';
    const dotAnimation = status === 'live' ? 'animate-pulse' : '';
    
    // Format the time range nicely
    const [startTime, endTime] = classItem.time.split('-');
    const formattedTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    
    // Get remaining minutes for live classes
    const remainingMinutes = status === 'live' ? getRemainingMinutes(endTime) : 0;
    const isEnding = remainingMinutes <= 30;
    const plentyOfTime = remainingMinutes > 60;
    const timeColor = isEnding ? 'text-red-400' : plentyOfTime ? 'text-green-400' : 'text-yellow-400';

    // Common cell styles for vertical centering
    const cellClass = `flex items-center min-h-full gap-2 ${status === 'live' ? 'text-white font-medium' : 'text-gray-300'}`;
    const iconClass = `w-5 h-5 ${status === 'live' ? 'text-gray-300' : 'text-gray-400'} flex-shrink-0`;
    
    // Get course description if available
    const description = courseDescriptions[classItem.courseCode] || null;
    
    return (
      <div
        key={classItem.id}
        className={`grid ${status === 'live' ? 'grid-cols-[2fr,1.5fr,0.7fr,0.7fr,0.5fr,1fr,0.7fr]' : status === 'upcoming' ? 'grid-cols-[2fr,1.5fr,0.7fr,0.7fr,0.5fr,1fr,0.7fr]' : 'grid-cols-[2fr,1.5fr,0.7fr,0.7fr,0.5fr,0.5fr,1fr]'} gap-x-2 px-6 py-4 text-sm hover:bg-gray-700/50 ${!isLast && 'border-b border-gray-700'} min-h-[4rem]`}
      >
        <div className={cellClass}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${dotColor} ${dotAnimation} flex-shrink-0`} />
            <CourseTooltip description={description}>
              <span className="truncate cursor-help">{classItem.courseCode} • {classItem.courseName}</span>
            </CourseTooltip>
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
        {status === 'catalog' && (
          <div className={cellClass}>
            <CalendarDaysIcon className={iconClass} />
            <span>{classItem.days}</span>
          </div>
        )}
        <div className={cellClass}>
          <ClockIcon className={iconClass} />
          <span>{formattedTime}</span>
        </div>
        {(status === 'live' || status === 'upcoming') && (
          <div className={`${cellClass} justify-end pr-2`}>
            {status === 'live' ? (
              <BoltIcon className={`w-5 h-5 ${timeColor} flex-shrink-0`} />
            ) : (
              <ArrowRightIcon className="w-5 h-5 text-blue-400 flex-shrink-0" />
            )}
            <span className={`whitespace-nowrap ${status === 'live' ? timeColor : 'text-blue-400'}`}>
              {status === 'live' ? getTimeRemaining(endTime) : getTimeUntilStart(startTime)}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Memoized filtered catalog classes
  const catalogClasses = useMemo(() => {
    const filtered = uniqueClasses.filter(classItem => {
      if (selectedCatalogSubject && !classItem.courseCode.startsWith(selectedCatalogSubject)) return false;
      if (selectedCatalogDay && !classItem.days.includes(selectedCatalogDay)) return false;
      return true;
    }).sort((a, b) => {
      // First sort by subject
      const aSubject = a.courseCode.split(' ')[0];
      const bSubject = b.courseCode.split(' ')[0];
      if (aSubject !== bSubject) {
        return aSubject.localeCompare(bSubject);
      }
      // Then sort by course number
      const aNum = parseInt(a.courseCode.split(' ')[1]);
      const bNum = parseInt(b.courseCode.split(' ')[1]);
      return aNum - bNum;
    });

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [uniqueClasses, selectedCatalogSubject, selectedCatalogDay, currentPage]);

  // Calculate total pages
  const totalFilteredClasses = useMemo(() => {
    return uniqueClasses.filter(classItem => {
      if (selectedCatalogSubject && !classItem.courseCode.startsWith(selectedCatalogSubject)) return false;
      if (selectedCatalogDay && !classItem.days.includes(selectedCatalogDay)) return false;
      return true;
    }).length;
  }, [uniqueClasses, selectedCatalogSubject, selectedCatalogDay]);

  const totalPages = Math.ceil(totalFilteredClasses / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCatalogSubject, selectedCatalogDay]);

  if (mode === 'catalog') {
    return (
      <div className="space-y-8">
        <div className="border-b border-gray-700 pb-4">
          <h1 className="text-4xl font-bold text-white mb-4 py-4">Course Catalog (...give it a second)</h1>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-96">
                <select
                  value={selectedCatalogSubject}
                  onChange={(e) => setSelectedCatalogSubject(e.target.value)}
                  className="w-full text-sm text-gray-300 bg-gray-700 rounded-md border border-gray-600 hover:border-yellow-500 transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f2a900] focus:ring-opacity-75 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em] bg-[right_0.75rem_center] bg-no-repeat shadow-[0_0_12px_-2px_rgba(0,0,0,0.7)]"
                >
                  <option value="">All Subjects</option>
                  <option disabled className="border-t border-gray-600 text-gray-500">
                    ──────────────────────────
                  </option>
                  {groupedSubjects.map((subject, index) => 
                    subject === null ? (
                      <option 
                        key={`divider-${index}`} 
                        disabled 
                        className="border-t border-gray-600 text-gray-500"
                      >
                        ──────────────────────────
                      </option>
                    ) : subject === '' ? null : (
                      <option key={subject} value={subject}>
                        {subject}{subjectDescriptions[subject] ? ` - ${subjectDescriptions[subject]}` : ''}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCatalogDay(selectedCatalogDay === 'M' ? '' : 'M')}
                  className={`px-3 py-1.5 rounded ${
                    selectedCatalogDay === 'M'
                      ? 'bg-gray-700 text-white shadow-[0_0_12px_-2px_rgba(0,0,0,0.7)]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  M
                </button>
                <button
                  onClick={() => setSelectedCatalogDay(selectedCatalogDay === 'Tu' ? '' : 'Tu')}
                  className={`px-3 py-1.5 rounded ${
                    selectedCatalogDay === 'Tu'
                      ? 'bg-gray-700 text-white shadow-[0_0_12px_-2px_rgba(0,0,0,0.7)]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  T
                </button>
                <button
                  onClick={() => setSelectedCatalogDay(selectedCatalogDay === 'W' ? '' : 'W')}
                  className={`px-3 py-1.5 rounded ${
                    selectedCatalogDay === 'W'
                      ? 'bg-gray-700 text-white shadow-[0_0_12px_-2px_rgba(0,0,0,0.7)]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  W
                </button>
                <button
                  onClick={() => setSelectedCatalogDay(selectedCatalogDay === 'Th' ? '' : 'Th')}
                  className={`px-3 py-1.5 rounded ${
                    selectedCatalogDay === 'Th'
                      ? 'bg-gray-700 text-white shadow-[0_0_12px_-2px_rgba(0,0,0,0.7)]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  TH
                </button>
                <button
                  onClick={() => setSelectedCatalogDay(selectedCatalogDay === 'F' ? '' : 'F')}
                  className={`px-3 py-1.5 rounded ${
                    selectedCatalogDay === 'F'
                      ? 'bg-gray-700 text-white shadow-[0_0_12px_-2px_rgba(0,0,0,0.7)]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  F
                </button>
              </div>
              <div className="flex items-center">
                <p className="text-gray-400 translate-x-4">
                  There are <span className="text-white">{totalFilteredClasses}</span> courses
                  {selectedCatalogSubject 
                    ? ` in `
                    : ` across `}
                  <span className="text-white">{selectedCatalogSubject || catalogSubjectsCount}</span> subjects{selectedCatalogDay && <> on <span className="text-white">{selectedCatalogDay === 'M' ? 'Monday' : selectedCatalogDay === 'Tu' ? 'Tuesday' : selectedCatalogDay === 'W' ? 'Wednesday' : selectedCatalogDay === 'Th' ? 'Thursday' : selectedCatalogDay === 'F' ? 'Friday' : selectedCatalogDay}</span></>}
                </p>
                {catalogClasses.length > 0 && (
                  <div className={`flex items-center gap-2 ml-auto ${selectedCatalogDay ? 'translate-x-16' : 'translate-x-44'}`}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded ${currentPage === 1 ? 'text-gray-600' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                      <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <span className="text-gray-400 text-base">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded ${currentPage === totalPages ? 'text-gray-600' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    >
                      <ChevronRightIcon className="w-6 h-6" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {catalogClasses.length > 0 ? (
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-[0_0_15px_-3px_rgba(0,0,0)] relative">
              {renderTableHeader('catalog')}
              {catalogClasses.map((c, i) => 
                renderClassRow(c, 'catalog', i === catalogClasses.length - 1)
              )}
            </div>
          ) : (
            <div className="mt-8">
              <div className="text-center py-8 text-gray-400">
                Nothing found in the catalog.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-blue-400 flex items-center gap-3 py-2">
            <Image
              src="/ucsd_logo.webp"
              alt="UCSD"
              width={175}
              height={175}
              className="-mt-1.5 h-175 w-175"
            />
            <span className="text-4xl text-white font-bold">
              Live Lectures <span className="text-3xl font-bold">🦝 {new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' })}</span>
            </span>
          </h1>
          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className="w-96">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-sm text-gray-300 bg-gray-700 rounded-md border border-gray-600 hover:border-yellow-500 transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f2a900] focus:ring-opacity-75 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em] bg-[right_0.75rem_center] bg-no-repeat shadow-[0_0_15px_-3px_rgba(0,0,0)]"
                >
                  <option value="">All Subjects</option>
                  <option disabled className="border-t border-gray-600 text-gray-500">
                    ──────────────────────────
                  </option>
                  {groupedSubjects.map((subject, index) => 
                    subject === null ? (
                      <option 
                        key={`divider-${index}`} 
                        disabled 
                        className="border-t border-gray-600 text-gray-500"
                      >
                        ──────────────────────────
                      </option>
                    ) : subject === '' ? null : (
                      <option key={subject} value={subject}>
                        {subject}{subjectDescriptions[subject] ? ` - ${subjectDescriptions[subject]}` : ''} {liveSubjectsSet.has(subject) ? '🟢' : ''}
                      </option>
                    )
                  )}
                </select>
              </div>
              <button
                onClick={() => setSortByRecent(!sortByRecent)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 bg-gray-700 rounded-md border border-gray-600 hover:border-yellow-500 transition-colors shadow-[0_0_15px_-3px_rgba(0,0,0)]"
                title={sortByRecent ? "Sort by time remaining" : "Sort by recently started"}
              >
                <ArrowsUpDownIcon className="h-4 w-4" />
                {sortByRecent ? "Recently Started" : "Time Remaining"}
              </button>
              <p className="text-gray-400">
                {filteredLiveClasses.length === 0 ? (
                  <>No live lectures{selectedSubject ? <> in <span className="text-white">{selectedSubject}</span> 🦝</> : ''}</>
                ) : (
                  <>
                    Showing <span className="text-white">{filteredLiveClasses.length}</span> live lectures
                    {selectedSubject 
                      ? <> in <span className="text-white">{selectedSubject}</span> 🦝</>
                      : <> across <span className="text-white">{liveSubjectsCount}</span> subjects</>
                    }
                  </>
                )}
              </p>
            </div>
            <div className="text-xl font-mono text-white-300 ml-auto">Current Time: {currentTime} PST</div>
          </div>
        </div>
      </div>

      <div>
        <div className="mt-4">
          {filteredLiveClasses.length > 0 ? (
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-[0_0_15px_-3px_rgba(0,0,0)] relative">
              {renderTableHeader('live')}
              {filteredLiveClasses.map((c, i) => 
                renderClassRow(c, 'live', i === filteredLiveClasses.length - 1)
              )}
            </div>
          ) : (
            <div className="mt-8">
              <div className="text-center py-8 text-gray-400">
                Nothing live right now! Check back later 🎓
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="border-b border-gray-700 pb-4">
          <h2 className="text-2xl font-bold text-gray-300">Starting Soon</h2>
          <div className="flex items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-4">
              <div className="w-96">
                <select
                  value={selectedUpcomingSubject}
                  onChange={(e) => setSelectedUpcomingSubject(e.target.value)}
                  className="w-full text-sm text-gray-300 bg-gray-700 rounded-md border border-gray-600 hover:border-yellow-500 transition-colors px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f2a900] focus:ring-opacity-75 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23999%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:0.7em] bg-[right_0.75rem_center] bg-no-repeat shadow-[0_0_10px_-3px_rgba(55,64,81,0.7)]"
                >
                  <option value="">All Subjects</option>
                  <option disabled className="border-t border-gray-600 text-gray-500">
                    ──────────────────────────
                  </option>
                  {groupedSubjects.map((subject, index) => 
                    subject === null ? (
                      <option 
                        key={`divider-${index}`} 
                        disabled 
                        className="border-t border-gray-600 text-gray-500"
                      >
                        ──────────────────────────
                      </option>
                    ) : subject === '' ? null : (
                      <option key={subject} value={subject}>
                        {subject}{subjectDescriptions[subject] ? ` - ${subjectDescriptions[subject]}` : ''}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTimeFrame(30)}
                  className={`px-3 py-1.5 rounded  ${
                    selectedTimeFrame === 30
                      ? 'bg-gray-700 text-white shadow-[0_0_10px_-3px_rgba(55,64,81,0.7)]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  30m
                </button>
                <button
                  onClick={() => setSelectedTimeFrame(60)}
                  className={`px-3 py-1.5 rounded ${
                    selectedTimeFrame === 60
                      ? 'bg-gray-700 text-white shadow-[0_0_10px_-3px_rgba(55,64,81,0.7)]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  1h
                </button>
                <button
                  onClick={() => setSelectedTimeFrame(120)}
                  className={`px-3 py-1.5 rounded ${
                    selectedTimeFrame === 120
                      ? 'bg-gray-700 text-white shadow-[0_0_10px_-3px_rgba(55,64,81,0.7)]'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  2h
                </button>
              </div>
              <p className="text-gray-400">
                {filteredUpcomingClasses.length === 0 ? (
                  <>No classes starting in the next <span className="text-white">{selectedTimeFrame === 60 ? '1h' : selectedTimeFrame === 30 ? '30m' : '2h'}</span></>
                ) : (
                  <>
                    There are <span className="text-white">{filteredUpcomingClasses.length}</span> lectures
                    {selectedUpcomingSubject 
                      ? <> in <span className="text-white">{selectedUpcomingSubject}</span></>
                      : <> across <span className="text-white">{upcomingSubjectsCount}</span> subjects</>
                    } starting within <span className="text-white">{selectedTimeFrame === 60 ? '1h' : selectedTimeFrame === 30 ? '30m' : '2h'}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        {filteredUpcomingClasses.length > 0 ? (
          <div className="mt-8">
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-[0_0_12px_-3px_rgba(55,64,81,0.7)]">
              {renderTableHeader('upcoming')}
              {filteredUpcomingClasses.map((c, i) => 
                renderClassRow(c, 'upcoming', i === filteredUpcomingClasses.length - 1)
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="text-center py-8 text-gray-400">
              You got some free time! 🎉
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
