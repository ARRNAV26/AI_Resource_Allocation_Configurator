import { Client, Worker, Task, ValidationError } from '@/types';

export class ValidationService {
  // Validate all data using the backend API
  static async validateAll(clients: Client[], workers: Worker[], tasks: Task[]): Promise<ValidationError[]> {
    try {
      const response = await fetch('/api/validation/validate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clients, workers, tasks }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.errors;
    } catch (error) {
      console.error('Validation error:', error);
      // Fallback to basic validation
      return this.fallbackValidation(clients, workers, tasks);
    }
  }

  // Fallback validation for when backend is not available
  private static fallbackValidation(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Basic required field validation
    clients.forEach((client, index) => {
      if (!client.ClientID) {
        errors.push({
          id: `missing-client-id-${index}`,
          entity: 'clients',
          rowId: client.ClientID || `row-${index}`,
          field: 'ClientID',
          message: 'ClientID is required',
          severity: 'critical',
          value: client.ClientID,
          suggestion: 'Generate a unique ClientID'
        });
      }
      if (!client.ClientName) {
        errors.push({
          id: `missing-client-name-${index}`,
          entity: 'clients',
          rowId: client.ClientID || `row-${index}`,
          field: 'ClientName',
          message: 'ClientName is required',
          severity: 'critical',
          value: client.ClientName,
          suggestion: 'Provide a name for this client'
        });
      }
    });

    workers.forEach((worker, index) => {
      if (!worker.WorkerID) {
        errors.push({
          id: `missing-worker-id-${index}`,
          entity: 'workers',
          rowId: worker.WorkerID || `row-${index}`,
          field: 'WorkerID',
          message: 'WorkerID is required',
          severity: 'critical',
          value: worker.WorkerID,
          suggestion: 'Generate a unique WorkerID'
        });
      }
      if (!worker.WorkerName) {
        errors.push({
          id: `missing-worker-name-${index}`,
          entity: 'workers',
          rowId: worker.WorkerID || `row-${index}`,
          field: 'WorkerName',
          message: 'WorkerName is required',
          severity: 'critical',
          value: worker.WorkerName,
          suggestion: 'Provide a name for this worker'
        });
      }
    });

    tasks.forEach((task, index) => {
      if (!task.TaskID) {
        errors.push({
          id: `missing-task-id-${index}`,
          entity: 'tasks',
          rowId: task.TaskID || `row-${index}`,
          field: 'TaskID',
          message: 'TaskID is required',
          severity: 'critical',
          value: task.TaskID,
          suggestion: 'Generate a unique TaskID'
        });
      }
      if (!task.TaskName) {
        errors.push({
          id: `missing-task-name-${index}`,
          entity: 'tasks',
          rowId: task.TaskID || `row-${index}`,
          field: 'TaskName',
          message: 'TaskName is required',
          severity: 'critical',
          value: task.TaskName,
          suggestion: 'Provide a name for this task'
        });
      }
    });

    return errors;
  }
} 