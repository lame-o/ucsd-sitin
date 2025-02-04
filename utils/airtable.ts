import Airtable from 'airtable';

// Create Airtable instances with different API keys
const mainAirtable = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
});

const descriptionsAirtable = new Airtable({
  apiKey: process.env.NEXT_PUBLIC_AIRTABLE_Descriptions_API_KEY
});

// Create base instances for Courses, Sections, and Descriptions
const coursesBase = mainAirtable.base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID_Courses!);
const sectionsBase = mainAirtable.base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID_Sections!);
const descriptionsBase = descriptionsAirtable.base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID_Descriptions!);

// Get table references
export const sectionsTable = sectionsBase(process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME_Sections!);
export const coursesTable = coursesBase(process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME_Courses!);
export const descriptionsTable = descriptionsBase(process.env.NEXT_PUBLIC_AIRTABLE_TABLE_NAME_Descriptions!);

interface Course {
  id: string;
  'Course Number': string;
  'Subject Code': string;
  'Course Name': string;
  'Units': string;
  'Sections': string[];
}

interface Section {
  id: string;
  'Subject Code': string;
  'Course Link': string | string[];
  'Meeting Type': string;
  'Time': string;
  'Building': string;
  'Room': string;
  'Instructor': string;
  'Available Seats': number;
  'Seat Limit': string;
  'Days': string;
}

interface CourseDescription {
  id: string;
  code: string;
  title: string;
  units: number;
  description: string;
  prerequisites: string;
}

export function getMinifiedRecord(record: any) {
  return {
    id: record.id,
    ...record.fields,
  }
}

export function getMinifiedRecords(records: ReadonlyArray<any> | any[]) {
  return records.map((record) => getMinifiedRecord(record))
}

export async function fetchRecords() {
  try {
    console.log('Fetching courses...');
    const courseRecords = await coursesTable.select({}).all();
    const courses = getMinifiedRecords([...courseRecords]) as Course[];
    console.log('Courses fetched:', courses.length);
    
    console.log('Fetching sections...');
    // First get all sections to process discussions
    const allSectionRecords = await sectionsTable.select({}).all();
    const allSections = getMinifiedRecords([...allSectionRecords]) as Section[];
    
    // Filter for lectures first
    const lectureSections = allSections.filter(section => 
      section['Meeting Type'] === 'Lecture' && 
      !section['Building'].includes('RCLAS')
    );

    // Process each lecture section
    const combinedData = lectureSections.map(lectureSection => {
      const courseLink = Array.isArray(lectureSection['Course Link']) 
        ? lectureSection['Course Link'][0] 
        : lectureSection['Course Link'];

      if (!courseLink) {
        console.log('Section missing Course Link:', lectureSection);
        return null;
      }
      
      const course = courses.find(c => c.id === courseLink);
      if (!course) {
        console.log('Course not found for Link:', courseLink);
        return null;
      }

      // Skip if course name contains Lab or Laboratory
      const courseName = course['Course Name'].toLowerCase();
      if (courseName.includes('lab') || courseName.includes('laboratory')) {
        return null;
      }

      // Calculate the correct seat limit
      let seatLimit = parseInt(lectureSection['Seat Limit'] || '0');
      
      // If seat limit is 0, look for associated discussion sections
      if (seatLimit === 0) {
        // Find all discussion sections for this course
        const discussionSections = allSections.filter(section => {
          const sectionCourseLink = Array.isArray(section['Course Link']) 
            ? section['Course Link'][0] 
            : section['Course Link'];
            
          return section['Meeting Type'] === 'Discussion' &&
            section['Subject Code'] === lectureSection['Subject Code'] &&
            sectionCourseLink === courseLink;
        });
        
        if (discussionSections.length > 0) {
          // Sum up the seat limits from all discussion sections
          seatLimit = discussionSections.reduce((total, section) => {
            const sectionLimit = parseInt(section['Seat Limit'] || '0');
            return total + sectionLimit;
          }, 0);
        }
      }
      
      return {
        id: lectureSection.id,
        courseId: course.id,
        courseCode: `${lectureSection['Subject Code']} ${course['Course Number']}`,
        courseName: course['Course Name'],
        professor: lectureSection['Instructor'],
        building: lectureSection['Building'],
        room: lectureSection['Room'],
        capacity: seatLimit,
        time: lectureSection['Time'],
        days: lectureSection['Days'],
        meetingType: lectureSection['Meeting Type'],
      };
    }).filter(item => item !== null);

    return { records: combinedData, error: null };
  } catch (error) {
    console.error('Error fetching Airtable records:', error);
    if (error instanceof Error) {
      return { records: [], error: error.message };
    }
    return { records: [], error: 'Error fetching data' };
  }
};

export async function fetchCourseDescriptions() {
  try {
    const records = await descriptionsTable.select({}).all();
    const minifiedRecords = getMinifiedRecords(records);
    
    return {
      records: minifiedRecords as CourseDescription[],
      error: null
    }
  } catch (error) {
    console.error('Error fetching course descriptions:', error)
    return {
      records: [],
      error: error as Error
    }
  }
};
