'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchResult } from '@/types';
import { Edit2, Save, X, ArrowUpDown, Eye, EyeOff, Filter, MoreHorizontal, CheckCircle2, AlertTriangle, Info, Users, Settings } from 'lucide-react';
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
        { key: 'GroupTag', label: 'Group', width: 'w-32' },
        { key: 'AttributesJSON', label: 'Attributes', width: 'w-48' },
      ];
    } else if (entity === 'workers') {
      return [
        { key: 'WorkerID', label: 'Worker ID', width: 'w-32' },
        { key: 'WorkerName', label: 'Name', width: 'w-48' },
        { key: 'Skills', label: 'Skills', width: 'w-48' },
        { key: 'AvailableSlots', label: 'Available Slots', width: 'w-32' },
        { key: 'MaxLoadPerPhase', label: 'Max Load', width: 'w-24' },
        { key: 'WorkerGroup', label: 'Group', width: 'w-32' },
        { key: 'QualificationLevel', label: 'Qualification', width: 'w-24' },
      ];
    } else {
      return [
        { key: 'TaskID', label: 'Task ID', width: 'w-32' },
        { key: 'TaskName', label: 'Name', width: 'w-48' },
        { key: 'Category', label: 'Category', width: 'w-32' },
        { key: 'Duration', label: 'Duration', width: 'w-24' },
        { key: 'RequiredSkills', label: 'Skills', width: 'w-48' },
        { key: 'PreferredPhases', label: 'Preferred Phases', width: 'w-32' },
        { key: 'MaxConcurrent', label: 'Max Concurrent', width: 'w-24' },
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

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.key))
  );
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Enhanced sorting
  const sortedData = useMemo(() => {
    let sorted = [...processedData];

    if (sortConfig) {
      sorted.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [processedData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey);
      } else {
        newSet.add(columnKey);
      }
      return newSet;
    });
  };

  const visibleColumnsData = columns.filter(col => visibleColumns.has(col.key));

  if (data.length === 0) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/25">
        <CardContent className="flex flex-col items-center justify-center h-64 text-center space-y-4">
          <div className="p-4 bg-muted/50 rounded-full">
            <Filter className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-muted-foreground">
              No {entity} data available
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Upload a CSV or Excel file containing your {entity} data to get started with AI-powered analysis and validation.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-lg">
      {/* Enhanced Header with Controls */}
      <div className="bg-gradient-to-r from-card to-muted/20 border-b">
        <div className="p-4 space-y-3">
          {/* Title and Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {entity === 'clients' && <Users className="w-5 h-5 text-primary" />}
                {entity === 'workers' && <Settings className="w-5 h-5 text-primary" />}
                {entity === 'tasks' && <CheckCircle2 className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h3 className="font-semibold text-lg capitalize">{entity}</h3>
                <p className="text-sm text-muted-foreground">
                  {processedData.length} records
                  {searchResults?.entity === entity && (
                    <span className="ml-2 text-primary">
                      • {searchResults.rowIds.length} matches
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Column Visibility Toggle */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8">
                <Eye className="w-3 h-3 mr-1" />
                Columns
              </Button>
              <div className="flex gap-1">
                {columns.slice(0, 3).map(col => (
                  <Button
                    key={col.key}
                    variant={visibleColumns.has(col.key) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleColumnVisibility(col.key)}
                    className="h-8 px-2 text-xs"
                  >
                    {visibleColumns.has(col.key) ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Priority Indicators */}
          {(entity === 'clients' && priorities.clientPriorityFulfillment > 50) ||
           (entity === 'workers' && priorities.workerWorkLifeBalance > 50) ||
           (entity === 'tasks' && priorities.costEfficiency > 50) ? (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <ArrowUpDown className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                {entity === 'clients' && `Sorted by priority (${priorities.clientPriorityFulfillment}% fulfillment)`}
                {entity === 'workers' && `Sorted by workload balance (${priorities.workerWorkLifeBalance}% work-life)`}
                {entity === 'tasks' && `Sorted by cost efficiency (${priorities.costEfficiency}% efficiency)`}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              {visibleColumnsData.map((column) => (
                <th
                  key={column.key}
                  className={`text-left p-4 text-sm font-semibold text-muted-foreground ${column.width} group`}
                >
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    {column.label}
                    <ArrowUpDown className={`w-3 h-3 transition-all ${
                      sortConfig?.key === column.key
                        ? sortConfig.direction === 'asc'
                          ? 'text-primary rotate-180'
                          : 'text-primary'
                        : 'text-muted-foreground/50 group-hover:text-muted-foreground'
                    }`} />
                  </button>
                </th>
              ))}
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground w-24">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => {
              const rowId = row[`${entity.slice(0, -1)}ID`] || row.id || index.toString();
              const isHighlightedRow = isHighlighted(rowId);

              return (
                <tr
                  key={rowId}
                  className={`border-b hover:bg-muted/20 transition-all duration-200 group ${
                    isHighlightedRow
                      ? 'bg-primary/5 border-primary/10 shadow-sm'
                      : 'hover:shadow-sm'
                  }`}
                >
                  {visibleColumnsData.map((column) => (
                    <td key={column.key} className="p-4">
                      {editingCell?.rowId === rowId && editingCell?.field === column.key ? (
                        <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between group/cell">
                          <div className="flex-1 min-w-0">
                            {formatValue(row[column.key], column.key)}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(rowId, column.key, row[column.key])}
                            className="opacity-0 group-hover/cell:opacity-100 transition-all duration-200 h-8 w-8 p-0 ml-2 hover:bg-primary/10"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {isHighlightedRow ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 animate-in fade-in">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Match
                        </Badge>
                      ) : (
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Enhanced Footer */}
      <div className="bg-gradient-to-r from-muted/20 to-muted/10 px-4 py-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Showing {sortedData.length} of {processedData.length} records
            </span>
            {sortConfig && (
              <Badge variant="outline" className="text-xs">
                Sorted by {columns.find(c => c.key === sortConfig.key)?.label}
                {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Info className="w-4 h-4" />
            <span className="text-xs">
              Click column headers to sort • Hover to edit cells
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
