import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Client, Worker, Task, ColumnMapping } from '@/types';

export class FileService {
  // Parse CSV file
  static async parseCSV(file: File): Promise<{ headers: string[], data: any[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
            return;
          }
          
          const headers = Object.keys(results.data[0] || {});
          resolve({
            headers,
            data: results.data
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  // Parse Excel file
  static async parseExcel(file: File): Promise<{ headers: string[], data: any[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const fileData = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(fileData, { type: 'array' });
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('Excel file must have at least a header row and one data row'));
            return;
          }
          
          const headers = jsonData[0] as string[];
          const dataRows = jsonData.slice(1) as any[][];
          
          // Convert to array of objects
          const transformedData = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve({ headers, data: transformedData });
        } catch (error) {
          reject(new Error(`Excel parsing failed: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Transform raw data to typed entities
  static transformToEntity(
    data: any[], 
    mapping: ColumnMapping, 
    entity: 'clients' | 'workers' | 'tasks'
  ): (Client | Worker | Task)[] {
    return data.map((row, index) => {
      const transformed: any = {};
      
      // Apply column mapping
      Object.entries(mapping).forEach(([sourceHeader, targetField]) => {
        if (row[sourceHeader] !== undefined) {
          transformed[targetField] = row[sourceHeader];
        }
      });
      
      // Set default values for required fields
      if (entity === 'clients') {
        return this.transformToClient(transformed, index);
      } else if (entity === 'workers') {
        return this.transformToWorker(transformed, index);
      } else {
        return this.transformToTask(transformed, index);
      }
    });
  }

  private static transformToClient(data: any, index: number): Client {
    return {
      ClientID: data.ClientID || `CLIENT_${index + 1}`,
      ClientName: data.ClientName || '',
      PriorityLevel: this.parseNumber(data.PriorityLevel, 3),
      RequestedTaskIDs: this.parseArray(data.RequestedTaskIDs),
      GroupTag: data.GroupTag || undefined,
      AttributesJSON: data.AttributesJSON || undefined,
    };
  }

  private static transformToWorker(data: any, index: number): Worker {
    return {
      WorkerID: data.WorkerID || `WORKER_${index + 1}`,
      WorkerName: data.WorkerName || '',
      Skills: this.parseArray(data.Skills),
      AvailableSlots: this.parseArray(data.AvailableSlots).map(s => parseInt(s)).filter(n => !isNaN(n)),
      MaxLoadPerPhase: this.parseNumber(data.MaxLoadPerPhase, 5),
      WorkerGroup: data.WorkerGroup || 'Default',
      QualificationLevel: this.parseNumber(data.QualificationLevel, 3),
    };
  }

  private static transformToTask(data: any, index: number): Task {
    return {
      TaskID: data.TaskID || `TASK_${index + 1}`,
      TaskName: data.TaskName || '',
      Category: data.Category || 'General',
      Duration: this.parseNumber(data.Duration, 8),
      RequiredSkills: this.parseArray(data.RequiredSkills),
      PreferredPhases: data.PreferredPhases || [],
      MaxConcurrent: this.parseNumber(data.MaxConcurrent, 1),
    };
  }

  // Helper methods for data parsing
  private static parseNumber(value: any, defaultValue?: number): number {
    if (value === undefined || value === null || value === '') {
      return defaultValue || 0;
    }
    
    const num = Number(value);
    return isNaN(num) ? (defaultValue || 0) : num;
  }

  private static parseArray(value: any): string[] {
    if (!value) return [];
    
    if (Array.isArray(value)) {
      return value.map(item => String(item)).filter(item => item.trim() !== '');
    }
    
    if (typeof value === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item)).filter(item => item.trim() !== '');
        }
      } catch {
        // If not JSON, split by comma
        return value.split(',').map(item => item.trim()).filter(item => item !== '');
      }
    }
    
    return [];
  }

  // Main file processing function
  static async processFile(
    file: File, 
    entity: 'clients' | 'workers' | 'tasks'
  ): Promise<{ data: (Client | Worker | Task)[], mapping: ColumnMapping }> {
    try {
      // Parse file based on type
      let parsedData: { headers: string[], data: any[] };
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        parsedData = await this.parseCSV(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        parsedData = await this.parseExcel(file);
      } else {
        throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
      }

      // Use backend API to map columns
      const mapping = await this.mapColumnsWithAPI(parsedData.headers, entity);
      
      // Transform data to typed entities
      const data = this.transformToEntity(parsedData.data, mapping, entity);
      
      return { data, mapping };
    } catch (error) {
      console.error('File processing error:', error);
      throw error;
    }
  }

  // Map columns using backend API
  private static async mapColumnsWithAPI(headers: string[], entity: 'clients' | 'workers' | 'tasks'): Promise<ColumnMapping> {
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

      // Check for ambiguities in the mapping
      const ambiguities = this.detectAmbiguities(data.mapping, headers, entity);
      if (ambiguities.length > 0) {
        throw new Error(`Ambiguous mappings detected: ${ambiguities.join(', ')}`);
      }

      return data.mapping;
    } catch (error) {
      console.error('Column mapping error:', error);
      // Fallback to simple keyword matching
      const fallbackMapping = this.fallbackColumnMapping(headers, entity);

      // Check fallback for ambiguities
      const ambiguities = this.detectAmbiguities(fallbackMapping, headers, entity);
      if (ambiguities.length > 0) {
        // Return mapping but mark as needing user review
        console.warn('Fallback mapping has ambiguities:', ambiguities);
      }

      return fallbackMapping;
    }
  }

  // Detect ambiguous mappings
  private static detectAmbiguities(mapping: ColumnMapping, headers: string[], entity: 'clients' | 'workers' | 'tasks'): string[] {
    const ambiguities: string[] = [];
    const targetFields = new Set(Object.values(mapping));

    // Check for multiple headers mapping to same field
    const fieldToHeaders = new Map<string, string[]>();
    Object.entries(mapping).forEach(([header, field]) => {
      if (!fieldToHeaders.has(field)) {
        fieldToHeaders.set(field, []);
      }
      fieldToHeaders.get(field)!.push(header);
    });

    fieldToHeaders.forEach((headers, field) => {
      if (headers.length > 1) {
        ambiguities.push(`Multiple headers map to ${field}: ${headers.join(', ')}`);
      }
    });

    // Check for unmapped headers that could potentially map to multiple fields
    const unmappedHeaders = headers.filter(h => !mapping[h] || mapping[h] === h);
    const entityMappings = this.getEntityFieldMappings(entity);

    unmappedHeaders.forEach(header => {
      const possibleFields = entityMappings.filter(field => {
        const lowerHeader = header.toLowerCase();
        const lowerField = field.toLowerCase();
        return lowerHeader.includes(lowerField) || lowerField.includes(lowerHeader);
      });

      if (possibleFields.length > 1) {
        ambiguities.push(`Header "${header}" could map to multiple fields: ${possibleFields.join(', ')}`);
      }
    });

    return ambiguities;
  }

  // Get expected fields for an entity
  private static getEntityFieldMappings(entity: 'clients' | 'workers' | 'tasks'): string[] {
    switch (entity) {
      case 'clients':
        return ['ClientID', 'ClientName', 'PriorityLevel', 'RequestedTaskIDs', 'GroupTag', 'AttributesJSON'];
      case 'workers':
        return ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots', 'MaxLoadPerPhase', 'WorkerGroup', 'QualificationLevel'];
      case 'tasks':
        return ['TaskID', 'TaskName', 'Category', 'Duration', 'RequiredSkills', 'PreferredPhases', 'MaxConcurrent'];
      default:
        return [];
    }
  }

  // Fallback column mapping
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
        else if (lowerHeader.includes('attribute')) mapping[header] = 'AttributesJSON';
      } else if (entity === 'workers') {
        if (lowerHeader.includes('worker') && lowerHeader.includes('id')) mapping[header] = 'WorkerID';
        else if (lowerHeader.includes('worker') && lowerHeader.includes('name')) mapping[header] = 'WorkerName';
        else if (lowerHeader.includes('skill')) mapping[header] = 'Skills';
        else if (lowerHeader.includes('available') || lowerHeader.includes('slot')) mapping[header] = 'AvailableSlots';
        else if (lowerHeader.includes('max') && lowerHeader.includes('load')) mapping[header] = 'MaxLoadPerPhase';
        else if (lowerHeader.includes('group')) mapping[header] = 'WorkerGroup';
        else if (lowerHeader.includes('qualification')) mapping[header] = 'QualificationLevel';
      } else if (entity === 'tasks') {
        if (lowerHeader.includes('task') && lowerHeader.includes('id')) mapping[header] = 'TaskID';
        else if (lowerHeader.includes('task') && lowerHeader.includes('name')) mapping[header] = 'TaskName';
        else if (lowerHeader.includes('category')) mapping[header] = 'Category';
        else if (lowerHeader.includes('duration')) mapping[header] = 'Duration';
        else if (lowerHeader.includes('skill')) mapping[header] = 'RequiredSkills';
        else if (lowerHeader.includes('phase')) mapping[header] = 'PreferredPhases';
        else if (lowerHeader.includes('concurrent')) mapping[header] = 'MaxConcurrent';
      }
    });
    
    return mapping;
  }

  // Export data to CSV
  static exportToCSV(data: any[], filename: string): void {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Create export package
  static async createExportPackage(
    clients: Client[], 
    workers: Worker[], 
    tasks: Task[], 
    rules: any[], 
    priorities: any
  ): Promise<Blob> {
    try {
      const response = await fetch('/api/export/export-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clients, workers, tasks, rules, priorities }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
}
