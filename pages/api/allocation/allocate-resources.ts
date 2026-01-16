import type { NextApiRequest, NextApiResponse } from 'next';
import { Client, Worker, Task, BusinessRule, PriorityWeights } from '@/types';

interface AllocationResult {
  assignments: Array<{
    taskId: string;
    workerId: string;
    phase: number;
    confidence: number;
  }>;
  unassignedTasks: string[];
  metrics: {
    totalAssignments: number;
    clientPriorityFulfillment: number;
    workerUtilizationBalance: number;
    costEfficiency: number;
  };
  violations: Array<{
    rule: BusinessRule;
    description: string;
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      clients,
      workers,
      tasks,
      rules,
      priorities
    }: {
      clients: Client[];
      workers: Worker[];
      tasks: Task[];
      rules: BusinessRule[];
      priorities: PriorityWeights;
    } = req.body;

    // Validate inputs
    if (!clients || !workers || !tasks || !rules || !priorities) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Perform deterministic allocation
    const result = performAllocation(clients, workers, tasks, rules, priorities);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Allocation error:', error);
    res.status(500).json({
      error: 'Allocation failed',
      details: error.message
    });
  }
}

function performAllocation(
  clients: Client[],
  workers: Worker[],
  tasks: Task[],
  rules: BusinessRule[],
  priorities: PriorityWeights
): AllocationResult {
  const assignments: AllocationResult['assignments'] = [];
  const unassignedTasks: string[] = [];
  const violations: AllocationResult['violations'] = [];

  // Create lookup maps for efficiency
  const taskMap = new Map(tasks.map(t => [t.TaskID, t]));
  const workerMap = new Map(workers.map(w => [w.WorkerID, w]));
  const clientMap = new Map(clients.map(c => [c.ClientID, c]));

  // Sort tasks by priority (client priority descending, then task duration)
  const sortedTasks = tasks.sort((a, b) => {
    const aClient = clients.find(c => c.RequestedTaskIDs.includes(a.TaskID));
    const bClient = clients.find(c => c.RequestedTaskIDs.includes(b.TaskID));

    const aPriority = aClient?.PriorityLevel || 3;
    const bPriority = bClient?.PriorityLevel || 3;

    if (aPriority !== bPriority) return bPriority - aPriority; // Higher priority first
    return a.Duration - b.Duration; // Shorter tasks first
  });

  // Initialize worker availability
  const workerAvailability = new Map<string, number[]>();
  workers.forEach(worker => {
    workerAvailability.set(worker.WorkerID, [...worker.AvailableSlots]);
  });

  // Process each task in priority order
  for (const task of sortedTasks) {
    let assigned = false;

    // Find suitable workers
    const suitableWorkers = workers.filter(worker =>
      task.RequiredSkills.every(skill => worker.Skills.includes(skill)) &&
      workerAvailability.get(worker.WorkerID)!.length >= task.Duration &&
      worker.MaxLoadPerPhase >= task.Duration
    );

    if (suitableWorkers.length === 0) {
      unassignedTasks.push(task.TaskID);
      continue;
    }

    // Sort suitable workers by score (considering priorities)
    const scoredWorkers = suitableWorkers.map(worker => ({
      worker,
      score: calculateWorkerScore(worker, task, clients, priorities, assignments)
    })).sort((a, b) => b.score - a.score);

    // Try to assign to best worker
    for (const { worker } of scoredWorkers) {
      const assignment = tryAssignTask(task, worker, workerAvailability, rules, violations);
      if (assignment) {
        assignments.push(assignment);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      unassignedTasks.push(task.TaskID);
    }
  }

  // Calculate metrics
  const metrics = calculateMetrics(assignments, clients, workers, tasks, priorities);

  return {
    assignments,
    unassignedTasks,
    metrics,
    violations
  };
}

function calculateWorkerScore(
  worker: Worker,
  task: Task,
  clients: Client[],
  priorities: PriorityWeights,
  currentAssignments: AllocationResult['assignments']
): number {
  let score = 0;

  // Client priority fulfillment
  const client = clients.find(c => c.RequestedTaskIDs.includes(task.TaskID));
  if (client) {
    score += priorities.clientPriorityFulfillment * (client.PriorityLevel / 5);
  }

  // Worker utilization balance (prefer less loaded workers)
  const workerAssignments = currentAssignments.filter(a => a.workerId === worker.WorkerID).length;
  const utilization = workerAssignments / worker.MaxLoadPerPhase;
  score += priorities.workerWorkLifeBalance * (1 - utilization);

  // Cost efficiency (simplified - could be based on hourly rates)
  score += priorities.costEfficiency * (1 / worker.QualificationLevel);

  return score;
}

function tryAssignTask(
  task: Task,
  worker: Worker,
  workerAvailability: Map<string, number[]>,
  rules: BusinessRule[],
  violations: AllocationResult['violations']
): AllocationResult['assignments'][0] | null {
  const availableSlots = workerAvailability.get(worker.WorkerID)!;

  // Check phase window rules
  const phaseWindowRules = rules.filter(r =>
    r.type === 'phaseWindow' &&
    r.enabled &&
    r.parameters.taskId === task.TaskID
  );

  // Find available phase
  for (let phase = 0; phase < availableSlots.length; phase++) {
    if (availableSlots[phase] < task.Duration) continue;

    // Check phase window constraints
    if (phaseWindowRules.length > 0) {
      const allowedPhases = phaseWindowRules.flatMap(r => r.parameters.allowedPhases);
      if (!allowedPhases.includes(phase + 1)) continue; // Phases are 1-indexed in rules
    }

    // Check load limit rules
    const loadLimitRules = rules.filter(r =>
      r.type === 'loadLimit' &&
      r.enabled &&
      r.parameters.workerGroup === worker.WorkerGroup
    );

    if (loadLimitRules.some(r => r.parameters.maxSlotsPerPhase && r.parameters.maxSlotsPerPhase < task.Duration)) {
      violations.push({
        rule: loadLimitRules[0],
        description: `Task ${task.TaskID} exceeds load limit for worker group ${worker.WorkerGroup}`
      });
      continue;
    }

    // Assign task
    availableSlots[phase] -= task.Duration;
    return {
      taskId: task.TaskID,
      workerId: worker.WorkerID,
      phase: phase + 1, // 1-indexed
      confidence: 1.0
    };
  }

  return null;
}

function calculateMetrics(
  assignments: AllocationResult['assignments'],
  clients: Client[],
  workers: Worker[],
  tasks: Task[],
  priorities: PriorityWeights
): AllocationResult['metrics'] {
  const totalAssignments = assignments.length;

  // Client priority fulfillment
  let priorityScore = 0;
  clients.forEach(client => {
    const clientTasks = client.RequestedTaskIDs;
    const assignedTasks = assignments.filter(a =>
      clientTasks.includes(a.taskId)
    ).length;
    const fulfillment = assignedTasks / clientTasks.length;
    priorityScore += fulfillment * (client.PriorityLevel / 5);
  });
  const clientPriorityFulfillment = priorityScore / clients.length;

  // Worker utilization balance
  let balanceScore = 0;
  workers.forEach(worker => {
    const workerAssignments = assignments.filter(a => a.workerId === worker.WorkerID);
    const utilization = workerAssignments.length / worker.MaxLoadPerPhase;
    balanceScore += 1 - Math.abs(utilization - 0.8); // Optimal utilization around 80%
  });
  const workerUtilizationBalance = balanceScore / workers.length;

  // Cost efficiency (simplified)
  const costEfficiency = 1.0; // Placeholder

  return {
    totalAssignments,
    clientPriorityFulfillment: clientPriorityFulfillment * priorities.clientPriorityFulfillment,
    workerUtilizationBalance: workerUtilizationBalance * priorities.workerWorkLifeBalance,
    costEfficiency: costEfficiency * priorities.costEfficiency
  };
}
