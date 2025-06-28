import { ColumnMapping } from '@/types';

export class AIService {
  // private static readonly DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
  // private static readonly DEEPSEEK_MODEL = 'deepseek-chat';

  // Map columns using AI
  static async mapColumns(headers: string[], entity: 'clients' | 'workers' | 'tasks'): Promise<ColumnMapping> {
    try {
      const response = await fetch('/api/ai/column-mapping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ headers, entity }),
      });

      if (!response.ok) {
        throw new Error(`Column mapping failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.mapping;
    } catch (error) {
      console.error('Column mapping error:', error);
      // Fallback to simple keyword matching
      return this.fallbackColumnMapping(headers, entity);
    }
  }

  // Process natural language search query
  static async processSearchQuery(query: string, clients: any[], workers: any[], tasks: any[]): Promise<any> {
    try {
      const response = await fetch('/api/ai/natural-language-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, clients, workers, tasks }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple text search
      return this.fallbackSearch(query, clients, workers, tasks);
    }
  }

  // Generate data corrections
  static async generateCorrections(errors: any[], clients: any[], workers: any[], tasks: any[]): Promise<any[]> {
    try {
      const response = await fetch('/api/ai/data-corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors, clients, workers, tasks }),
      });

      if (!response.ok) {
        throw new Error(`Corrections failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.corrections;
    } catch (error) {
      console.error('Corrections error:', error);
      return [];
    }
  }

  // Generate business rules from natural language
  static async generateRule(description: string, clients: any[], workers: any[], tasks: any[], existingRules: any[]): Promise<any> {
    try {
      const response = await fetch('/api/rules/generate-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description, clients, workers, tasks, existingRules }),
      });

      if (!response.ok) {
        throw new Error(`Rule generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Rule generation error:', error);
      return null;
    }
  }

  // Get rule recommendations
  static async getRuleRecommendations(clients: any[], workers: any[], tasks: any[], existingRules: any[]): Promise<any> {
    try {
      const response = await fetch('/api/rules/rule-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clients, workers, tasks, existingRules }),
      });

      if (!response.ok) {
        throw new Error(`Recommendations failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Recommendations error:', error);
      return { recommendations: [], summary: { totalRecommendations: 0 } };
    }
  }

  // Hugging Face API call helper
  static async callHuggingFaceAPI(prompt: string, systemPrompt?: string): Promise<string> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    console.log('Debug - HUGGINGFACE_API_KEY exists:', !!apiKey);
    console.log('Debug - API Key length:', apiKey ? apiKey.length : 0);
    console.log('Debug - API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    
    if (!apiKey) {
      console.warn('Hugging Face API key not found, using fallback');
      return '';
    }

    try {
      // Use a more accessible model that doesn't require special access
      const model = process.env.HUGGINGFACE_MODEL || 'microsoft/DialoGPT-medium';
      console.log('Debug - Using model:', model);
      
      const fullPrompt = systemPrompt 
        ? `${systemPrompt}\n\n${prompt}`
        : prompt;

      console.log('Debug - Making API request to Hugging Face...');
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false
          }
        }),
      });

      console.log('Debug - Response status:', response.status);
      console.log('Debug - Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Debug - Error response:', errorData);
        throw new Error(`Hugging Face API error: ${response.status} ${response.statusText} - ${errorData.error || ''}`);
      }

      const data = await response.json();
      console.log('Debug - Response data type:', typeof data);
      console.log('Debug - Response data keys:', Object.keys(data));
      
      // Handle different response formats from Hugging Face
      if (Array.isArray(data) && data.length > 0) {
        const result = data[0].generated_text || '';
        console.log('Debug - Array response, result length:', result.length);
        return result;
      } else if (typeof data === 'string') {
        console.log('Debug - String response, length:', data.length);
        return data;
      } else if (data.generated_text) {
        console.log('Debug - Object response with generated_text, length:', data.generated_text.length);
        return data.generated_text;
      }
      
      console.log('Debug - No valid response format found');
      return '';
    } catch (error) {
      console.error('Hugging Face API call failed:', error);
      throw error;
    }
  }

  // Fallback methods for when AI is not available
  private static fallbackColumnMapping(headers: string[], entity: 'clients' | 'workers' | 'tasks'): ColumnMapping {
    const mapping: ColumnMapping = {};
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      if (entity === 'clients') {
        if (lowerHeader.includes('client') && lowerHeader.includes('id')) mapping[header] = 'ClientID';
        else if (lowerHeader.includes('client') && lowerHeader.includes('name')) mapping[header] = 'ClientName';
        else if (lowerHeader.includes('priority')) mapping[header] = 'PriorityLevel';
        else if (lowerHeader.includes('task') && lowerHeader.includes('id')) mapping[header] = 'RequestedTaskIDs';
        else if (lowerHeader.includes('group')) mapping[header] = 'GroupTag';
        else if (lowerHeader.includes('email')) mapping[header] = 'ContactEmail';
        else if (lowerHeader.includes('phone')) mapping[header] = 'ContactPhone';
        else if (lowerHeader.includes('budget')) mapping[header] = 'Budget';
        else if (lowerHeader.includes('deadline')) mapping[header] = 'Deadline';
      } else if (entity === 'workers') {
        if (lowerHeader.includes('worker') && lowerHeader.includes('id')) mapping[header] = 'WorkerID';
        else if (lowerHeader.includes('worker') && lowerHeader.includes('name')) mapping[header] = 'WorkerName';
        else if (lowerHeader.includes('skill')) mapping[header] = 'Skills';
        else if (lowerHeader.includes('available') || lowerHeader.includes('slot')) mapping[header] = 'Availability';
        else if (lowerHeader.includes('max') && lowerHeader.includes('load')) mapping[header] = 'MaxLoadPerPhase';
        else if (lowerHeader.includes('group')) mapping[header] = 'WorkerGroup';
        else if (lowerHeader.includes('qualification')) mapping[header] = 'QualificationLevel';
        else if (lowerHeader.includes('rate')) mapping[header] = 'HourlyRate';
        else if (lowerHeader.includes('location')) mapping[header] = 'Location';
      } else if (entity === 'tasks') {
        if (lowerHeader.includes('task') && lowerHeader.includes('id')) mapping[header] = 'TaskID';
        else if (lowerHeader.includes('task') && lowerHeader.includes('name')) mapping[header] = 'TaskName';
        else if (lowerHeader.includes('category')) mapping[header] = 'Category';
        else if (lowerHeader.includes('duration')) mapping[header] = 'EstimatedDuration';
        else if (lowerHeader.includes('skill')) mapping[header] = 'RequiredSkills';
        else if (lowerHeader.includes('phase')) mapping[header] = 'PreferredPhases';
        else if (lowerHeader.includes('concurrent')) mapping[header] = 'MaxConcurrent';
        else if (lowerHeader.includes('dependency')) mapping[header] = 'Dependencies';
        else if (lowerHeader.includes('priority')) mapping[header] = 'Priority';
        else if (lowerHeader.includes('cost')) mapping[header] = 'Cost';
      }
    });
    
    return mapping;
  }

  private static fallbackSearch(query: string, clients: any[], workers: any[], tasks: any[]): any {
    const lowerQuery = query.toLowerCase();
    let results: any[] = [];
    let entity = 'clients';

    // Simple keyword-based search
    if (lowerQuery.includes('client')) {
      entity = 'clients';
      results = clients.filter(client => 
        client.ClientName?.toLowerCase().includes(lowerQuery) ||
        client.ClientID?.toLowerCase().includes(lowerQuery)
      );
    } else if (lowerQuery.includes('worker')) {
      entity = 'workers';
      results = workers.filter(worker => 
        worker.WorkerName?.toLowerCase().includes(lowerQuery) ||
        worker.WorkerID?.toLowerCase().includes(lowerQuery)
      );
    } else if (lowerQuery.includes('task')) {
      entity = 'tasks';
      results = tasks.filter(task => 
        task.TaskName?.toLowerCase().includes(lowerQuery) ||
        task.TaskID?.toLowerCase().includes(lowerQuery)
      );
    }

    return {
      entity,
      rowIds: results.map(item => item[`${entity.slice(0, -1)}ID`]),
      query
    };
  }
} 