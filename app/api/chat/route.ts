// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Helper functions for day and time processing
function expandDays(days: string): string[] {
  const dayMap: { [key: string]: string } = {
    'M': 'Monday',
    'Tu': 'Tuesday',
    'W': 'Wednesday',
    'Th': 'Thursday',
    'F': 'Friday'
  };
  const expanded = [];
  let i = 0;
  while (i < days.length) {
    if (i < days.length - 1 && days.substring(i, i + 2) === 'Tu') {
      expanded.push('Tuesday');
      i += 2;
    } else if (i < days.length - 1 && days.substring(i, i + 2) === 'Th') {
      expanded.push('Thursday');
      i += 2;
    } else {
      const current = days[i];
      if (dayMap[current]) {
        expanded.push(dayMap[current]);
      }
      i++;
    }
  }
  return expanded;
}

function getTimeOfDay(time: string): string {
  const [timeStr, ampm] = time.split(/([ap])/i);
  const [hours] = timeStr.split(':').map(Number);
  const isPM = ampm.toLowerCase() === 'p';
  const hour24 = isPM ? (hours === 12 ? 12 : hours + 12) : (hours === 12 ? 0 : hours);
  
  if (hour24 < 12) return 'morning';
  if (hour24 < 17) return 'afternoon';
  return 'evening';
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    
    // Extract time and day information from query
    const timeKeywords = ['morning', 'afternoon', 'evening'];
    const dayKeywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    const queryLower = query.toLowerCase();
    let timeFilter: string | undefined;
    let dayFilter: string | undefined;

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
    `.trim();

    // Generate embedding for the enhanced query
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: enhancedQuery,
    });
    const queryEmbedding = response.data[0].embedding;

    // Build filter conditions
    const filterConditions: any = {};
    if (dayFilter) {
      filterConditions.expandedDays = { $in: [dayFilter] };
    }
    if (timeFilter) {
      filterConditions.timeOfDay = timeFilter;
    }

    // Search Pinecone with filters
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const results = await index.query({
      vector: queryEmbedding,
      topK: 5,
      filter: Object.keys(filterConditions).length > 0 ? filterConditions : undefined,
      includeMetadata: true
    });

    // Format context with more detailed information
    const context = results.matches.map(match => {
      const metadata = match.metadata as any;
      const score = match.score ? Math.round(match.score * 100) : 0;
      return `
Course: ${metadata.code}: ${metadata.title}
Schedule: Meets on ${metadata.expandedDays?.join(', ') || metadata.days} at ${metadata.time}
Location: ${metadata.building} ${metadata.room}
Instructor: ${metadata.instructor}
Availability: ${metadata.availableSeats}/${metadata.seatLimit} seats available
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
                   When discussing course schedules, always mention both the days and times.
                   When discussing course availability, mention the number of seats available.
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