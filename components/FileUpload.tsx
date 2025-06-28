'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Users, Briefcase, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File, entity: 'clients' | 'workers' | 'tasks') => void;
  compact?: boolean;
}

export function FileUpload({ onFileUpload, compact = false }: FileUploadProps) {
  const [selectedEntity, setSelectedEntity] = useState<'clients' | 'workers' | 'tasks'>('clients');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{
    file: File;
    entity: 'clients' | 'workers' | 'tasks';
    status: 'uploading' | 'success' | 'error';
    error?: string;
  }>>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    acceptedFiles.forEach(file => {
      const fileInfo = {
        file,
        entity: selectedEntity,
        status: 'uploading' as const,
      };
      
      setUploadedFiles(prev => [...prev, fileInfo]);
      
      // Call the parent handler
      console.log('Calling onFileUpload for:', file.name, 'entity:', selectedEntity);
      onFileUpload(file, selectedEntity);
    });
  }, [selectedEntity, onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
    noClick: true, // Prevent click on dropzone from opening file dialog
    noKeyboard: false,
  });

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Browse button clicked for entity:', selectedEntity);
    open();
  };

  const entityOptions = [
    {
      value: 'clients' as const,
      label: 'Clients',
      icon: Users,
      description: 'Client information and requirements'
    },
    {
      value: 'workers' as const,
      label: 'Workers',
      icon: Briefcase,
      description: 'Worker skills and availability'
    },
    {
      value: 'tasks' as const,
      label: 'Tasks',
      icon: FileText,
      description: 'Task definitions and requirements'
    }
  ];

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Entity Selection */}
        <div className="grid grid-cols-3 gap-1">
          {entityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedEntity(option.value)}
                className={`p-2 rounded border transition-all ${
                  selectedEntity === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Icon className="w-3 h-3" />
                  <span className="text-xs">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Compact Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded p-4 text-center transition-colors cursor-pointer ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          
          <Upload className="w-4 h-4 mx-auto mb-2 text-muted-foreground" />
          
          {isDragActive ? (
            <p className="text-primary font-medium text-xs">Drop files here...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-medium">
                Upload {selectedEntity} file
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={handleBrowseClick}
              >
                Browse
              </Button>
            </div>
          )}
        </div>

        {/* Upload Status */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium">Recent Uploads</h4>
            {uploadedFiles.slice(-3).map((fileInfo, index) => (
              <div
                key={`${fileInfo.file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-muted rounded text-xs"
              >
                <div className="flex items-center gap-2">
                  {fileInfo.status === 'success' ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : fileInfo.status === 'error' ? (
                    <AlertCircle className="w-3 h-3 text-red-600" />
                  ) : (
                    <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  
                  <div className="flex flex-col">
                    <span className="font-medium truncate max-w-24">{fileInfo.file.name}</span>
                    <span className="text-muted-foreground">
                      {fileInfo.entity}
                    </span>
                  </div>
                </div>
                
                <Badge
                  variant={
                    fileInfo.status === 'success'
                      ? 'default'
                      : fileInfo.status === 'error'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {fileInfo.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Entity Selection */}
      <div className="grid grid-cols-3 gap-2">
        {entityOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => setSelectedEntity(option.value)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedEntity === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{option.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            
            <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
            
            {isDragActive ? (
              <p className="text-primary font-medium">Drop your files here...</p>
            ) : (
              <div className="space-y-2">
                <p className="font-medium">
                  Drag & drop your {selectedEntity} file here
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV and Excel files
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={handleBrowseClick}
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Status */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Uploads</h4>
          {uploadedFiles.map((fileInfo, index) => (
            <div
              key={`${fileInfo.file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                {fileInfo.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : fileInfo.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{fileInfo.file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {fileInfo.entity}
                  </span>
                </div>
              </div>
              
              <Badge
                variant={
                  fileInfo.status === 'success'
                    ? 'default'
                    : fileInfo.status === 'error'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {fileInfo.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 