// app/api/chat/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Helper functions for time processing
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/(\d+)(?::(\d+))?\s*([ap]m?)/i);
  if (!match) return -1;
  
  const [, hours, minutes = '0', ampm] = match;
  const baseHours = parseInt(hours);
  const mins = parseInt(minutes);
  const isPM = ampm.toLowerCase().startsWith('p');
  
  let adjustedHours = baseHours;
  if (isPM && baseHours !== 12) adjustedHours += 12;
  if (!isPM && baseHours === 12) adjustedHours = 0;
  
  return adjustedHours * 60 + mins;
}

function extractTimeConstraints(query: string): { before?: number; after?: number } {
  const constraints: { before?: number; after?: number } = {};
  
  // Before time patterns
  const beforePatterns = [
    /before\s+(\d+(?::\d+)?\s*[ap]m?)/i,
    /ends?\s+before\s+(\d+(?::\d+)?\s*[ap]m?)/i,
    /earlier\s+than\s+(\d+(?::\d+)?\s*[ap]m?)/i
  ];
  
  // After time patterns
  const afterPatterns = [
    /after\s+(\d+(?::\d+)?\s*[ap]m?)/i,
    /starts?\s+after\s+(\d+(?::\d+)?\s*[ap]m?)/i,
    /later\s+than\s+(\d+(?::\d+)?\s*[ap]m?)/i
  ];
  
  // Check before patterns
  for (const pattern of beforePatterns) {
    const match = query.match(pattern);
    if (match) {
      constraints.before = parseTimeToMinutes(match[1]);
      break;
    }
  }
  
  // Check after patterns
  for (const pattern of afterPatterns) {
    const match = query.match(pattern);
    if (match) {
      constraints.after = parseTimeToMinutes(match[1]);
      break;
    }
  }
  
  return constraints;
}

