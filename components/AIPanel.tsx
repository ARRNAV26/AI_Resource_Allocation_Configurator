'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Sparkles,
  Search,
  Lightbulb,
  Wand2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  X
} from 'lucide-react';

interface AIPanelProps {
  clients: any[];
  workers: any[];
  tasks: any[];
  onClose: () => void;
  onSearchResults: (results: any) => void;
}

export function AIPanel({ clients, workers, tasks, onClose, onSearchResults }: AIPanelProps) {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const [ruleDescription, setRuleDescription] = useState('');
  const [isGeneratingRule, setIsGeneratingRule] = useState(false);
  const [generatedRule, setGeneratedRule] = useState<any>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setAlert(null);

    try {
      const response = await fetch('/api/ai/natural-language-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, clients, workers, tasks }),
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data);
      onSearchResults(data);
      setAlert({ type: 'success', message: `Found ${data.results?.length || 0} results` });
    } catch (error) {
      setAlert({ type: 'error', message: 'Search failed. Please try again.' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateRule = async () => {
    if (!ruleDescription.trim()) return;

    setIsGeneratingRule(true);
    setAlert(null);

    try {
      const response = await fetch('/api/rules/generate-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: ruleDescription,
          clients,
          workers,
          tasks,
          existingRules: []
        }),
      });

      if (!response.ok) throw new Error('Rule generation failed');

      const data = await response.json();
      if (data.rule) {
        setGeneratedRule(data.rule);
        setAlert({ type: 'success', message: 'Rule generated successfully!' });
      } else {
        setAlert({ type: 'error', message: 'Could not generate rule from description' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Rule generation failed. Please try again.' });
    } finally {
      setIsGeneratingRule(false);
    }
  };

  const aiFeatures = [
    {
      icon: Search,
      title: 'Natural Language Search',
      description: 'Search your data using plain English queries',
      tab: 'search',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Wand2,
      title: 'Rule Generation',
      description: 'Convert natural language descriptions into business rules',
      tab: 'rules',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Lightbulb,
      title: 'Smart Suggestions',
      description: 'Get AI-powered recommendations for your data',
      tab: 'suggestions',
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">AI Assistant</h2>
                <p className="text-sm text-muted-foreground">Intelligent Data Processing</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-3">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.tab}
                onClick={() => setActiveTab(feature.tab)}
                className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                  activeTab === feature.tab
                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                    : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gradient-to-r ${feature.color} rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">{feature.title}</h3>
                    <p className="text-xs opacity-80">{feature.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t">
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
              <h1 className="text-2xl font-bold">AI-Powered Features</h1>
              <p className="text-muted-foreground">Leverage artificial intelligence for smarter data processing</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {alert && (
            <Alert variant={alert.type === 'error' ? 'destructive' : 'default'} className="mb-6">
              {alert.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Natural Language Search
                  </CardTitle>
                  <CardDescription>
                    Ask questions about your data in plain English. Try queries like:
                    "Show me all high-priority clients" or "Find tasks requiring Python skills"
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter your search query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {searchResults && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Search Results</h3>
                        <Badge variant="secondary">
                          {searchResults.results?.length || 0} matches found
                        </Badge>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(searchResults, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Example Queries:</p>
                      <div className="space-y-1 text-xs">
                        <button
                          onClick={() => setSearchQuery("Show me all high-priority clients")}
                          className="block text-left text-primary hover:underline"
                        >
                          • Show me all high-priority clients
                        </button>
                        <button
                          onClick={() => setSearchQuery("Find tasks requiring Python")}
                          className="block text-left text-primary hover:underline"
                        >
                          • Find tasks requiring Python
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-muted-foreground">Tips:</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p>• Be specific about what you're looking for</p>
                        <p>• Mention data types (clients, workers, tasks)</p>
                        <p>• Use natural language descriptions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rules" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Natural Language Rule Generation
                  </CardTitle>
                  <CardDescription>
                    Describe your business rule in plain English and let AI create it for you.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    placeholder="Describe your business rule...&#10;&#10;Examples:&#10;• Tasks T1 and T2 should always run together&#10;• Workers in the Senior group should not exceed 3 tasks per phase&#10;• Only allow Python tasks in the first phase"
                    value={ruleDescription}
                    onChange={(e) => setRuleDescription(e.target.value)}
                    className="w-full h-32 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />

                  <Button
                    onClick={handleGenerateRule}
                    disabled={isGeneratingRule || !ruleDescription.trim()}
                    className="w-full"
                  >
                    {isGeneratingRule ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating Rule...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Business Rule
                      </>
                    )}
                  </Button>

                  {generatedRule && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Generated Rule</h3>
                        <Badge variant="secondary">Ready to Add</Badge>
                      </div>

                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{generatedRule.name}</h4>
                              <Badge>{generatedRule.type}</Badge>
                            </div>
                            {generatedRule.description && (
                              <p className="text-sm text-muted-foreground">{generatedRule.description}</p>
                            )}
                            <div className="text-xs bg-muted p-2 rounded">
                              <pre>{JSON.stringify(generatedRule.parameters, null, 2)}</pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    AI Suggestions
                  </CardTitle>
                  <CardDescription>
                    Get intelligent recommendations based on patterns in your data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>AI suggestions will appear here based on your data patterns.</p>
                    <p className="text-sm mt-2">Upload some data first to see intelligent recommendations.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
