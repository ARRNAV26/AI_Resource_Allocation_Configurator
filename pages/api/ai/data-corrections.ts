import type { NextApiRequest, NextApiResponse } from 'next';
import { AIService } from '@/lib/aiService';
import { ValidationError } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { errors, clients, workers, tasks } = req.body;

    if (!errors || !Array.isArray(errors)) {
      return res.status(400).json({ error: 'Errors array is required' });
    }

    const corrections: any[] = [];

    for (const error of errors) {
      const correction = await generateCorrection(error, clients, workers, tasks);
      if (correction) {
        corrections.push(correction);
      }
    }

    res.status(200).json({ 
      corrections,
      totalCorrections: corrections.length
    });
  } catch (error: any) {
    console.error('Data corrections error:', error);
    res.status(500).json({ 
      error: 'Failed to generate corrections',
      details: error.message 
    });
  }
}

async function generateCorrection(error: ValidationError, clients: any[], workers: any[], tasks: any[]): Promise<any> {
  const prompt = `You are an AI assistant that helps fix data validation errors in a resource allocation system.

Error details:
- Entity: ${error.entity}
- Field: ${error.field}
- Message: ${error.message}
- Current value: ${JSON.stringify(error.value)}
- Suggestion: ${error.suggestion}

Available data context:
- Clients: ${clients?.length || 0} records
- Workers: ${workers?.length || 0} records  
- Tasks: ${tasks?.length || 0} records

Please provide a specific correction for this error. Return a JSON response with this structure:
{
  "errorId": "${error.id}",
  "correction": {
    "type": "value|generate|remove|format",
    "newValue": "the corrected value",
    "explanation": "why this correction makes sense"
  },
  "confidence": 0.95,
  "autoApply": true|false
}

Correction types:
- "value": Replace with a specific value
- "generate": Generate a new value (e.g., unique ID)
- "remove": Remove the field/value
- "format": Fix formatting (e.g., JSON, array)

Examples:
- Missing ClientID → {"type": "generate", "newValue": "CLIENT_001", "explanation": "Generated unique client ID"}
- Invalid PriorityLevel → {"type": "value", "newValue": 3, "explanation": "Set to middle priority level"}
- Broken JSON → {"type": "format", "newValue": "{}", "explanation": "Fixed JSON syntax"}`;

  try {
    const response = await AIService.callHuggingFaceAPI(prompt);
    if (!response) {
      return null;
    }
    const correction = JSON.parse(response);
    return {
      ...correction,
      originalError: error
    };
  } catch (error) {
    console.error('Failed to generate correction for error:', error.id, error);
    return null;
  }
} 