function extractSizePreference(query: string): { min?: number; max?: number } {
  const queryLower = query.toLowerCase();
  
  // Define size thresholds
  const SMALL_CLASS = 30;  // Classes <= 30 seats
  const LARGE_CLASS = 100; // Classes >= 100 seats
  
  if (queryLower.includes('small') || queryLower.includes('tiny')) {
    return { max: SMALL_CLASS };
  }
  if (queryLower.includes('large') || queryLower.includes('big')) {
    return { min: LARGE_CLASS };
  }
  return {};
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

interface FilterConditions {
  expandedDays?: { $in: string[] };
  timeOfDay?: string;
  timeStart?: { $gte: number };
  timeEnd?: { $lte: number };
  seatLimit?: { $gte: number } | { $lte: number };
}

interface CourseMetadata {
  expandedDays?: string[];
  days: string;
  time: string;
  code: string;
  title: string;
  building: string;
  room: string;
  instructor: string;
  seatLimit: number;
  description: string;
  prerequisites?: string;
  department: string;
  units: string | number;
  [key: string]: unknown;
}

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // Extract time and day information from query
    const timeKeywords = ['morning', 'afternoon', 'evening'];
    const dayKeywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    const queryLower = query.toLowerCase();
    let timeFilter: string | undefined;
    let dayFilter: string | undefined;
    
    // Extract time constraints and size preference
    const timeConstraints = extractTimeConstraints(query);
    const sizePreference = extractSizePreference(query);

    // Extract time of day from query
    for (const time of timeKeywords) {
      if (queryLower.includes(time)) {
        timeFilter = time;
        break;
      }
    }

    // Extract day from query
    for (const day of dayKeywords) {
      if (queryLower.includes(day)) {
        dayFilter = day.charAt(0).toUpperCase() + day.slice(1);
        break;
      }
    }

    // Create a rich text representation for the query
    const enhancedQuery = `
      Find courses that match the following criteria:
      Query: ${query}
      ${timeFilter ? `Time of day: ${timeFilter}` : ''}
      ${dayFilter ? `Day of week: ${dayFilter}` : ''}
      ${timeConstraints.before ? `Ends before: ${Math.floor(timeConstraints.before/60)}:${(timeConstraints.before%60).toString().padStart(2, '0')}` : ''}
      ${timeConstraints.after ? `Starts after: ${Math.floor(timeConstraints.after/60)}:${(timeConstraints.after%60).toString().padStart(2, '0')}` : ''}
      ${sizePreference.min ? `Minimum class size: ${sizePreference.min}` : ''}
      ${sizePreference.max ? `Maximum class size: ${sizePreference.max}` : ''}
    `.trim();

    // Generate embedding for the enhanced query
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: enhancedQuery,
    });
    const queryEmbedding = response.data[0].embedding;

    // Build filter conditions
    const filterConditions: FilterConditions = {};
    if (dayFilter) {
      filterConditions.expandedDays = { $in: [dayFilter] };
    }
    if (timeFilter) {
      filterConditions.timeOfDay = timeFilter;
    }
    if (timeConstraints.before !== undefined) {
      filterConditions.timeEnd = { $lte: timeConstraints.before };
    }
    if (timeConstraints.after !== undefined) {
      filterConditions.timeStart = { $gte: timeConstraints.after };
    }
    if (sizePreference.min !== undefined) {
      filterConditions.seatLimit = { $gte: sizePreference.min };
    }
    if (sizePreference.max !== undefined) {
      filterConditions.seatLimit = { $lte: sizePreference.max };
    }

    // Search Pinecone with filters
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const results = await index.query({
      vector: queryEmbedding,
      topK: 10, // Get more results for better sorting
      filter: Object.keys(filterConditions).length > 0 ? filterConditions : undefined,
      includeMetadata: true
    });

    // Sort results by seat limit if query asks for biggest/largest/large classes
    if (queryLower.includes('biggest') || 
        queryLower.includes('largest') || 
        queryLower.includes('large')   ||
        queryLower.includes('big')) {
      results.matches.sort((a, b) => {
        const seatA = (a.metadata as CourseMetadata).seatLimit || 0;
        const seatB = (b.metadata as CourseMetadata).seatLimit || 0;
        return seatB - seatA;
      });
    }

    // Sort in ascending order for small classes
    if (queryLower.includes('small') || queryLower.includes('tiny')) {
      results.matches.sort((a, b) => {
        const seatA = (a.metadata as CourseMetadata).seatLimit || 0;
        const seatB = (b.metadata as CourseMetadata).seatLimit || 0;
        return seatA - seatB;
      });
    }

    // Always limit to top 3 results for display
    results.matches = results.matches.slice(0, 3);

    // Format context with more detailed information
    const context = results.matches.map(match => {
      const metadata = match.metadata as CourseMetadata;
      const score = match.score ? Math.round(match.score * 100) : 0;
      return `
Course: ${metadata.code}: ${metadata.title}
Schedule: Meets on ${metadata.expandedDays?.join(', ') || metadata.days} at ${metadata.time}
Location: ${metadata.building} ${metadata.room}
Instructor: ${metadata.instructor}
Class Size: ${metadata.seatLimit} seats
Description: ${metadata.description}
Prerequisites: ${metadata.prerequisites || 'None'}
Department: ${metadata.department}
Units: ${metadata.units}
Relevance Score: ${score}%
      `.trim();
    }).join('\n\n');

    // Generate chat completion with improved system prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are a helpful UCSD course advisor assistant. Use the following course information to answer questions.
                   Only reference courses mentioned in the context. If you're not sure, say so.
                   Be concise but informative. Format your responses in a conversational way.
                   
                   IMPORTANT FORMATTING RULES:
                   1. Always format course information in a numbered list, even if there's only one course
                   2. Always use this exact format for each course:

                   1. **[COURSE_CODE]: [COURSE_TITLE]**

                   - **Schedule**: [DAYS_AND_TIMES]
                   - **Location**: [BUILDING_AND_ROOM]
                   - **Instructor**: [INSTRUCTOR_NAME]
                   - **Class Size**: [SIZE] seats
                   - **Description**: [DESCRIPTION]
                   - **Prerequisites**: [PREREQUISITES]
                   - **Department**: [DEPARTMENT]
                   - **Units**: [UNITS]

                   3. Add a brief introduction before the course list
                   4. Add a brief summary after the course list if relevant
                   
                   Context:\n${context}`
        },
        { role: "user", content: query }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}