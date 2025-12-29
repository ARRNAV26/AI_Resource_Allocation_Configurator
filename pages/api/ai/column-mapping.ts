import { NextApiRequest, NextApiResponse } from 'next';
import AIService from '../../../lib/aiService';

// Mapping rules for fallback column mapping
type MappingRule = {
  keywords: string[];
  field: string;
};

const clientsMappings: MappingRule[] = [
  { keywords: ['client', 'id'], field: 'ClientID' },
  { keywords: ['client', 'name'], field: 'ClientName' },
  { keywords: ['priority'], field: 'PriorityLevel' },
  { keywords: ['task', 'id'], field: 'RequestedTaskIDs' },
  { keywords: ['group'], field: 'GroupTag' },
  { keywords: ['email'], field: 'ContactEmail' },
  { keywords: ['phone'], field: 'ContactPhone' },
  { keywords: ['budget'], field: 'Budget' },
  { keywords: ['deadline'], field: 'Deadline' },
];

const workersMappings: MappingRule[] = [
  { keywords: ['worker', 'id'], field: 'WorkerID' },
  { keywords: ['worker', 'name'], field: 'WorkerName' },
  { keywords: ['skill'], field: 'Skills' },
  { keywords: ['available'], field: 'Availability' },
  { keywords: ['slot'], field: 'Availability' },
  { keywords: ['max', 'load'], field: 'MaxLoadPerPhase' },
  { keywords: ['group'], field: 'WorkerGroup' },
  { keywords: ['qualification'], field: 'QualificationLevel' },
  { keywords: ['rate'], field: 'HourlyRate' },
  { keywords: ['location'], field: 'Location' },
];

const tasksMappings: MappingRule[] = [
  { keywords: ['task', 'id'], field: 'TaskID' },
  { keywords: ['task', 'name'], field: 'TaskName' },
  { keywords: ['category'], field: 'Category' },
  { keywords: ['duration'], field: 'EstimatedDuration' },
  { keywords: ['skill'], field: 'RequiredSkills' },
  { keywords: ['phase'], field: 'PreferredPhases' },
  { keywords: ['concurrent'], field: 'MaxConcurrent' },
  { keywords: ['dependency'], field: 'Dependencies' },
  { keywords: ['priority'], field: 'Priority' },
  { keywords: ['cost'], field: 'Cost' },
];

// Helper function for fallback mapping
function createFallbackMapping(headers: string[], entity: 'clients' | 'workers' | 'tasks'): any {
  const fallbackMapping: any = {};
  const rules = entity === 'clients' ? clientsMappings : entity === 'workers' ? workersMappings : tasksMappings;

  headers.forEach((header: string) => {
    const lowerHeader = header.toLowerCase();
    for (const rule of rules) {
      if (rule.keywords.every(kw => lowerHeader.includes(kw))) {
        fallbackMapping[header] = rule.field;
        break;
      }
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
