'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Info,
  RefreshCw,
  ArrowLeft,
  X,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ValidationError } from '@/types';

interface ValidationPanelProps {
  errors: ValidationError[];
  clients: any[];
  workers: any[];
  tasks: any[];
  onRefreshValidation: () => void;
  onClose: () => void;
}

export function ValidationPanel({
  errors,
  clients,
  workers,
  tasks,
  onRefreshValidation,
  onClose
}: ValidationPanelProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshValidation();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleErrorExpansion = (errorId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  };

  const filteredErrors = errors.filter(error => {
    const matchesFilter = filter === 'all' ||
      (filter === 'critical' && error.severity === 'critical') ||
      (filter === 'warning' && error.severity === 'warning') ||
      (filter === 'info' && error.severity === 'info');

    const matchesSearch = !searchTerm ||
      error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
      error.rowId.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const errorStats = {
    critical: errors.filter(e => e.severity === 'critical').length,
    warning: errors.filter(e => e.severity === 'warning').length,
    info: errors.filter(e => e.severity === 'info').length,
    total: errors.length
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50 dark:bg-red-950/20';
      case 'warning': return 'border-orange-200 bg-orange-50 dark:bg-orange-950/20';
      case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const validationChecks = [
    {
      title: 'Data Integrity',
      description: 'Required fields, data types, and format validation',
      checks: [
        'Missing required fields (ClientID, WorkerID, TaskID, etc.)',
        'Duplicate IDs across entities',
        'Malformed data types (non-numeric values where numbers expected)',
        'Invalid JSON in AttributesJSON fields'
      ]
    },
    {
      title: 'Business Rules',
      description: 'Cross-entity relationships and business logic validation',
      checks: [
        'Client-Task references (RequestedTaskIDs must exist)',
        'Skill coverage (all RequiredSkills must be available)',
        'Worker capacity limits (AvailableSlots vs MaxLoadPerPhase)',
        'Task concurrency constraints (MaxConcurrent validation)'
      ]
    },
    {
      title: 'Data Quality',
      description: 'Range validation and logical consistency checks',
      checks: [
        'Priority levels (1-5 range validation)',
        'Duration values (must be positive)',
        'Phase slot validation (AvailableSlots must be valid numbers)',
        'Group consistency (WorkerGroup vs Client GroupTag alignment)'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Data Validation</h2>
                <p className="text-sm text-muted-foreground">Quality Assurance Center</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-6">
          {/* Status Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Validation Status</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Health</span>
                <span className={`font-medium ${
                  errorStats.critical > 0 ? 'text-red-600' :
                  errorStats.warning > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {errorStats.critical > 0 ? 'Critical Issues' :
                   errorStats.warning > 0 ? 'Needs Attention' : 'All Clear'}
                </span>
              </div>
              <Progress
                value={Math.max(0, 100 - (errorStats.total * 10))}
                className="h-2"
              />
            </div>

            {/* Error Statistics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
                <div className="text-lg font-bold text-red-600">{errorStats.critical}</div>
                <div className="text-xs text-red-600">Critical</div>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                <div className="text-lg font-bold text-orange-600">{errorStats.warning}</div>
                <div className="text-xs text-orange-600">Warnings</div>
              </div>
            </div>

            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-600">{errorStats.info}</div>
              <div className="text-xs text-blue-600">Info</div>
            </div>
          </div>

          {/* Validation Categories */}
          <div className="space-y-3">
            <h3 className="font-medium">Validation Checks</h3>
            {validationChecks.map((category, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-1">{category.title}</h4>
                <p className="text-xs text-muted-foreground mb-2">{category.description}</p>
                <ul className="text-xs space-y-1">
                  {category.checks.map((check, checkIndex) => (
                    <li key={checkIndex} className="flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{check}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Data Summary */}
          <div className="p-4 border-t">
            <h3 className="font-medium mb-3">Data Summary</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Clients:</span>
                <span>{clients.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Workers:</span>
                <span>{workers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasks:</span>
                <span>{tasks.length}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground">
                <span>Total Records:</span>
                <span>{clients.length + workers.length + tasks.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Data
            </Button>
            <div className="h-4 w-px bg-border"></div>
            <div>
              <h1 className="text-2xl font-bold">Data Validation Center</h1>
              <p className="text-muted-foreground">
                Comprehensive quality assurance and error resolution
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({errorStats.total})
              </Button>
              <Button
                variant={filter === 'critical' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('critical')}
                className="text-red-600"
              >
                Critical ({errorStats.critical})
              </Button>
              <Button
                variant={filter === 'warning' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('warning')}
                className="text-orange-600"
              >
                Warnings ({errorStats.warning})
              </Button>
              <Button
                variant={filter === 'info' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('info')}
                className="text-blue-600"
              >
                Info ({errorStats.info})
              </Button>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search errors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Error List */}
          {filteredErrors.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                {errors.length === 0 ? 'All Clear!' : 'No matching errors'}
              </h3>
              <p className="text-muted-foreground">
                {errors.length === 0
                  ? 'Your data passes all validation checks.'
                  : 'Try adjusting your filters or search terms.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredErrors.map((error) => (
                <Card key={error.id} className={`border-l-4 ${getSeverityColor(error.severity)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={
                              error.severity === 'critical' ? 'destructive' :
                              error.severity === 'warning' ? 'secondary' : 'outline'
                            }>
                              {error.severity}
                            </Badge>
                            <span className="text-sm font-medium text-muted-foreground">
                              {error.entity} • {error.field}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              ID: {error.rowId}
                            </span>
                          </div>

                          <p className="text-sm mb-2">{error.message}</p>

                          {error.suggestion && (
                            <div className="bg-primary/5 border border-primary/20 rounded p-2 mb-2">
                              <p className="text-xs font-medium text-primary mb-1">💡 Suggestion</p>
                              <p className="text-xs text-primary">{error.suggestion}</p>
                            </div>
                          )}

                          {error.value !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              Current value: <code className="bg-muted px-1 py-0.5 rounded">
                                {typeof error.value === 'object' ? JSON.stringify(error.value) : String(error.value)}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleErrorExpansion(error.id)}
                      >
                        {expandedErrors.has(error.id) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {expandedErrors.has(error.id) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="bg-muted/50 rounded p-3">
                          <h4 className="text-sm font-medium mb-2">Technical Details</h4>
                          <div className="text-xs space-y-1">
                            <div><strong>Error ID:</strong> {error.id}</div>
                            <div><strong>Entity:</strong> {error.entity}</div>
                            <div><strong>Field:</strong> {error.field}</div>
                            <div><strong>Row ID:</strong> {error.rowId}</div>
                            <div><strong>Severity:</strong> {error.severity}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
