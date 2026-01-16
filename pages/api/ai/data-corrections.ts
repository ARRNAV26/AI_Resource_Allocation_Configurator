import { NextApiRequest, NextApiResponse } from 'next';
import AIService from '../../../lib/aiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { errors, clients, workers, tasks } = req.body;

    if (!errors || !Array.isArray(errors)) {
      return res.status(400).json({ error: 'Missing or invalid errors array' });
    }

    console.log('Data corrections API called');
    console.log('Processing corrections for:', errors.length, 'errors');

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Groq API key not configured',
        corrections: []
      });
    }

    console.log('Calling Groq API for data corrections...');
    const corrections = await AIService.generateCorrections(errors, clients || [], workers || [], tasks || []);
    
    console.log('Data corrections successful:', corrections.length, 'corrections');
    return res.status(200).json({ corrections });

  } catch (error) {
    console.error('Data corrections error:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Data corrections failed',
        message: error.message,
        corrections: []
      });
    }
    
    return res.status(500).json({ 
      error: 'Data corrections failed',
      corrections: []
    });
  }
} 