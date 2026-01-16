import { NextApiRequest, NextApiResponse } from 'next';
import AIService from '../../../lib/aiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description, clients, workers, tasks, existingRules } = req.body;

    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Description string is required' });
    }

    console.log('Generate rules API called');
    console.log('Processing description:', description);

    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      console.warn('GROQ_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'Groq API key not configured',
        rule: null
      });
    }

    console.log('Calling Groq API for rule generation...');
    const rules = await AIService.generateRule(description, clients || [], workers || [], tasks || [], existingRules || []);
    
    console.log('Rule generation successful:', rules?.length || 0, 'rules');
    
    // Convert the first rule to the expected format
    if (rules && rules.length > 0) {
      const ruleText = rules[0];
      const rule = {
        id: `rule_${Date.now()}`,
        type: 'custom',
        name: `Generated Rule ${Date.now()}`,
        description: ruleText,
        parameters: {},
        priority: (existingRules?.length || 0) + 1,
        enabled: true
      };
      return res.status(200).json({ rule });
    } else {
      return res.status(200).json({ rule: null });
    }

  } catch (error) {
    console.error('Rule generation error:', error);
    
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Rule generation failed',
        message: error.message,
        rule: null
      });
    }
    
    return res.status(500).json({ 
      error: 'Rule generation failed',
      rule: null
    });
  }
} 