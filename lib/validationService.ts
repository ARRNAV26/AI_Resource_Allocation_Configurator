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

    // Create lookup maps for efficient validation
    const taskIds = new Set(tasks.map(task => task.TaskID));
    const workerSkills = new Set(workers.flatMap(worker => worker.Skills));
    const workerGroups = new Set(workers.map(worker => worker.WorkerGroup));
    const clientGroups = new Set(clients.map(client => client.GroupTag).filter(Boolean));

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

      // Clients → Tasks: Each RequestedTaskIDs entry must match valid TaskIDs
      if (client.RequestedTaskIDs && client.RequestedTaskIDs.length > 0) {
        const invalidTaskIds = client.RequestedTaskIDs.filter(taskId => !taskIds.has(taskId));
        if (invalidTaskIds.length > 0) {
          errors.push({
            id: `invalid-requested-tasks-${index}`,
            entity: 'clients',
            rowId: client.ClientID || `row-${index}`,
            field: 'RequestedTaskIDs',
            message: `Client requests non-existent tasks: ${invalidTaskIds.join(', ')}`,
            severity: 'critical',
            value: client.RequestedTaskIDs,
            suggestion: 'Only request tasks that exist in the tasks.csv file'
          });
        }
      }

      // PriorityLevel validation (1-5)
      if (client.PriorityLevel && (client.PriorityLevel < 1 || client.PriorityLevel > 5)) {
        errors.push({
          id: `invalid-priority-level-${index}`,
          entity: 'clients',
          rowId: client.ClientID || `row-${index}`,
          field: 'PriorityLevel',
          message: 'PriorityLevel must be between 1 and 5',
          severity: 'warning',
          value: client.PriorityLevel,
          suggestion: 'Set PriorityLevel to a value between 1 (highest) and 5 (lowest)'
        });
      }

      // GroupTag validation - ensure it exists in worker groups if specified
      if (client.GroupTag && !workerGroups.has(client.GroupTag)) {
        errors.push({
          id: `invalid-group-tag-${index}`,
          entity: 'clients',
          rowId: client.ClientID || `row-${index}`,
          field: 'GroupTag',
          message: `GroupTag '${client.GroupTag}' does not match any WorkerGroup`,
          severity: 'warning',
          value: client.GroupTag,
          suggestion: 'Ensure GroupTag matches an existing WorkerGroup in workers.csv'
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

      // WorkerGroup validation - ensure it exists in client groups if specified
      if (worker.WorkerGroup && !clientGroups.has(worker.WorkerGroup)) {
        errors.push({
          id: `invalid-worker-group-${index}`,
          entity: 'workers',
          rowId: worker.WorkerID || `row-${index}`,
          field: 'WorkerGroup',
          message: `WorkerGroup '${worker.WorkerGroup}' does not match any client GroupTag`,
          severity: 'warning',
          value: worker.WorkerGroup,
          suggestion: 'Ensure WorkerGroup matches an existing GroupTag in clients.csv'
        });
      }

      // AvailableSlots validation - ensure they are valid phase numbers
      if (worker.Availability && worker.Availability.length > 0) {
        const invalidSlots = worker.Availability.filter(slot => {
          const num = parseInt(slot);
          return isNaN(num) || num < 1 || num > 10; // Assuming max 10 phases
        });
        if (invalidSlots.length > 0) {
          errors.push({
            id: `invalid-available-slots-${index}`,
            entity: 'workers',
            rowId: worker.WorkerID || `row-${index}`,
            field: 'Availability',
            message: `Invalid phase numbers in AvailableSlots: ${invalidSlots.join(', ')}`,
            severity: 'warning',
            value: worker.Availability,
            suggestion: 'Use valid phase numbers (1-10) for AvailableSlots'
          });
        }
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

      // Tasks → Workers: Every RequiredSkill must appear in at least one worker's Skills
      if (task.RequiredSkills && task.RequiredSkills.length > 0) {
        const missingSkills = task.RequiredSkills.filter(skill => !workerSkills.has(skill));
        if (missingSkills.length > 0) {
          errors.push({
            id: `missing-skills-${index}`,
            entity: 'tasks',
            rowId: task.TaskID || `row-${index}`,
            field: 'RequiredSkills',
            message: `No worker has the required skills: ${missingSkills.join(', ')}`,
            severity: 'critical',
            value: task.RequiredSkills,
            suggestion: 'Add workers with the missing skills or modify task requirements'
          });
        }
      }

      // PreferredPhases validation - parse and validate phase ranges/lists
      if (task.PreferredPhases) {
        const phases = this.parsePreferredPhases(task.PreferredPhases);
        if (phases.length === 0) {
          errors.push({
            id: `invalid-preferred-phases-${index}`,
            entity: 'tasks',
            rowId: task.TaskID || `row-${index}`,
            field: 'PreferredPhases',
            message: 'PreferredPhases format is invalid',
            severity: 'warning',
            value: task.PreferredPhases,
            suggestion: 'Use format like "2-4" or "[1,3,5]" for PreferredPhases'
          });
        }
      }

      // Dependencies validation - ensure dependent tasks exist
      if (task.Dependencies && task.Dependencies.length > 0) {
        const invalidDeps = task.Dependencies.filter(depId => !taskIds.has(depId));
        if (invalidDeps.length > 0) {
          errors.push({
            id: `invalid-dependencies-${index}`,
            entity: 'tasks',
            rowId: task.TaskID || `row-${index}`,
            field: 'Dependencies',
            message: `Task depends on non-existent tasks: ${invalidDeps.join(', ')}`,
            severity: 'critical',
            value: task.Dependencies,
            suggestion: 'Only reference existing TaskIDs in Dependencies'
          });
        }
      }
    });

    return errors;
  }

  // Helper method to parse PreferredPhases
  private static parsePreferredPhases(phases: string | string[]): number[] {
    if (Array.isArray(phases)) {
      return phases.map(p => parseInt(p)).filter(p => !isNaN(p) && p > 0);
    }

    if (typeof phases === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(phases);
        if (Array.isArray(parsed)) {
          return parsed.map(p => parseInt(p)).filter(p => !isNaN(p) && p > 0);
        }
      } catch {
        // If not JSON, try to parse as range (e.g., "2-4")
        const rangeMatch = phases.match(/^(\d+)-(\d+)$/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
          }
        }
        
        // Try comma-separated values
        return phases.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
      }
    }

    return [];
  }
} 