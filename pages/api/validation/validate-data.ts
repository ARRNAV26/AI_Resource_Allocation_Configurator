import type { NextApiRequest, NextApiResponse } from 'next';
import { Client, Worker, Task, ValidationError } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clients, workers, tasks } = req.body;

    const errors: ValidationError[] = [];

    // 1. Missing required columns validation
    validateRequiredColumns(clients, workers, tasks, errors);

    // 2. Duplicate IDs validation
    validateDuplicateIDs(clients, workers, tasks, errors);

    // 3. Malformed lists validation
    validateMalformedLists(clients, workers, tasks, errors);

    // 4. Out-of-range values validation
    validateOutOfRangeValues(clients, workers, tasks, errors);

    // 5. Broken JSON validation
    validateBrokenJSON(clients, workers, tasks, errors);

    // 6. Unknown references validation
    validateUnknownReferences(clients, workers, tasks, errors);

    // 7. Circular co-run groups validation
    validateCircularCoRunGroups(clients, workers, tasks, errors);

    // 8. Overloaded workers validation
    validateOverloadedWorkers(clients, workers, tasks, errors);

    // 9. Phase-slot saturation validation
    validatePhaseSlotSaturation(clients, workers, tasks, errors);

    // 10. Skill-coverage matrix validation
    validateSkillCoverage(clients, workers, tasks, errors);

    // 11. Max-concurrency feasibility validation
    validateMaxConcurrency(clients, workers, tasks, errors);

    // 12. Conflicting rules vs phase-window constraints
    validatePhaseWindowConstraints(clients, workers, tasks, errors);

    res.status(200).json({ 
      errors,
      summary: {
        totalErrors: errors.length,
        errorsByEntity: {
          clients: errors.filter(e => e.entity === 'clients').length,
          workers: errors.filter(e => e.entity === 'workers').length,
          tasks: errors.filter(e => e.entity === 'tasks').length,
        },
        errorsBySeverity: {
          critical: errors.filter(e => e.severity === 'critical').length,
          warning: errors.filter(e => e.severity === 'warning').length,
          info: errors.filter(e => e.severity === 'info').length,
        }
      }
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      details: error.message 
    });
  }
}

function validateRequiredColumns(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // Validate clients
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
        suggestion: `Generate a unique ClientID for this client`
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

  // Validate workers
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
        suggestion: `Generate a unique WorkerID for this worker`
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

  // Validate tasks
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
        suggestion: `Generate a unique TaskID for this task`
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
}

function validateDuplicateIDs(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // Check for duplicate ClientIDs
  const clientIDs = clients.map(c => c.ClientID).filter(Boolean);
  const duplicateClientIDs = clientIDs.filter((id, index) => clientIDs.indexOf(id) !== index);
  
  duplicateClientIDs.forEach(id => {
    errors.push({
      id: `duplicate-client-id-${id}`,
      entity: 'clients',
      rowId: id,
      field: 'ClientID',
      message: `Duplicate ClientID: ${id}`,
      severity: 'critical',
      value: id,
      suggestion: 'Ensure each ClientID is unique'
    });
  });

  // Check for duplicate WorkerIDs
  const workerIDs = workers.map(w => w.WorkerID).filter(Boolean);
  const duplicateWorkerIDs = workerIDs.filter((id, index) => workerIDs.indexOf(id) !== index);
  
  duplicateWorkerIDs.forEach(id => {
    errors.push({
      id: `duplicate-worker-id-${id}`,
      entity: 'workers',
      rowId: id,
      field: 'WorkerID',
      message: `Duplicate WorkerID: ${id}`,
      severity: 'critical',
      value: id,
      suggestion: 'Ensure each WorkerID is unique'
    });
  });

  // Check for duplicate TaskIDs
  const taskIDs = tasks.map(t => t.TaskID).filter(Boolean);
  const duplicateTaskIDs = taskIDs.filter((id, index) => taskIDs.indexOf(id) !== index);
  
  duplicateTaskIDs.forEach(id => {
    errors.push({
      id: `duplicate-task-id-${id}`,
      entity: 'tasks',
      rowId: id,
      field: 'TaskID',
      message: `Duplicate TaskID: ${id}`,
      severity: 'critical',
      value: id,
      suggestion: 'Ensure each TaskID is unique'
    });
  });
}

function validateMalformedLists(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // Validate AvailableSlots in workers
  workers.forEach((worker, index) => {
    if (worker.Availability && Array.isArray(worker.Availability)) {
      const invalidSlots = worker.Availability.filter(slot => 
        typeof slot !== 'number' || slot < 1 || !Number.isInteger(slot)
      );
      
      if (invalidSlots.length > 0) {
        errors.push({
          id: `malformed-available-slots-${index}`,
          entity: 'workers',
          rowId: worker.WorkerID || `row-${index}`,
          field: 'Availability',
          message: `Invalid available slots: ${invalidSlots.join(', ')}. Must be positive integers.`,
          severity: 'warning',
          value: worker.Availability,
          suggestion: 'Convert all slots to positive integers'
        });
      }
    }
  });
}

