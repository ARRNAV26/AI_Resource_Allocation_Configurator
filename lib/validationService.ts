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

    // Core validations from task specification

    // a. Missing required column(s) - check for required fields
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

    // b. Duplicate IDs
    const clientIds = new Set<string>();
    clients.forEach((client, index) => {
      if (client.ClientID) {
        if (clientIds.has(client.ClientID)) {
          errors.push({
            id: `duplicate-client-id-${index}`,
            entity: 'clients',
            rowId: client.ClientID,
            field: 'ClientID',
            message: `Duplicate ClientID: ${client.ClientID}`,
            severity: 'critical',
            value: client.ClientID,
            suggestion: 'Ensure all ClientIDs are unique'
          });
        }
        clientIds.add(client.ClientID);
      }
    });

    const workerIds = new Set<string>();
    workers.forEach((worker, index) => {
      if (worker.WorkerID) {
        if (workerIds.has(worker.WorkerID)) {
          errors.push({
            id: `duplicate-worker-id-${index}`,
            entity: 'workers',
            rowId: worker.WorkerID,
            field: 'WorkerID',
            message: `Duplicate WorkerID: ${worker.WorkerID}`,
            severity: 'critical',
            value: worker.WorkerID,
            suggestion: 'Ensure all WorkerIDs are unique'
          });
        }
        workerIds.add(worker.WorkerID);
      }
    });

    const taskIdsSet = new Set<string>();
    tasks.forEach((task, index) => {
      if (task.TaskID) {
        if (taskIdsSet.has(task.TaskID)) {
          errors.push({
            id: `duplicate-task-id-${index}`,
            entity: 'tasks',
            rowId: task.TaskID,
            field: 'TaskID',
            message: `Duplicate TaskID: ${task.TaskID}`,
            severity: 'critical',
            value: task.TaskID,
            suggestion: 'Ensure all TaskIDs are unique'
          });
        }
        taskIdsSet.add(task.TaskID);
      }
    });

    // c. Malformed lists (non-numeric in AvailableSlots etc)
    workers.forEach((worker, index) => {
      if (worker.AvailableSlots && worker.AvailableSlots.some(slot => isNaN(slot))) {
        errors.push({
          id: `malformed-available-slots-${index}`,
          entity: 'workers',
          rowId: worker.WorkerID || `row-${index}`,
          field: 'AvailableSlots',
          message: 'AvailableSlots contains non-numeric values',
          severity: 'critical',
          value: worker.AvailableSlots,
          suggestion: 'AvailableSlots must be an array of numbers'
        });
      }
    });

    // d. Out-of-range values
    clients.forEach((client, index) => {
      if (client.PriorityLevel && (client.PriorityLevel < 1 || client.PriorityLevel > 5)) {
        errors.push({
          id: `out-of-range-priority-${index}`,
          entity: 'clients',
          rowId: client.ClientID || `row-${index}`,
          field: 'PriorityLevel',
          message: 'PriorityLevel must be between 1 and 5',
          severity: 'warning',
          value: client.PriorityLevel,
          suggestion: 'Set PriorityLevel to a value between 1 (highest) and 5 (lowest)'
        });
      }
    });

    tasks.forEach((task, index) => {
      if (task.Duration < 1) {
        errors.push({
          id: `out-of-range-duration-${index}`,
          entity: 'tasks',
          rowId: task.TaskID || `row-${index}`,
          field: 'Duration',
          message: 'Duration must be >= 1',
          severity: 'warning',
          value: task.Duration,
          suggestion: 'Set Duration to a positive number of phases'
        });
      }
    });

    // e. Broken JSON in AttributesJSON
    clients.forEach((client, index) => {
      if (client.AttributesJSON) {
        try {
          JSON.parse(client.AttributesJSON);
        } catch {
          errors.push({
            id: `broken-json-attributes-${index}`,
            entity: 'clients',
            rowId: client.ClientID || `row-${index}`,
            field: 'AttributesJSON',
            message: 'AttributesJSON contains invalid JSON',
            severity: 'warning',
            value: client.AttributesJSON,
            suggestion: 'Ensure AttributesJSON is valid JSON format'
          });
        }
      }
    });

    // f. Unknown references (RequestedTaskIDs not in tasks)
    clients.forEach((client, index) => {
      if (client.RequestedTaskIDs && client.RequestedTaskIDs.length > 0) {
        const invalidTaskIds = client.RequestedTaskIDs.filter(taskId => !taskIds.has(taskId));
        if (invalidTaskIds.length > 0) {
          errors.push({
            id: `unknown-task-references-${index}`,
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
    });

    // g. Circular co-run groups (would need rules data - placeholder)
    // This would require analyzing business rules for co-run relationships

    // h. Conflicting rules vs. phase-window constraints (placeholder)
    // Would need to validate business rules against task phase preferences

    // i. Overloaded workers (AvailableSlots.length < MaxLoadPerPhase)
    workers.forEach((worker, index) => {
      if (worker.AvailableSlots && worker.AvailableSlots.length < worker.MaxLoadPerPhase) {
        errors.push({
          id: `overloaded-worker-${index}`,
          entity: 'workers',
          rowId: worker.WorkerID || `row-${index}`,
          field: 'MaxLoadPerPhase',
          message: `Worker can only work ${worker.AvailableSlots.length} slots but MaxLoadPerPhase is ${worker.MaxLoadPerPhase}`,
          severity: 'warning',
          value: worker.MaxLoadPerPhase,
          suggestion: 'Reduce MaxLoadPerPhase to match available slots'
        });
      }
    });

    // j. Phase-slot saturation (placeholder - would need assignment logic)
    // This would require complex scheduling logic

    // k. Skill-coverage matrix: every RequiredSkill maps to >=1 worker
    tasks.forEach((task, index) => {
      if (task.RequiredSkills && task.RequiredSkills.length > 0) {
        const missingSkills = task.RequiredSkills.filter(skill => !workerSkills.has(skill));
        if (missingSkills.length > 0) {
          errors.push({
            id: `missing-skill-coverage-${index}`,
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
    });

    // l. Max-concurrency feasibility: MaxConcurrent <= count of qualified, available workers
    tasks.forEach((task, index) => {
      if (task.MaxConcurrent && task.MaxConcurrent > 0) {
        const qualifiedWorkers = workers.filter(worker =>
          task.RequiredSkills.every(skill => worker.Skills.includes(skill))
        ).length;

        if (task.MaxConcurrent > qualifiedWorkers) {
          errors.push({
            id: `max-concurrency-unfeasible-${index}`,
            entity: 'tasks',
            rowId: task.TaskID || `row-${index}`,
            field: 'MaxConcurrent',
            message: `MaxConcurrent (${task.MaxConcurrent}) exceeds available qualified workers (${qualifiedWorkers})`,
            severity: 'warning',
            value: task.MaxConcurrent,
            suggestion: 'Reduce MaxConcurrent or add more qualified workers'
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
