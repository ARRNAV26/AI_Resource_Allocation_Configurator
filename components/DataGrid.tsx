'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResult } from '@/types';
import { Edit2, Save, X, ArrowUpDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface DataGridProps {
  data: any[];
  entity: 'clients' | 'workers' | 'tasks';
  searchResults: SearchResult | null;
}

export function DataGrid({ data, entity, searchResults }: DataGridProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const { priorities } = useAppStore();

  const isHighlighted = (rowId: string) => {
    return searchResults?.entity === entity && searchResults.rowIds.includes(rowId);
  };

  // Apply priority-based sorting and filtering
  const processedData = useMemo(() => {
    let processed = [...data];

    // Apply priority-based sorting
    if (entity === 'clients' && priorities.clientPriorityFulfillment > 50) {
      processed.sort((a, b) => (b.PriorityLevel || 0) - (a.PriorityLevel || 0));
    } else if (entity === 'workers' && priorities.workerWorkLifeBalance > 50) {
      processed.sort((a, b) => (a.MaxLoadPerPhase || 0) - (b.MaxLoadPerPhase || 0));
    } else if (entity === 'tasks' && priorities.costEfficiency > 50) {
      processed.sort((a, b) => (a.Cost || 0) - (b.Cost || 0));
    }

    // Apply priority-based filtering
    if (entity === 'clients' && priorities.clientPriorityFulfillment > 70) {
      processed = processed.filter(item => (item.PriorityLevel || 0) >= 3);
    } else if (entity === 'workers' && priorities.workerWorkLifeBalance > 70) {
      processed = processed.filter(item => (item.MaxLoadPerPhase || 0) <= 5);
    } else if (entity === 'tasks' && priorities.costEfficiency > 70) {
      processed = processed.filter(item => (item.Cost || 0) <= 1000);
    }

    return processed;
  }, [data, entity, priorities]);

  const getColumns = () => {
    if (entity === 'clients') {
      return [
        { key: 'ClientID', label: 'Client ID', width: 'w-32' },
        { key: 'ClientName', label: 'Name', width: 'w-48' },
        { key: 'PriorityLevel', label: 'Priority', width: 'w-20' },
        { key: 'RequestedTaskIDs', label: 'Tasks', width: 'w-48' },
        { key: 'ContactEmail', label: 'Email', width: 'w-48' },
        { key: 'Budget', label: 'Budget', width: 'w-24' },
      ];
    } else if (entity === 'workers') {
      return [
        { key: 'WorkerID', label: 'Worker ID', width: 'w-32' },
        { key: 'WorkerName', label: 'Name', width: 'w-48' },
        { key: 'Skills', label: 'Skills', width: 'w-48' },
        { key: 'WorkerGroup', label: 'Group', width: 'w-32' },
        { key: 'MaxLoadPerPhase', label: 'Max Load', width: 'w-24' },
        { key: 'HourlyRate', label: 'Rate', width: 'w-24' },
      ];
    } else {
      return [
        { key: 'TaskID', label: 'Task ID', width: 'w-32' },
        { key: 'TaskName', label: 'Name', width: 'w-48' },
        { key: 'RequiredSkills', label: 'Skills', width: 'w-48' },
        { key: 'EstimatedDuration', label: 'Duration', width: 'w-24' },
        { key: 'Phase', label: 'Phase', width: 'w-32' },
        { key: 'Priority', label: 'Priority', width: 'w-20' },
      ];
    }
  };

  const formatValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '-';
    
    if (key === 'PriorityLevel' || key === 'Priority') {
      const priority = parseInt(value);
      return (
        <Badge 
          variant={priority >= 4 ? 'destructive' : priority >= 3 ? 'default' : 'secondary'}
          className="text-xs"
        >
          {priority}
        </Badge>
      );
    }
    
    if (key === 'Budget' || key === 'HourlyRate' || key === 'Cost') {
      return typeof value === 'number' ? `$${value.toLocaleString()}` : value;
    }
    
    if (key === 'Skills' || key === 'RequiredSkills') {
      if (Array.isArray(value)) {
        return value.slice(0, 2).join(', ') + (value.length > 2 ? '...' : '');
      }
      return value;
    }
    
    if (key === 'RequestedTaskIDs') {
      if (Array.isArray(value)) {
        return value.length > 0 ? `${value.length} tasks` : 'No tasks';
      }
      return value;
    }
    
    return String(value);
  };

  const handleEdit = (rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue?.toString() || '');
  };

  const handleSave = () => {
    if (!editingCell) return;
    
    // Update the data in the store
    const { updateClient, updateWorker, updateTask } = useAppStore.getState();
    const updates = { [editingCell.field]: editValue };
    
    if (entity === 'clients') {
      updateClient(editingCell.rowId, updates);
    } else if (entity === 'workers') {
      updateWorker(editingCell.rowId, updates);
    } else {
      updateTask(editingCell.rowId, updates);
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const columns = getColumns();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center">
          <p className="text-muted-foreground text-lg font-medium">
            No {entity} data available
          </p>
          <p className="text-muted-foreground text-sm">
            Upload a file to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Priority indicator */}
      {entity === 'clients' && priorities.clientPriorityFulfillment > 50 && (
        <div className="bg-blue-50 border-b px-4 py-2 flex items-center gap-2">
          <ArrowUpDown className="w-3 h-3 text-blue-600" />
          <span className="text-xs text-blue-600">
            Sorted by priority (Client Priority: {priorities.clientPriorityFulfillment}%)
          </span>
        </div>
      )}
      {entity === 'workers' && priorities.workerWorkLifeBalance > 50 && (
        <div className="bg-green-50 border-b px-4 py-2 flex items-center gap-2">
          <ArrowUpDown className="w-3 h-3 text-green-600" />
          <span className="text-xs text-green-600">
            Sorted by workload balance (Work-Life Balance: {priorities.workerWorkLifeBalance}%)
          </span>
        </div>
      )}
      {entity === 'tasks' && priorities.costEfficiency > 50 && (
        <div className="bg-orange-50 border-b px-4 py-2 flex items-center gap-2">
          <ArrowUpDown className="w-3 h-3 text-orange-600" />
          <span className="text-xs text-orange-600">
            Sorted by cost efficiency (Cost Efficiency: {priorities.costEfficiency}%)
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted/50 border-b">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.key} 
                  className={`text-left p-4 text-sm font-semibold text-muted-foreground ${column.width}`}
                >
                  {column.label}
                </th>
              ))}
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, index) => {
              const rowId = row[`${entity.slice(0, -1)}ID`] || row.id || index.toString();
              const isHighlightedRow = isHighlighted(rowId);
              
              return (
                <tr
                  key={rowId}
                  className={`border-b hover:bg-muted/30 transition-colors group ${
                    isHighlightedRow ? 'bg-primary/10 border-primary/20' : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="p-4">
                      {editingCell?.rowId === rowId && editingCell?.field === column.key ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border rounded"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSave} className="h-6 w-6 p-0">
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel} className="h-6 w-6 p-0">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group/cell">
                          <span className="truncate">{formatValue(row[column.key], column.key)}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(rowId, column.key, row[column.key])}
                            className="opacity-0 group-hover/cell:opacity-100 transition-opacity h-7 w-7 p-0 ml-2"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="p-4">
                    {isHighlightedRow && (
                      <Badge variant="secondary" className="text-xs">
                        Match
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Summary footer */}
      <div className="bg-muted/30 px-4 py-3 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total {entity}: {processedData.length}</span>
          {searchResults?.entity === entity && (
            <span>{searchResults.rowIds.length} matches found</span>
          )}
        </div>
      </div>
    </div>
  );
} 