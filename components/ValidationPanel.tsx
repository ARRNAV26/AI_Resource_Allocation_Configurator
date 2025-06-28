'use client';

import { useState, useEffect } from 'react';
import { ValidationError } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Loader2,
  FileText,
  Users,
  Briefcase
} from 'lucide-react';

interface ValidationPanelProps {
  errors: ValidationError[];
  clients: any[];
  workers: any[];
  tasks: any[];
  onRefreshValidation?: () => void;
}

export function ValidationPanel({ 
  errors, 
  clients, 
  workers, 
  tasks,
  onRefreshValidation 
}: ValidationPanelProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastValidationTime, setLastValidationTime] = useState<Date | null>(null);

  const totalRecords = clients.length + workers.length + tasks.length;
  const criticalErrors = errors.filter(e => e.severity === 'critical');
  const warnings = errors.filter(e => e.severity === 'warning');
  const infoErrors = errors.filter(e => e.severity === 'info');

  const handleRefreshValidation = async () => {
    if (!onRefreshValidation) return;
    
    setIsValidating(true);
    setValidationError(null);
    
    try {
      await onRefreshValidation();
      setLastValidationTime(new Date());
    } catch (error) {
      setValidationError('Validation failed. Please try again.');
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-3 h-3 text-red-600" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-600" />;
      case 'info': return <Info className="w-3 h-3 text-blue-600" />;
      default: return <Info className="w-3 h-3" />;
    }
  };

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'clients': return <Users className="w-3 h-3" />;
      case 'workers': return <Briefcase className="w-3 h-3" />;
      case 'tasks': return <FileText className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  if (totalRecords === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            Validation
          </CardTitle>
          <CardDescription className="text-xs">
            Upload data to start validation
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center text-muted-foreground py-2 text-xs">
            No data to validate
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {errors.length === 0 ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : criticalErrors.length > 0 ? (
              <XCircle className="w-4 h-4 text-red-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-600" />
            )}
            <CardTitle className="text-sm">Validation</CardTitle>
          </div>
          {onRefreshValidation && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshValidation}
              disabled={isValidating}
              className="h-6 px-2 text-xs"
            >
              {isValidating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          {totalRecords} records • {lastValidationTime ? lastValidationTime.toLocaleTimeString() : 'Never validated'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Validation Error */}
        {validationError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="w-3 h-3" />
            <AlertDescription className="text-xs">{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Validation Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-red-50 rounded border">
            <div className="text-lg font-bold text-red-600">{criticalErrors.length}</div>
            <div className="text-xs text-red-600">Critical</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded border">
            <div className="text-lg font-bold text-yellow-600">{warnings.length}</div>
            <div className="text-xs text-yellow-600">Warnings</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded border">
            <div className="text-lg font-bold text-blue-600">{infoErrors.length}</div>
            <div className="text-xs text-blue-600">Info</div>
          </div>
        </div>

        {/* Success State */}
        {errors.length === 0 && !isValidating && (
          <Alert className="py-2">
            <CheckCircle className="w-3 h-3" />
            <AlertDescription className="text-xs">
              All validation checks passed!
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isValidating && (
          <Alert className="py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <AlertDescription className="text-xs">
              Running validation checks...
            </AlertDescription>
          </Alert>
        )}

        {/* Error List */}
        {errors.length > 0 && !isValidating && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium">Issues Found</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {errors.slice(0, 5).map((error) => (
                <div
                  key={error.id}
                  className={`p-2 rounded border-l-2 text-xs ${
                    error.severity === 'critical' 
                      ? 'border-red-500 bg-red-50' 
                      : error.severity === 'warning'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(error.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        {getEntityIcon(error.entity)}
                        <span className="font-medium">{error.field}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {error.severity}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-tight">{error.message}</p>
                    </div>
                  </div>
                </div>
              ))}
              {errors.length > 5 && (
                <div className="text-center text-xs text-muted-foreground py-1">
                  +{errors.length - 5} more issues
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 