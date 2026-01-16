import type { NextApiRequest, NextApiResponse } from 'next';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clients, workers, tasks, rules, priorities } = req.body;

    // Perform allocation
    const allocationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/allocation/allocate-resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clients, workers, tasks, rules, priorities })
    });

    if (!allocationResponse.ok) {
      throw new Error('Allocation failed');
    }

    const allocationResult = await allocationResponse.json();

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Add data sheets
    if (clients && clients.length > 0) {
      const clientsSheet = XLSX.utils.json_to_sheet(clients);
      XLSX.utils.book_append_sheet(workbook, clientsSheet, 'Clients');
    }

    if (workers && workers.length > 0) {
      const workersSheet = XLSX.utils.json_to_sheet(workers);
      XLSX.utils.book_append_sheet(workbook, workersSheet, 'Workers');
    }

    if (tasks && tasks.length > 0) {
      const tasksSheet = XLSX.utils.json_to_sheet(tasks);
      XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');
    }

    // Add rules sheet
    if (rules && rules.length > 0) {
      const rulesSheet = XLSX.utils.json_to_sheet(rules);
      XLSX.utils.book_append_sheet(workbook, rulesSheet, 'BusinessRules');
    }

    // Add priorities sheet
    if (priorities) {
      const prioritiesData = Object.entries(priorities).map(([key, value]) => ({
        Criterion: key,
        Weight: value
      }));
      const prioritiesSheet = XLSX.utils.json_to_sheet(prioritiesData);
      XLSX.utils.book_append_sheet(workbook, prioritiesSheet, 'Priorities');
    }

    // Add allocation results
    if (allocationResult.assignments && allocationResult.assignments.length > 0) {
      const assignmentsSheet = XLSX.utils.json_to_sheet(allocationResult.assignments);
      XLSX.utils.book_append_sheet(workbook, assignmentsSheet, 'Allocations');
    }

    if (allocationResult.metrics) {
      const metricsData = Object.entries(allocationResult.metrics).map(([key, value]) => ({
        Metric: key,
        Value: value
      }));
      const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');
    }

    if (allocationResult.unassignedTasks && allocationResult.unassignedTasks.length > 0) {
      const unassignedSheet = XLSX.utils.json_to_sheet(
        allocationResult.unassignedTasks.map((taskId: string) => ({ TaskID: taskId }))
      );
      XLSX.utils.book_append_sheet(workbook, unassignedSheet, 'UnassignedTasks');
    }

    if (allocationResult.violations && allocationResult.violations.length > 0) {
      const violationsSheet = XLSX.utils.json_to_sheet(
        allocationResult.violations.map((v: any) => ({
          RuleID: v.rule.id,
          RuleName: v.rule.name,
          Description: v.description
        }))
      );
      XLSX.utils.book_append_sheet(workbook, violationsSheet, 'Violations');
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=resource-allocation-package.xlsx');
    res.setHeader('Content-Length', excelBuffer.length);

    res.status(200).send(excelBuffer);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({
      error: 'Failed to export package',
      details: error.message
    });
  }
}
