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
import { AIPanel } from '@/components/AIPanel';
import { SearchBar } from '@/components/SearchBar';
import { SearchResults } from '@/components/SearchResults';
import { BusinessRulesPanel } from '@/components/BusinessRulesPanel';
import { PrioritiesPanel } from '@/components/PrioritiesPanel';
import { BusinessRulesFullscreen } from '@/components/BusinessRulesFullscreen';
import { PrioritiesFullscreen } from '@/components/PrioritiesFullscreen';
import { ExportButton } from '@/components/ExportButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertCircle, Download, Sparkles, Brain, Zap, Target, Users, Settings, BarChart3, Star, AlertTriangle } from 'lucide-react';
import { BusinessRule } from '@/types';
import { useCardExpansion } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activePanel, setActivePanel] = useState<'ai' | 'validation' | 'rules' | 'priorities' | null>(null);
  const { handleClick } = useCardExpansion();

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

  // Handle sample data loading
  const handleLoadSampleData = async () => {
    setProcessing(true);
    setUploadMessage(null);

    try {
      // Load sample data from public files
      const [clientsResponse, workersResponse, tasksResponse] = await Promise.all([
        fetch('/sample-clients.csv'),
        fetch('/sample-workers.csv'),
        fetch('/sample-tasks.csv')
      ]);

      const [clientsText, workersText, tasksText] = await Promise.all([
        clientsResponse.text(),
        workersResponse.text(),
        tasksResponse.text()
      ]);

      // Convert CSV text to File objects and process
      const clientsFile = new File([clientsText], 'sample-clients.csv', { type: 'text/csv' });
      const workersFile = new File([workersText], 'sample-workers.csv', { type: 'text/csv' });
      const tasksFile = new File([tasksText], 'sample-tasks.csv', { type: 'text/csv' });

      // Process all files
      const [clientsResult, workersResult, tasksResult] = await Promise.all([
        FileService.processFile(clientsFile, 'clients'),
        FileService.processFile(workersFile, 'workers'),
        FileService.processFile(tasksFile, 'tasks')
      ]);

      // Update stores
      setClients(clientsResult.data as any);
      setWorkers(workersResult.data as any);
      setTasks(tasksResult.data as any);

      setShowWelcome(false);
      setUploadMessage({
        type: 'success',
        message: `Successfully loaded sample data: ${clientsResult.data.length} clients, ${workersResult.data.length} workers, ${tasksResult.data.length} tasks`
      });
    } catch (error) {
      setUploadMessage({
        type: 'error',
        message: `Error loading sample data: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      console.error('Sample data loading error:', error);
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

  // Handle clear search
  const handleClearSearch = () => {
    setSearchResults(null);
    setSearchQuery('');
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
      <header className="bg-card">
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
              
              <ThemeToggle />
              
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
          <WelcomeScreen onFileUpload={handleFileUpload} onLoadSampleData={handleLoadSampleData} />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* Main Content */}
              <div className="xl:col-span-4 space-y-6">
              {/* Search Bar */}
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              
              {/* Search Results */}
              <SearchResults 
                searchResults={searchResults} 
                onClear={handleClearSearch}
              />
              
              {/* Data Tabs */}
              <div className="space-y-6">
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
                    <div className="max-h-[576px] overflow-y-auto">
                      <DataGrid 
                        data={clients}
                        entity="clients"
                        searchResults={searchResults}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="workers" className="mt-6">
                    <div className="max-h-[576px] overflow-y-auto">
                      <DataGrid 
                        data={workers}
                        entity="workers"
                        searchResults={searchResults}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tasks" className="mt-6">
                    <div className="max-h-[576px] overflow-y-auto">
                      <DataGrid 
                        data={tasks}
                        entity="tasks"
                        searchResults={searchResults}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-4">
              {/* File Upload */}
              <Card 
                className="card-expandable"
                onClick={handleClick}
              >
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

              {/* AI Panel Trigger */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                onClick={() => setActivePanel('ai')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Brain className="w-4 h-4" />
                    AI Assistant
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Search, generate rules, and get AI recommendations
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Validation Panel Trigger */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                onClick={() => setActivePanel('validation')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Data Validation
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Check data quality and fix errors
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Business Rules Trigger */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                onClick={() => setActivePanel('rules')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings className="w-4 h-4" />
                    Business Rules
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure allocation rules and constraints
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Priorities Trigger */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
                onClick={() => setActivePanel('priorities')}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4" />
                    Priorities
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Set allocation priorities and weights
                  </CardDescription>
                </CardHeader>
              </Card>
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

      {/* Full-screen Panels */}
      {activePanel === 'ai' && (
        <AIPanel
          clients={clients}
          workers={workers}
          tasks={tasks}
          onClose={() => setActivePanel(null)}
          onSearchResults={(results: any) => {
            if (results.criteria?.entity) {
              setActiveTab(results.criteria.entity);
              setSearchResults({
                entity: results.criteria.entity,
                rowIds: results.results?.map((item: any) => item[`${results.criteria.entity.slice(0, -1)}ID`]) || [],
                query: results.query || ''
              });
            }
          }}
        />
      )}

      {activePanel === 'validation' && (
        <ValidationPanel
          errors={errors}
          clients={clients}
          workers={workers}
          tasks={tasks}
          onRefreshValidation={handleRefreshValidation}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'rules' && (
        <BusinessRulesFullscreen
          rules={rules}
          onAddRule={handleAddRule}
          onRemoveRule={handleRemoveRule}
          onUpdateRule={handleUpdateRule}
          clients={clients}
          workers={workers}
          tasks={tasks}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'priorities' && (
        <PrioritiesFullscreen
          priorities={priorities}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  );
}

// Welcome Screen Component
function WelcomeScreen({
  onFileUpload,
  onLoadSampleData
}: {
  onFileUpload: (file: File, entity: 'clients' | 'workers' | 'tasks') => void;
  onLoadSampleData: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { handleClick } = useCardExpansion();

  const steps = [
    {
      icon: Upload,
      title: "Upload Your Data",
      description: "Simply drag and drop your CSV or Excel files. Our AI will automatically understand and map your columns.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20"
    },
    {
      icon: Brain,
      title: "AI Magic Happens",
      description: "Intelligent algorithms analyze your data, detect errors, and suggest improvements automatically.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20"
    },
    {
      icon: Zap,
      title: "Fix & Configure",
      description: "Review AI suggestions, set your business rules, and adjust priorities with our intuitive interface.",
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20"
    },
    {
      icon: Download,
      title: "Export & Deploy",
      description: "Download a perfect, validated data package ready for your allocation and scheduling systems.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20"
    }
  ];

  const handleStepClick = (stepIndex: number) => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(stepIndex);
      setIsAnimating(false);
    }, 150);
  };

  const currentStepData = steps[currentStep];
  const CurrentIcon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-gradient-to-br from-secondary/10 to-accent/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Allo-Ready AI
                </h1>
              </div>
              <p className="text-muted-foreground">
                Your Intelligent Data Wrangling Assistant
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="relative container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
              Transform Messy Data
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-primary">
              Into Perfect Allocations
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stop wrestling with spreadsheets. Let AI do the heavy lifting.
              Upload your data, watch the magic happen, and export a production-ready package.
            </p>
          </div>

          {/* Key Features */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border shadow-sm">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border shadow-sm">
              <Zap className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">Lightning Fast</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border shadow-sm">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Production Ready</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border shadow-sm">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">User Friendly</span>
            </div>
          </div>
        </div>

        {/* Interactive Steps */}
        <div className="max-w-6xl mx-auto">
          {/* Step Navigation */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4 p-2 bg-card rounded-2xl border shadow-lg">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleStepClick(index)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 ${
                      currentStep === index
                        ? 'bg-primary text-primary-foreground shadow-md scale-105'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <StepIcon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                    <span className="text-xs bg-muted rounded-full w-5 h-5 flex items-center justify-center sm:hidden">
                      {index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className={`transition-all duration-500 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <Card className="max-w-4xl mx-auto border-2 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  {/* Animated Icon */}
                  <div className={`inline-flex p-6 rounded-2xl bg-gradient-to-r ${currentStepData.color} shadow-lg`}>
                    <CurrentIcon className="w-12 h-12 text-white animate-pulse" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-3xl font-bold">{currentStepData.title}</h3>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      {currentStepData.description}
                    </p>
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex justify-center gap-2 mt-8">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentStep
                            ? 'bg-primary scale-125'
                            : index < currentStep
                            ? 'bg-primary/60'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold">Ready to Experience the Magic?</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upload your first file and watch as AI transforms your data into allocation-ready perfection.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border shadow-lg">
              <FileUpload onFileUpload={onFileUpload} />
            </div>

            {/* Sample Data Button */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="text-center">
                <Button
                  onClick={onLoadSampleData}
                  variant="secondary"
                  size="lg"
                  className="bg-gradient-to-r from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border-primary/20 text-primary font-medium shadow-lg"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try with Sample Data
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Load our sample dataset to see the magic in action
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
