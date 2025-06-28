import { NextApiRequest, NextApiResponse } from 'next';
import AIService from '../../../lib/aiService';

// Helper function for fallback mapping
function createFallbackMapping(headers: string[], entity: 'clients' | 'workers' | 'tasks'): any {
  const fallbackMapping: any = {};
  headers.forEach((header: string) => {
    const lowerHeader = header.toLowerCase();
    if (entity === 'clients') {
      if (lowerHeader.includes('client') && lowerHeader.includes('id')) fallbackMapping[header] = 'ClientID';
      else if (lowerHeader.includes('client') && lowerHeader.includes('name')) fallbackMapping[header] = 'ClientName';
      else if (lowerHeader.includes('priority')) fallbackMapping[header] = 'PriorityLevel';
      else if (lowerHeader.includes('task') && lowerHeader.includes('id')) fallbackMapping[header] = 'RequestedTaskIDs';
      else if (lowerHeader.includes('group')) fallbackMapping[header] = 'GroupTag';
      else if (lowerHeader.includes('email')) fallbackMapping[header] = 'ContactEmail';
      else if (lowerHeader.includes('phone')) fallbackMapping[header] = 'ContactPhone';
      else if (lowerHeader.includes('budget')) fallbackMapping[header] = 'Budget';
      else if (lowerHeader.includes('deadline')) fallbackMapping[header] = 'Deadline';
    } else if (entity === 'workers') {
      if (lowerHeader.includes('worker') && lowerHeader.includes('id')) fallbackMapping[header] = 'WorkerID';
      else if (lowerHeader.includes('worker') && lowerHeader.includes('name')) fallbackMapping[header] = 'WorkerName';
      else if (lowerHeader.includes('skill')) fallbackMapping[header] = 'Skills';
      else if (lowerHeader.includes('available') || lowerHeader.includes('slot')) fallbackMapping[header] = 'Availability';
      else if (lowerHeader.includes('max') && lowerHeader.includes('load')) fallbackMapping[header] = 'MaxLoadPerPhase';
      else if (lowerHeader.includes('group')) fallbackMapping[header] = 'WorkerGroup';
      else if (lowerHeader.includes('qualification')) fallbackMapping[header] = 'QualificationLevel';
      else if (lowerHeader.includes('rate')) fallbackMapping[header] = 'HourlyRate';
      else if (lowerHeader.includes('location')) fallbackMapping[header] = 'Location';
    } else if (entity === 'tasks') {
      if (lowerHeader.includes('task') && lowerHeader.includes('id')) fallbackMapping[header] = 'TaskID';
      else if (lowerHeader.includes('task') && lowerHeader.includes('name')) fallbackMapping[header] = 'TaskName';
      else if (lowerHeader.includes('category')) fallbackMapping[header] = 'Category';
      else if (lowerHeader.includes('duration')) fallbackMapping[header] = 'EstimatedDuration';
      else if (lowerHeader.includes('skill')) fallbackMapping[header] = 'RequiredSkills';
      else if (lowerHeader.includes('phase')) fallbackMapping[header] = 'PreferredPhases';
      else if (lowerHeader.includes('concurrent')) fallbackMapping[header] = 'MaxConcurrent';
      else if (lowerHeader.includes('dependency')) fallbackMapping[header] = 'Dependencies';
      else if (lowerHeader.includes('priority')) fallbackMapping[header] = 'Priority';
      else if (lowerHeader.includes('cost')) fallbackMapping[header] = 'Cost';
    }
  });
  return fallbackMapping;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { headers, entity } = req.body;

    if (!headers || !Array.isArray(headers) || !entity) {
      return res.status(400).json({ error: 'Missing required fields: headers and entity' });
    }

    console.log('Column mapping API called');
    console.log('Processing request for entity:', entity, 'with headers:', headers);

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Groq API key not configured',
        mapping: createFallbackMapping(headers, entity)
      });
    }

    console.log('Calling Groq API...');
    const mapping = await AIService.mapColumns(headers, entity);
    
    console.log('Column mapping successful:', mapping);
    return res.status(200).json({ mapping });

  } catch (error) {
    console.error('Column mapping error:', error);
    
    // Return fallback mapping if AI service fails
    const { headers, entity } = req.body;
    if (headers && entity) {
      console.log('Using fallback mapping due to error');
      const fallbackMapping = createFallbackMapping(headers, entity);
      return res.status(200).json({ 
        mapping: fallbackMapping,
        warning: 'Using fallback mapping due to AI service error'
      });
    }
    
    return res.status(500).json({ error: 'Column mapping failed' });
  }
} 