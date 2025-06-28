'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { ValidationService } from '@/lib/validationService';
import { FileService } from '@/lib/fileService';
import { AIService } from '@/lib/aiService';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { DataGrid } from '@/components/DataGrid';
import { ValidationPanel } from '@/components/ValidationPanel';
import { SearchBar } from '@/components/SearchBar';
import { BusinessRulesPanel } from '@/components/BusinessRulesPanel';
import { PrioritiesPanel } from '@/components/PrioritiesPanel';
import { ExportButton } from '@/components/ExportButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { BusinessRule } from '@/types';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    clients,
    workers,
    tasks,
    errors,
    rules,
    priorities,
    activeTab,
    searchQuery,
    searchResults,
    uploads,
    isLoading,
    isProcessing,
    setClients,
    setWorkers,
    setTasks,
    setErrors,
    addRule,
    removeRule,
    updateRule,
    setActiveTab,
    setSearchQuery,
    setSearchResults,
    setLoading,
    setProcessing,
    addUpload,
    updateUpload,
    removeUpload,
  } = useAppStore();

  // Validation effect
  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      setLoading(true);
      ValidationService.validateAll(clients, workers, tasks)
        .then(validationErrors => {
          setErrors(validationErrors);
          setLoading(false);
        })
        .catch(error => {
          console.error('Validation error:', error);
          setLoading(false);
        });
    }
  }, [clients, workers, tasks, setErrors, setLoading]);

  // Handle file upload
  const handleFileUpload = async (file: File, entity: 'clients' | 'workers' | 'tasks') => {
    console.log('handleFileUpload called with:', file.name, entity);
    const upload: any = {
      file,
      entity,
      status: 'uploading' as const,
    };
    
    addUpload(upload);
    setProcessing(true);
    setUploadMessage(null);
    try {
      updateUpload(file.name, { status: 'processing' });
      
      const { data, mapping } = await FileService.processFile(file, entity);
      
      // Update the appropriate data store
      if (entity === 'clients') {
        setClients(data as any);
      } else if (entity === 'workers') {
        setWorkers(data as any);
      } else {
        setTasks(data as any);
      }

      updateUpload(file.name, { 
        status: 'success', 
        columnMapping: mapping 
      });
      
      setShowWelcome(false);
      setUploadMessage({ type: 'success', message: `Successfully uploaded and processed ${file.name}` });
    } catch (error) {
      updateUpload(file.name, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      setUploadMessage({ type: 'error', message: `Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}` });
      console.error('File upload error:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchQuery(query);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/natural-language-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, clients, workers, tasks }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      setSearchResults({
        entity: data.criteria.entity,
        rowIds: data.results.map((item: any) => item[`${data.criteria.entity.slice(0, -1)}ID`]),
        query
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle business rules
  const handleAddRule = (rule: BusinessRule) => {
    addRule(rule);
  };

  const handleRemoveRule = (ruleId: string) => {
    removeRule(ruleId);
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<BusinessRule>) => {
    updateRule(ruleId, updates);
  };

  // Handle validation refresh
  const handleRefreshValidation = async () => {
    setLoading(true);
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
      setErrors(data.errors || []);
    } catch (error) {
      console.error('Validation refresh error:', error);
      // Fallback to local validation
      const validationErrors = await ValidationService.validateAll(clients, workers, tasks);
      setErrors(validationErrors);
    } finally {
      setLoading(false);
    }
  };

  const totalRecords = clients.length + workers.length + tasks.length;
  const errorCount = errors.length;
  const hasData = totalRecords > 0;

  // Defensive: ensure activeTab is always valid
  const validTabs = ['clients', 'workers', 'tasks'];
  const currentTab = validTabs.includes(activeTab) ? activeTab : 'clients';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Allo-Ready AI</h1>
              <p className="text-sm text-muted-foreground">
                Smart Data Wrangling Assistant
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {hasData && (
                <div className="flex items-center gap-2">
                  <Badge variant={errorCount === 0 ? "default" : "destructive"}>
                    {errorCount === 0 ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready to Export
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errorCount} Errors
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {totalRecords} records
                  </span>
                </div>
              )}
              
              {hasData && errorCount === 0 && (
                <ExportButton />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {uploadMessage && (
          <Alert variant={uploadMessage.type === 'error' ? 'destructive' : 'default'} className="mb-4">
            {uploadMessage.message}
          </Alert>
        )}
        {showWelcome && !hasData ? (
          <WelcomeScreen onFileUpload={handleFileUpload} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Main Content */}
            <div className="xl:col-span-4 space-y-6">
              {/* Search Bar */}
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              
              {/* Data Tabs */}
              <Tabs
                value={currentTab}
                onValueChange={(value: string) => setActiveTab(value as 'clients' | 'workers' | 'tasks')}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="clients">
                    Clients ({clients.length})
                  </TabsTrigger>
                  <TabsTrigger value="workers">
                    Workers ({workers.length})
                  </TabsTrigger>
                  <TabsTrigger value="tasks">
                    Tasks ({tasks.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="clients" className="mt-6">
                  <DataGrid 
                    data={clients}
                    entity="clients"
                    searchResults={searchResults}
                  />
                </TabsContent>
                
                <TabsContent value="workers" className="mt-6">
                  <DataGrid 
                    data={workers}
                    entity="workers"
                    searchResults={searchResults}
                  />
                </TabsContent>
                
                <TabsContent value="tasks" className="mt-6">
                  <DataGrid 
                    data={tasks}
                    entity="tasks"
                    searchResults={searchResults}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-4">
              {/* File Upload */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Upload className="w-4 h-4" />
                    Upload Data
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Add more CSV or Excel files
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <FileUpload onFileUpload={handleFileUpload} compact={true} />
                </CardContent>
              </Card>

              {/* Validation Panel */}
              <ValidationPanel 
                errors={errors} 
                clients={clients}
                workers={workers}
                tasks={tasks}
                onRefreshValidation={handleRefreshValidation}
              />

              {/* Business Rules */}
              <BusinessRulesPanel 
                rules={rules}
                onAddRule={handleAddRule}
                onRemoveRule={handleRemoveRule}
                onUpdateRule={handleUpdateRule}
                clients={clients}
                workers={workers}
                tasks={tasks}
              />

              {/* Priorities */}
              <PrioritiesPanel priorities={priorities} />
            </div>
          </div>
        )}
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex items-center gap-2 bg-card p-4 rounded-lg shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing your data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Welcome Screen Component
function WelcomeScreen({ onFileUpload }: { onFileUpload: (file: File, entity: 'clients' | 'workers' | 'tasks') => void }) {
  return (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-primary">
          Stop fighting with spreadsheets
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Allo-Ready AI is your intelligent assistant for preparing operational data. 
          Simply upload your messy client, worker, and task files.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Drag and drop your CSV or Excel files. Our AI will automatically map columns and detect errors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Fix Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get instant feedback on data quality issues and use AI-powered fixes to resolve them quickly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Export Package
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Export a perfect, validated data package ready for your allocation and scheduling systems.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Ready to get started?</h2>
        <FileUpload onFileUpload={onFileUpload} />
      </div>
    </div>
  );
} 