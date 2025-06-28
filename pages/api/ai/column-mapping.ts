import type { NextApiRequest, NextApiResponse } from 'next';
import { AIService } from '@/lib/aiService';

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
    console.log('Column mapping API called');
    const { headers, entity } = req.body;

    if (!headers || !entity) {
      console.log('Missing required fields:', { headers: !!headers, entity: !!entity });
      return res.status(400).json({ error: 'Headers and entity are required' });
    }

    console.log('Processing request for entity:', entity, 'with headers:', headers);

    // Check if Hugging Face API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.log('Hugging Face API key not found, using fallback mapping');
      const fallbackMapping = createFallbackMapping(headers, entity);
      return res.status(200).json({ mapping: fallbackMapping, method: 'fallback' });
    }

    const prompt = `You are an AI assistant that maps CSV/Excel headers to standardized field names for a resource allocation system.

Entity: ${entity}

Available fields for ${entity}:
${entity === 'clients' ? `
- ClientID (required): Unique identifier for the client
- ClientName (required): Name of the client
- PriorityLevel (required): Integer 1-5 indicating priority
- RequestedTaskIDs: Comma-separated list of task IDs
- GroupTag: Group classification
- AttributesJSON: JSON metadata
- ContactEmail: Email address
- ContactPhone: Phone number
- Budget: Budget amount
- Deadline: Deadline date` : entity === 'workers' ? `
- WorkerID (required): Unique identifier for the worker
- WorkerName (required): Name of the worker
- Skills: Comma-separated list of skills
- AvailableSlots: Array of phase numbers [1,3,5]
- MaxLoadPerPhase: Maximum load per phase
- WorkerGroup: Group classification
- QualificationLevel: Qualification level
- HourlyRate: Hourly rate
- Location: Location` : `
- TaskID (required): Unique identifier for the task
- TaskName (required): Name of the task
- Category: Task category
- Duration: Number of phases (≥1)
- RequiredSkills: Comma-separated list of required skills
- PreferredPhases: List or range syntax (e.g. "1-3" or [2,4,5])
- MaxConcurrent: Maximum parallel assignments
- Phase: Phase information
- Dependencies: Comma-separated list of task dependencies
- Priority: Priority level
- Cost: Task cost`}

Actual headers found in the file:
${headers.join(', ')}

Please map each header to the most appropriate standardized field. Return a JSON object where keys are the original headers and values are the standardized field names. If a header doesn't match any field, map it to null.

Example response format:
{
  "client_id": "ClientID",
  "name": "ClientName",
  "priority": "PriorityLevel",
  "tasks": "RequestedTaskIDs",
  "unrelated_field": null
}`;

    console.log('Calling Hugging Face API...');
    const response = await AIService.callHuggingFaceAPI(prompt);
    if (!response) {
      throw new Error('No response from Hugging Face');
    }
    console.log('Hugging Face response received:', response.substring(0, 100) + '...');
    // Parse the JSON response
    const mapping = JSON.parse(response);
    console.log('Mapping successful:', Object.keys(mapping).length, 'fields mapped');
    res.status(200).json({ mapping, method: 'ai' });
  } catch (error: any) {
    console.error('Column mapping error:', error);
    
    // If it's an authentication error, use fallback
    if (error.message.includes('401') || error.message.includes('authentication')) {
      console.log('Hugging Face authentication failed, using fallback mapping');
      const { headers, entity } = req.body;
      const fallbackMapping = createFallbackMapping(headers, entity);
      return res.status(200).json({ mapping: fallbackMapping, method: 'fallback', error: 'Hugging Face authentication failed' });
    }
    
    // For any other error, also use fallback
    console.log('Using fallback mapping due to error');
    const { headers, entity } = req.body;
    const fallbackMapping = createFallbackMapping(headers, entity);
    return res.status(200).json({ 
      mapping: fallbackMapping, 
      method: 'fallback', 
      error: error.message 
    });
  }
} 