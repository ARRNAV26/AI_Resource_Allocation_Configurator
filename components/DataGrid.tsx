'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResult } from '@/types';
import { Edit2, Save, X } from 'lucide-react';

interface DataGridProps {
  data: any[];
  entity: 'clients' | 'workers' | 'tasks';
  searchResults: SearchResult | null;
}

export function DataGrid({ data, entity, searchResults }: DataGridProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const isHighlighted = (rowId: string) => {
    return searchResults?.entity === entity && searchResults.rowIds.includes(rowId);
  };

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
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'number' && key.includes('Rate')) {
      return `$${value}/hr`;
    }
    if (typeof value === 'number' && key.includes('Duration')) {
      return `${value}h`;
    }
    if (typeof value === 'number' && key.includes('Budget')) {
      return `$${value.toLocaleString()}`;
    }
    return String(value || '');
  };

  const handleEdit = (rowId: string, field: string, value: any) => {
    setEditingCell({ rowId, field });
    setEditValue(Array.isArray(value) ? value.join(', ') : String(value || ''));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    setEditingCell(null);
  };

  const handleCancel = () => {
    setEditingCell(null);
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
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
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
            {data.map((row, index) => {
              const rowId = row[`${entity.slice(0, -1)}ID`] || `row-${index}`;
              const isHighlightedRow = isHighlighted(rowId);
              
              return (
                <tr
                  key={rowId}
                  className={`border-b hover:bg-muted/30 transition-colors group ${
                    isHighlightedRow ? 'bg-primary/10 border-primary/20' : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="p-4 text-sm">
                      {editingCell?.rowId === rowId && editingCell?.field === column.key ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                          />
                          <Button size="sm" onClick={handleSave} className="h-7 w-7 p-0">
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 w-7 p-0">
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
          <span>Total {entity}: {data.length}</span>
          {searchResults?.entity === entity && (
            <span>{searchResults.rowIds.length} matches found</span>
          )}
        </div>
      </div>
    </div>
  );
} 