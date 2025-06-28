import type { NextApiRequest, NextApiResponse } from 'next';
import { AIService } from '@/lib/aiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clients, workers, tasks, existingRules } = req.body;

    const prompt = `You are an AI assistant that analyzes resource allocation data and suggests business rules based on patterns and potential issues.

Available data:
- Clients: ${clients?.length || 0} records
- Workers: ${workers?.length || 0} records
- Tasks: ${tasks?.length || 0} records
- Existing rules: ${existingRules?.length || 0} rules

Please analyze the data and suggest business rules that would improve the resource allocation system. Look for:

1. Tasks that frequently appear together in client requests
2. Workers that are consistently overloaded
3. Skills gaps or coverage issues
4. Phase conflicts or scheduling issues
5. Priority imbalances
6. Group-based patterns

Return a JSON response with this structure:
{
  "recommendations": [
    {
      "id": "rec-1",
      "type": "coRun|slotRestriction|loadLimit|phaseWindow|patternMatch|precedenceOverride",
      "name": "Suggested rule name",
      "description": "Why this rule is recommended",
      "confidence": 0.85,
      "parameters": {
        // Rule-specific parameters
      },
      "reasoning": "Detailed explanation of why this rule makes sense",
      "impact": "high|medium|low"
    }
  ],
  "summary": {
    "totalRecommendations": 5,
    "highImpact": 2,
    "mediumImpact": 2,
    "lowImpact": 1
  }
}

Focus on high-impact recommendations that address real patterns in the data.`;

    const response = await AIService.callHuggingFaceAPI(prompt);
    if (!response) {
      throw new Error('No response from Hugging Face');
    }
    const result = JSON.parse(response);
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Rule recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      details: error.message 
    });
  }
} 