function validateOutOfRangeValues(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // Validate PriorityLevel in clients (1-5)
  clients.forEach((client, index) => {
    if (client.PriorityLevel !== undefined && (client.PriorityLevel < 1 || client.PriorityLevel > 5)) {
      errors.push({
        id: `invalid-priority-level-${index}`,
        entity: 'clients',
        rowId: client.ClientID || `row-${index}`,
        field: 'PriorityLevel',
        message: `PriorityLevel must be between 1 and 5, got: ${client.PriorityLevel}`,
        severity: 'warning',
        value: client.PriorityLevel,
        suggestion: 'Set PriorityLevel to a value between 1 and 5'
      });
    }
  });

  // Validate Duration in tasks (≥1)
  tasks.forEach((task, index) => {
    if (task.EstimatedDuration !== undefined && task.EstimatedDuration < 1) {
      errors.push({
        id: `invalid-duration-${index}`,
        entity: 'tasks',
        rowId: task.TaskID || `row-${index}`,
        field: 'EstimatedDuration',
        message: `Duration must be at least 1, got: ${task.EstimatedDuration}`,
        severity: 'warning',
        value: task.EstimatedDuration,
        suggestion: 'Set Duration to a value of 1 or greater'
      });
    }
  });
}

function validateBrokenJSON(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // Validate AttributesJSON in clients
  clients.forEach((client, index) => {
    if (client.AttributesJSON) {
      try {
        JSON.parse(client.AttributesJSON);
      } catch {
        errors.push({
          id: `broken-json-${index}`,
          entity: 'clients',
          rowId: client.ClientID || `row-${index}`,
          field: 'AttributesJSON',
          message: 'Invalid JSON format in AttributesJSON',
          severity: 'warning',
          value: client.AttributesJSON,
          suggestion: 'Fix the JSON syntax or remove invalid characters'
        });
      }
    }
  });
}

function validateUnknownReferences(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  const taskIDs = new Set(tasks.map(t => t.TaskID).filter(Boolean));
  
  // Validate RequestedTaskIDs in clients
  clients.forEach((client, index) => {
    if (client.RequestedTaskIDs && Array.isArray(client.RequestedTaskIDs)) {
      const unknownTasks = client.RequestedTaskIDs.filter(taskId => !taskIDs.has(taskId));
      
      if (unknownTasks.length > 0) {
        errors.push({
          id: `unknown-requested-tasks-${index}`,
          entity: 'clients',
          rowId: client.ClientID || `row-${index}`,
          field: 'RequestedTaskIDs',
          message: `Unknown task IDs: ${unknownTasks.join(', ')}`,
          severity: 'warning',
          value: client.RequestedTaskIDs,
          suggestion: 'Remove or correct the unknown task IDs'
        });
      }
    }
  });
}

function validateCircularCoRunGroups(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // This is a placeholder for circular co-run validation
  // Would need business rules to implement this properly
}

function validateOverloadedWorkers(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  workers.forEach((worker, index) => {
    if (worker.Availability && Array.isArray(worker.Availability) && worker.MaxLoadPerPhase !== undefined) {
      if (worker.Availability.length < worker.MaxLoadPerPhase) {
        errors.push({
          id: `overloaded-worker-${index}`,
          entity: 'workers',
          rowId: worker.WorkerID || `row-${index}`,
          field: 'MaxLoadPerPhase',
          message: `Worker has ${worker.Availability.length} available slots but MaxLoadPerPhase is ${worker.MaxLoadPerPhase}`,
          severity: 'warning',
          value: worker.MaxLoadPerPhase,
          suggestion: 'Increase available slots or decrease MaxLoadPerPhase'
        });
      }
    }
  });
}

function validatePhaseSlotSaturation(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // This is a placeholder for phase-slot saturation validation
  // Would need to calculate total worker slots per phase vs task durations
}

function validateSkillCoverage(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  const allWorkerSkills = new Set();
  workers.forEach(worker => {
    if (worker.Skills && Array.isArray(worker.Skills)) {
      worker.Skills.forEach(skill => allWorkerSkills.add(skill));
    }
  });

  tasks.forEach((task, index) => {
    if (task.RequiredSkills && Array.isArray(task.RequiredSkills)) {
      const uncoveredSkills = task.RequiredSkills.filter(skill => !allWorkerSkills.has(skill));
      
      if (uncoveredSkills.length > 0) {
        errors.push({
          id: `uncovered-skills-${index}`,
          entity: 'tasks',
          rowId: task.TaskID || `row-${index}`,
          field: 'RequiredSkills',
          message: `No workers have these skills: ${uncoveredSkills.join(', ')}`,
          severity: 'critical',
          value: task.RequiredSkills,
          suggestion: 'Add workers with these skills or modify task requirements'
        });
      }
    }
  });
}

function validateMaxConcurrency(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // This is a placeholder for max-concurrency validation
  // Would need to count qualified, available workers per task
}

function validatePhaseWindowConstraints(clients: Client[], workers: Worker[], tasks: Task[], errors: ValidationError[]) {
  // This is a placeholder for phase-window constraint validation
  // Would need business rules to implement this properly
} 