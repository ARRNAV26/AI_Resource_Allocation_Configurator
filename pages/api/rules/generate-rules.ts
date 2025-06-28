import type { NextApiRequest, NextApiResponse } from 'next';
import { AIService } from '@/lib/aiService';
import { BusinessRule } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { description, clients, workers, tasks, existingRules } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Rule description is required' });
    }

    // Check if Hugging Face API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.log('Hugging Face API key not found, returning error');
      return res.status(400).json({ 
        error: 'Hugging Face API key not configured',
        details: 'Please configure HUGGINGFACE_API_KEY in your environment variables'
      });
    }

    const prompt = `You are an AI assistant that converts natural language descriptions into business rules for a resource allocation system.

Available data:
- Clients: ${clients?.length || 0} records
- Workers: ${workers?.length || 0} records
- Tasks: ${tasks?.length || 0} records
- Existing rules: ${existingRules?.length || 0} rules

User request: "${description}"

Please analyze this request and create a business rule. Return a JSON response with this structure:
{
  "rule": {
    "id": "unique-rule-id",
    "type": "coRun|slotRestriction|loadLimit|phaseWindow|skillRequirement",
    "name": "Human readable rule name",
    "description": "Detailed description of the rule",
    "parameters": {
      // Rule-specific parameters
    },
    "priority": 1,
    "enabled": true
  },
  "validation": {
    "canApply": true|false,
    "reason": "Why the rule can or cannot be applied",
    "conflicts": ["list of conflicting rules if any"]
  }
}

Rule types and their parameters:
1. coRun: {"tasks": ["task1", "task2"], "required": true}
2. slotRestriction: {"groupType": "client|worker", "groupName": "group", "minSlots": 2}
3. loadLimit: {"workerGroup": "group", "maxSlotsPerPhase": 5}
4. phaseWindow: {"taskId": "task1", "allowedPhases": [1,2,3]}
5. skillRequirement: {"requiredSkills": ["skill1", "skill2"]}

Examples:
- "Tasks T12 and T14 must run together" → coRun rule
- "Sales workers can only work 3 slots per phase" → loadLimit rule
- "Premium clients need at least 2 available slots" → slotRestriction rule`;

    const response = await AIService.callHuggingFaceAPI(prompt);
    
    if (!response) {
      throw new Error('No response from Hugging Face');
    }

    const result = JSON.parse(response);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Rule generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate rule',
      details: error.message 
    });
  }
} 