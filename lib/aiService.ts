import { Groq } from 'groq-sdk';

export class AIService {
  private groq: Groq;
  private defaultModel = 'openai/gpt-oss-120b';

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('GROQ_API_KEY not found in environment variables');
    }
    this.groq = new Groq({
      apiKey: apiKey || '',
    });
  }

  private async callGroqAPI(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ],
        model: this.defaultModel,
        temperature: 0.1,
        max_tokens: 2048,
      });

      const response = completion.choices[0]?.message?.content || '';
      return response;
    } catch (error) {
      console.error('Groq API call failed:', error);
      throw new Error(`Groq API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Map columns using AI
  async mapColumns(headers: string[], entity: 'clients' | 'workers' | 'tasks'): Promise<Record<string, string>> {
    const systemPrompt = `You are an expert at mapping CSV column headers to standardized field names for resource allocation systems. 
    You must return ONLY a valid JSON object with the mapping, no additional text, no explanations, no markdown formatting.
    The response must be parseable JSON starting with { and ending with }.`;

    const prompt = `Map these CSV headers for ${entity} to standardized field names:
    Headers: ${headers.join(', ')}
    
    Expected fields for ${entity}:
    - ClientID/WorkerID/TaskID (unique identifier)
    - Name (client/worker/task name)
    - PriorityLevel (1-5, where 1 is highest)
    - Skills/RequestedTaskIDs/RequiredSkills (comma-separated)
    - GroupTag (categorical grouping)
    - AttributesJSON (additional JSON data)
    
    Return ONLY a JSON object like this: {"header1": "field1", "header2": "field2"}`;

    try {
      const response = await this.callGroqAPI(prompt, systemPrompt);
      console.log('AI Response for mapping:', response.substring(0, 200) + '...');

      // Try multiple strategies to extract valid JSON
      let mapping: Record<string, string> = {};

      // Strategy 1: Try to parse the entire response as JSON
      try {
        mapping = JSON.parse(response.trim());
        if (typeof mapping === 'object' && mapping !== null) {
          return mapping;
        }
      } catch (e) {
        // Continue to other strategies
      }

      // Strategy 2: Extract JSON object using regex
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          mapping = JSON.parse(jsonMatch[0]);
          if (typeof mapping === 'object' && mapping !== null) {
            return mapping;
          }
        } catch (e) {
          console.error('Failed to parse extracted JSON object:', e);
        }
      }

      // Strategy 3: Clean up common JSON issues and retry
      const cleanedResponse = response
        .trim()
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'); // Quote unquoted keys

      try {
        mapping = JSON.parse(cleanedResponse);
        if (typeof mapping === 'object' && mapping !== null) {
          return mapping;
        }
      } catch (e) {
        console.error('Failed to parse cleaned JSON:', e);
      }

      throw new Error('Could not extract valid JSON object from AI response');
    } catch (error) {
      console.error('Column mapping error:', error);
      // Fallback mapping
      return this.getFallbackMapping(headers, entity);
    }
  }

  // Process natural language search query
  async processSearchQuery(query: string, clients: any[], workers: any[], tasks: any[]): Promise<any[]> {
    const systemPrompt = `You are an expert at searching through resource allocation data using natural language queries.
    You must return ONLY a valid JSON array of matching records, no additional text, no explanations, no markdown formatting.
    The response must be parseable JSON starting with [ and ending with ].

    For each matching record, include ALL the original fields from the data. Do not modify or summarize the data.`;

    const prompt = `Search for "${query}" in this data and return the complete matching records:

    Clients: ${JSON.stringify(clients, null, 2)}
    Workers: ${JSON.stringify(workers, null, 2)}
    Tasks: ${JSON.stringify(tasks, null, 2)}

    Search criteria: ${query}

    Return ONLY a JSON array of complete matching records. Include all fields from the original data.
    Example format: [{"ClientID": "C001", "ClientName": "Example Client", ...}]`;

    try {
      const response = await this.callGroqAPI(prompt, systemPrompt);
      console.log('AI Response for search:', response.substring(0, 200) + '...');

      // Try multiple strategies to extract valid JSON
      let results: any[] = [];

      // Strategy 1: Try to parse the entire response as JSON
      try {
        results = JSON.parse(response.trim());
        if (Array.isArray(results)) {
          return results;
        }
      } catch (e) {
        // Continue to other strategies
      }

      // Strategy 2: Extract JSON array using regex
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          results = JSON.parse(jsonMatch[0]);
          if (Array.isArray(results)) {
            return results;
          }
        } catch (e) {
          console.error('Failed to parse extracted JSON array:', e);
        }
      }

      // Strategy 3: Clean up common JSON issues and retry
      const cleanedResponse = response
        .trim()
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'); // Quote unquoted keys

      try {
        results = JSON.parse(cleanedResponse);
        if (Array.isArray(results)) {
          return results;
        }
      } catch (e) {
        console.error('Failed to parse cleaned JSON:', e);
      }

      throw new Error('Could not extract valid JSON array from AI response');
    } catch (error) {
      console.error('Natural language search error:', error);
      // Fallback to simple text search
      return this.fallbackSearch(query, clients, workers, tasks);
    }
  }

  // Generate data corrections
  async generateCorrections(errors: any[], clients: any[], workers: any[], tasks: any[]): Promise<any[]> {
    const systemPrompt = `You are an expert at correcting data quality issues in resource allocation datasets. 
    You must return ONLY a valid JSON array of corrected data, no additional text, no explanations, no markdown formatting.
    The response must be parseable JSON starting with [ and ending with ].`;

    const prompt = `Correct these data quality issues for this data:
    Issues: ${errors.join(', ')}
    
    Current data: ${JSON.stringify(clients, null, 2)}
    ${JSON.stringify(workers, null, 2)}
    ${JSON.stringify(tasks, null, 2)}
    
    Return ONLY a JSON array of corrected records like this: [{"id": "1", "corrected_field": "value"}]`;

    try {
      const response = await this.callGroqAPI(prompt, systemPrompt);
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        const correctedData = JSON.parse(jsonMatch[0]);
        return Array.isArray(correctedData) ? correctedData : [];
      } else {
        throw new Error('No valid JSON array found in response');
      }
    } catch (error) {
      console.error('Data correction error:', error);
      return []; // Return empty array if correction fails
    }
  }

  // Generate business rules from natural language
  async generateRule(description: string, clients: any[], workers: any[], tasks: any[], existingRules: any[]): Promise<any> {
    const systemPrompt = `You are an expert at generating business rules for resource allocation systems. 
    You must return ONLY a valid JSON array of rule strings, no additional text, no explanations, no markdown formatting.
    The response must be parseable JSON starting with [ and ending with ].`;

    const prompt = `Generate business rules for this resource allocation data:
    Description: ${description}
    Clients: ${JSON.stringify(clients, null, 2)}
    Workers: ${JSON.stringify(workers, null, 2)}
    Tasks: ${JSON.stringify(tasks, null, 2)}
    
    Focus on:
    - Priority-based allocation
    - Skill matching
    - Group constraints
    - Capacity limits
    - Quality assurance
    
    Return ONLY a JSON array of rule strings like this: ["Rule 1", "Rule 2"]`;

    try {
      const response = await this.callGroqAPI(prompt, systemPrompt);
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        const rules = JSON.parse(jsonMatch[0]);
        return Array.isArray(rules) ? rules : [];
      } else {
        throw new Error('No valid JSON array found in response');
      }
    } catch (error) {
      console.error('Business rules generation error:', error);
      return null;
    }
  }

  // Get rule recommendations
  async getRuleRecommendations(clients: any[], workers: any[], tasks: any[], existingRules: any[]): Promise<any> {
    const systemPrompt = `You are an expert at recommending business rules for resource allocation systems. 
    You must return ONLY a valid JSON array of recommendation strings, no additional text, no explanations, no markdown formatting.
    The response must be parseable JSON starting with [ and ending with ].`;

    const prompt = `Analyze this data and recommend business rules:
    Clients: ${JSON.stringify(clients, null, 2)}
    Workers: ${JSON.stringify(workers, null, 2)}
    Tasks: ${JSON.stringify(tasks, null, 2)}
    
    Consider:
    - Data patterns and anomalies
    - Potential conflicts
    - Optimization opportunities
    - Risk mitigation
    
    Return ONLY a JSON array of recommendation strings like this: ["Recommendation 1", "Recommendation 2"]`;

    try {
      const response = await this.callGroqAPI(prompt, systemPrompt);
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return Array.isArray(recommendations) ? recommendations : [];
      } else {
        throw new Error('No valid JSON array found in response');
      }
    } catch (error) {
      console.error('Rule recommendations error:', error);
      return { recommendations: [], summary: { totalRecommendations: 0 } };
    }
  }

  private getFallbackMapping(headers: string[], entity: 'clients' | 'workers' | 'tasks'): Record<string, string> {
    const mappings: Record<string, Record<string, string>> = {
      clients: {
        'ClientID': 'ClientID',
        'ClientName': 'ClientName',
        'PriorityLevel': 'PriorityLevel',
        'RequestedTaskIDs': 'RequestedTaskIDs',
        'GroupTag': 'GroupTag',
        'AttributesJSON': 'AttributesJSON'
      },
      workers: {
        'WorkerID': 'WorkerID',
        'WorkerName': 'WorkerName',
        'Skills': 'Skills',
        'AvailableSlots': 'AvailableSlots',
        'MaxLoadPerPhase': 'MaxLoadPerPhase',
        'WorkerGroup': 'WorkerGroup',
        'QualificationLevel': 'QualificationLevel'
      },
      tasks: {
        'TaskID': 'TaskID',
        'TaskName': 'TaskName',
        'Category': 'Category',
        'Duration': 'Duration',
        'RequiredSkills': 'RequiredSkills',
        'PreferredPhases': 'PreferredPhases',
        'MaxConcurrent': 'MaxConcurrent'
      }
    };

    const entityMapping = mappings[entity] || {};
    const result: Record<string, string> = {};

    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Find best match
      for (const [key, value] of Object.entries(entityMapping)) {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalizedHeader.includes(normalizedKey) || normalizedKey.includes(normalizedHeader)) {
          result[header] = value;
          break;
        }
      }

      // If no match found, use original header
      if (!result[header]) {
        result[header] = header;
      }
    });

    return result;
  }

  private fallbackSearch(query: string, clients: any[], workers: any[], tasks: any[]): any[] {
    const lowerQuery = query.toLowerCase();
    let results: any[] = [];

    console.log('Fallback search triggered for query:', query);
    console.log('Data available - Clients:', clients.length, 'Workers:', workers.length, 'Tasks:', tasks.length);

    // Helper function to search any object for the query
    const searchObject = (obj: any): boolean => {
      if (!obj || typeof obj !== 'object') return false;

      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'string' && value.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        if (value && typeof value === 'object') {
          // Search nested objects/arrays
          if (Array.isArray(value)) {
            if (value.some(item => typeof item === 'string' && item.toLowerCase().includes(lowerQuery))) {
              return true;
            }
          } else if (searchObject(value)) {
            return true;
          }
        }
      }
      return false;
    };

    // Search across all entities using comprehensive field search
    const clientResults = clients.filter(client => {
      console.log('Checking client:', JSON.stringify(client, null, 2));
      return searchObject(client);
    });

    const workerResults = workers.filter(worker => {
      console.log('Checking worker:', JSON.stringify(worker, null, 2));
      return searchObject(worker);
    });

    const taskResults = tasks.filter(task => {
      console.log('Checking task:', JSON.stringify(task, null, 2));
      return searchObject(task);
    });

    console.log('Search results - Clients:', clientResults.length, 'Workers:', workerResults.length, 'Tasks:', taskResults.length);

    // Return all matching results
    return [...clientResults, ...workerResults, ...taskResults];
  }
}

const aiService = new AIService();
export default aiService;
