import { NextApiRequest, NextApiResponse } from 'next';
import AIService from '../../../lib/aiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clients, workers, tasks, existingRules } = req.body;

    console.log('Rule recommendations API called');

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Groq API key not configured',
        recommendations: []
      });
    }

    console.log('Calling Groq API for rule recommendations...');
    const recommendations = await AIService.getRuleRecommendations(clients || [], workers || [], tasks || [], existingRules || []);
    
    console.log('Rule recommendations successful:', recommendations?.length || 0, 'recommendations');
    return res.status(200).json({ 
      recommendations: recommendations || [],
      summary: { totalRecommendations: recommendations?.length || 0 }
    });

  } catch (error) {
    console.error('Rule recommendations error:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Rule recommendations failed',
        message: error.message,
        recommendations: []
      });
    }
    
    return res.status(500).json({ 
      error: 'Rule recommendations failed',
      recommendations: []
    });
  }
} 