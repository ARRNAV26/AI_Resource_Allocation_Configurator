import type { NextApiRequest, NextApiResponse } from 'next';
import { Client, Worker, Task } from '@/types';
import { AIService } from '@/lib/aiService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, clients, workers, tasks } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Check if Hugging Face API key is available
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.log('Hugging Face API key not found, using fallback search');
      // Fallback to simple keyword search
      const fallbackResults = performFallbackSearch(query, clients, workers, tasks);
      return res.status(200).json(fallbackResults);
    }

    const prompt = `You are an AI assistant that helps users search through resource allocation data using natural language.

Available data:
- Clients: ${clients?.length || 0} records with fields: ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON, ContactEmail, ContactPhone, Budget, Deadline
- Workers: ${workers?.length || 0} records with fields: WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel, HourlyRate, Location
- Tasks: ${tasks?.length || 0} records with fields: TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent, Phase, Dependencies, Priority, Cost

User query: "${query}"

Please analyze this query and determine:
1. Which entity the user is searching for (clients, workers, or tasks)
2. What filters to apply
3. What specific criteria to match

Return a JSON response with this structure:
{
  "entity": "clients|workers|tasks",
  "filters": [
    {
      "field": "fieldName",
      "operator": "equals|contains|greater_than|less_than|in|hasTasksWithSkill",
      "value": "value to match"
    }
  ],
  "explanation": "Brief explanation of what the search is looking for"
}

Examples:
- "All tasks with duration more than 2 phases" → {"entity": "tasks", "filters": [{"field": "Duration", "operator": "greater_than", "value": 2}]}
- "Workers with JavaScript skills" → {"entity": "workers", "filters": [{"field": "Skills", "operator": "contains", "value": "JavaScript"}]}
- "High priority clients" → {"entity": "clients", "filters": [{"field": "PriorityLevel", "operator": "greater_than", "value": 3}]}
- "Tasks that need Python skills" → {"entity": "tasks", "filters": [{"field": "RequiredSkills", "operator": "contains", "value": "Python"}]}`;

    const response = await AIService.callHuggingFaceAPI(prompt);
    
    if (!response) {
      throw new Error('No response from Hugging Face');
    }

    // Parse the JSON response
    const searchCriteria = JSON.parse(response);
    
    // Apply the filters to the data
    let filteredResults: any[] = [];
    
    if (searchCriteria.entity === 'clients' && clients) {
      filteredResults = applyFilters(clients, searchCriteria.filters);
    } else if (searchCriteria.entity === 'workers' && workers) {
      filteredResults = applyFilters(workers, searchCriteria.filters);
    } else if (searchCriteria.entity === 'tasks' && tasks) {
      filteredResults = applyFilters(tasks, searchCriteria.filters);
    }

    res.status(200).json({ 
      results: filteredResults,
      criteria: searchCriteria,
      totalResults: filteredResults.length
    });
  } catch (error: any) {
    console.error('Natural language search error:', error);
    
    // Fallback to simple search on error
    try {
      const { query, clients, workers, tasks } = req.body;
      const fallbackResults = performFallbackSearch(query, clients, workers, tasks);
      return res.status(200).json(fallbackResults);
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Search failed',
        details: error.message 
      });
    }
  }
}

function performFallbackSearch(query: string, clients: any[], workers: any[], tasks: any[]): any {
  const lowerQuery = query.toLowerCase();
  let results: any[] = [];
  let entity = 'clients';

  // Simple keyword-based search
  if (lowerQuery.includes('client')) {
    entity = 'clients';
    results = clients?.filter(client => 
      client.ClientName?.toLowerCase().includes(lowerQuery) ||
      client.ClientID?.toLowerCase().includes(lowerQuery)
    ) || [];
  } else if (lowerQuery.includes('worker')) {
    entity = 'workers';
    results = workers?.filter(worker => 
      worker.WorkerName?.toLowerCase().includes(lowerQuery) ||
      worker.WorkerID?.toLowerCase().includes(lowerQuery)
    ) || [];
  } else if (lowerQuery.includes('task')) {
    entity = 'tasks';
    results = tasks?.filter(task => 
      task.TaskName?.toLowerCase().includes(lowerQuery) ||
      task.TaskID?.toLowerCase().includes(lowerQuery)
    ) || [];
  }

  return {
    results,
    criteria: { entity, filters: [], explanation: 'Fallback keyword search' },
    totalResults: results.length
  };
}

function applyFilters(data: any[], filters: any[]): any[] {
  return data.filter(item => {
    return filters.every(filter => {
      const value = item[filter.field];
      return applyFilter(value, filter);
    });
  });
}

function applyFilter(value: any, filter: any): boolean {
  switch (filter.operator) {
    case 'equals':
      return value === filter.value;
    case 'contains':
      if (Array.isArray(value)) {
        return value.some(v => String(v).toLowerCase().includes(String(filter.value).toLowerCase()));
      }
      return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
    case 'greater_than':
      return Number(value) > Number(filter.value);
    case 'less_than':
      return Number(value) < Number(filter.value);
    case 'in':
      if (Array.isArray(filter.value)) {
        return filter.value.includes(value);
      }
      return false;
    case 'hasTasksWithSkill':
      // Special case for tasks with specific skills
      if (Array.isArray(value)) {
        return value.some((taskId: string) => {
          // This would need access to tasks data to check skills
          return true; // Placeholder
        });
      }
      return false;
    default:
      return true;
  }
} 