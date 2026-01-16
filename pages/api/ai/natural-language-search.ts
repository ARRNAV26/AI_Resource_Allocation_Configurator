import { NextApiRequest, NextApiResponse } from 'next';
import AIService from '../../../lib/aiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, clients, workers, tasks } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    console.log('Natural language search API called');
    console.log('Processing query:', query);

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Groq API key not configured',
        results: [],
        criteria: { entity: 'clients' }
      });
    }

    console.log('Calling Groq API for natural language search...');
    const results = await AIService.processSearchQuery(query, clients || [], workers || [], tasks || []);
    
    console.log('Natural language search successful:', results.length, 'results');
    
    // Determine the entity type from the results
    let entity = 'clients';
    if (results.length > 0) {
      const firstResult = results[0];
      if (firstResult.ClientID) entity = 'clients';
      else if (firstResult.WorkerID) entity = 'workers';
      else if (firstResult.TaskID) entity = 'tasks';
    }
    
    return res.status(200).json({ 
      results,
      criteria: { entity }
    });

  } catch (error) {
    console.error('Natural language search error:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Natural language search failed',
        message: error.message,
        results: [],
        criteria: { entity: 'clients' }
      });
    }
    
    return res.status(500).json({ 
      error: 'Natural language search failed',
      results: [],
      criteria: { entity: 'clients' }
    });
  }
} 