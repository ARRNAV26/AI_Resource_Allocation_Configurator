'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Users,
  Briefcase,
  FileText,
  Settings,
  Zap,
  ArrowLeft,
  X
} from 'lucide-react';
import { BusinessRule } from '@/types';

interface BusinessRulesFullscreenProps {
  rules: BusinessRule[];
  onAddRule: (rule: BusinessRule) => void;
  onRemoveRule: (ruleId: string) => void;
  onUpdateRule: (ruleId: string, updates: Partial<BusinessRule>) => void;
  clients: any[];
  workers: any[];
  tasks: any[];
  onClose: () => void;
}

export function BusinessRulesFullscreen({
  rules,
  onAddRule,
  onRemoveRule,
  onUpdateRule,
  clients,
  workers,
  tasks,
  onClose
}: BusinessRulesFullscreenProps) {
  const [activeTab, setActiveTab] = useState('rules');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for different rule types
  const [coRunForm, setCoRunForm] = useState({
    name: '',
    description: '',
    tasks: [] as string[],
    required: true
  });

  const [slotRestrictionForm, setSlotRestrictionForm] = useState({
    name: '',
    description: '',
    groupType: 'client' as 'client' | 'worker',
    groupName: '',
    minSlots: 2
  });

  const [loadLimitForm, setLoadLimitForm] = useState({
    name: '',
    description: '',
    workerGroup: '',
    maxSlotsPerPhase: 5
  });

  const [phaseWindowForm, setPhaseWindowForm] = useState({
    name: '',
    description: '',
    taskId: '',
    allowedPhases: [] as number[]
  });

  const [naturalLanguageForm, setNaturalLanguageForm] = useState({
    description: ''
  });

  const handleAddCoRunRule = () => {
    if (!coRunForm.name || coRunForm.tasks.length < 2) {
      setSubmitMessage({ type: 'error', message: 'Please provide a name and select at least 2 tasks' });
      return;
    }

    const newRule: BusinessRule = {
      id: `rule_${Date.now()}`,
      type: 'coRun',
      name: coRunForm.name,
      description: coRunForm.description,
      parameters: {
        tasks: coRunForm.tasks,
        required: coRunForm.required
      },
      priority: rules.length + 1,
      enabled: true
    };

    onAddRule(newRule);
    setCoRunForm({ name: '', description: '', tasks: [], required: true });
    setSubmitMessage({ type: 'success', message: 'Co-run rule added successfully!' });
  };

  const handleAddSlotRestrictionRule = () => {
    if (!slotRestrictionForm.name || !slotRestrictionForm.groupName) {
      setSubmitMessage({ type: 'error', message: 'Please provide a name and group name' });
      return;
    }

    const newRule: BusinessRule = {
      id: `rule_${Date.now()}`,
      type: 'slotRestriction',
      name: slotRestrictionForm.name,
      description: slotRestrictionForm.description,
      parameters: {
        groupType: slotRestrictionForm.groupType,
        groupName: slotRestrictionForm.groupName,
        minSlots: slotRestrictionForm.minSlots
      },
      priority: rules.length + 1,
      enabled: true
    };

    onAddRule(newRule);
    setSlotRestrictionForm({ name: '', description: '', groupType: 'client', groupName: '', minSlots: 2 });
    setSubmitMessage({ type: 'success', message: 'Slot restriction rule added successfully!' });
  };

  const handleAddLoadLimitRule = () => {
    if (!loadLimitForm.name || !loadLimitForm.workerGroup) {
      setSubmitMessage({ type: 'error', message: 'Please provide a name and worker group' });
      return;
    }

    const newRule: BusinessRule = {
      id: `rule_${Date.now()}`,
      type: 'loadLimit',
      name: loadLimitForm.name,
      description: loadLimitForm.description,
      parameters: {
        workerGroup: loadLimitForm.workerGroup,
        maxSlotsPerPhase: loadLimitForm.maxSlotsPerPhase
      },
      priority: rules.length + 1,
      enabled: true
    };

    onAddRule(newRule);
    setLoadLimitForm({ name: '', description: '', workerGroup: '', maxSlotsPerPhase: 5 });
    setSubmitMessage({ type: 'success', message: 'Load limit rule added successfully!' });
  };

  const handleAddPhaseWindowRule = () => {
    if (!phaseWindowForm.name || !phaseWindowForm.taskId || phaseWindowForm.allowedPhases.length === 0) {
      setSubmitMessage({ type: 'error', message: 'Please provide a name, task ID, and allowed phases' });
      return;
    }

    const newRule: BusinessRule = {
      id: `rule_${Date.now()}`,
      type: 'phaseWindow',
      name: phaseWindowForm.name,
      description: phaseWindowForm.description,
      parameters: {
        taskId: phaseWindowForm.taskId,
        allowedPhases: phaseWindowForm.allowedPhases
      },
      priority: rules.length + 1,
      enabled: true
    };

    onAddRule(newRule);
    setPhaseWindowForm({ name: '', description: '', taskId: '', allowedPhases: [] });
    setSubmitMessage({ type: 'success', message: 'Phase window rule added successfully!' });
  };

  const handleNaturalLanguageRule = async () => {
    if (!naturalLanguageForm.description) {
      setSubmitMessage({ type: 'error', message: 'Please provide a rule description' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/rules/generate-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: naturalLanguageForm.description,
          clients,
          workers,
          tasks,
          existingRules: rules
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setSubmitMessage({ type: 'error', message: `Rule generation failed: ${response.statusText} - ${errorText}` });
        throw new Error(`Rule generation failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (data.rule) {
        onAddRule(data.rule);
        setNaturalLanguageForm({ description: '' });
        setSubmitMessage({ type: 'success', message: 'Rule generated and added successfully!' });
      } else {
        setSubmitMessage({ type: 'error', message: data.error || 'Failed to generate rule' });
        console.error('Rule generation error:', data.error);
      }
    } catch (error) {
      console.error('Rule generation error:', error);
      setSubmitMessage({ type: 'error', message: 'Failed to generate rule. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'coRun': return <Users className="w-3 h-3" />;
      case 'slotRestriction': return <Settings className="w-3 h-3" />;
      case 'loadLimit': return <Briefcase className="w-3 h-3" />;
      case 'phaseWindow': return <FileText className="w-3 h-3" />;
      default: return <Settings className="w-3 h-3" />;
    }
  };

  const getRuleTypeLabel = (type: string) => {
    switch (type) {
      case 'coRun': return 'Co-Run';
      case 'slotRestriction': return 'Slot Restriction';
      case 'loadLimit': return 'Load Limit';
      case 'phaseWindow': return 'Phase Window';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Business Rules</h2>
                <p className="text-sm text-muted-foreground">Allocation Logic Engine</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Rule Categories */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Rule Types</div>

            <button
              onClick={() => setActiveTab('corun')}
              className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                activeTab === 'corun'
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-500 rounded">
                  <Users className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">Co-Run Rules</div>
                  <div className="text-xs opacity-80">Tasks that run together</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('slot')}
              className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                activeTab === 'slot'
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-green-500 rounded">
                  <Settings className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">Slot Restrictions</div>
                  <div className="text-xs opacity-80">Group allocation limits</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('load')}
              className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                activeTab === 'load'
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-orange-500 rounded">
                  <Briefcase className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">Load Limits</div>
                  <div className="text-xs opacity-80">Worker capacity constraints</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('phase')}
              className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                activeTab === 'phase'
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-purple-500 rounded">
                  <FileText className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">Phase Windows</div>
                  <div className="text-xs opacity-80">Task timing constraints</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`w-full p-3 rounded-lg border text-left transition-all duration-200 ${
                activeTab === 'ai'
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-pink-500 rounded">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <div>
                  <div className="font-medium text-sm">AI Generation</div>
                  <div className="text-xs opacity-80">Natural language rules</div>
                </div>
              </div>
            </button>
          </div>

          {/* Rules Summary */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="text-sm font-medium mb-2">Active Rules</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Total Rules:</span>
                <span className="font-medium">{rules.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Co-Run:</span>
                <span>{rules.filter(r => r.type === 'coRun').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Slot Restrictions:</span>
                <span>{rules.filter(r => r.type === 'slotRestriction').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Load Limits:</span>
                <span>{rules.filter(r => r.type === 'loadLimit').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Phase Windows:</span>
                <span>{rules.filter(r => r.type === 'phaseWindow').length}</span>
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
              <h1 className="text-2xl font-bold">Business Rules Configuration</h1>
              <p className="text-muted-foreground">
                Define allocation rules and constraints for optimal resource distribution
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {submitMessage && (
            <Alert variant={submitMessage.type === 'error' ? 'destructive' : 'default'} className="mb-6">
              {submitMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <AlertDescription>{submitMessage.message}</AlertDescription>
            </Alert>
          )}

          {/* Existing Rules Overview */}
          {rules.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Current Rules ({rules.length})</CardTitle>
                <CardDescription>Manage your existing business rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getRuleTypeIcon(rule.type)}
                          <div>
                            <div className="font-medium text-sm">{rule.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {getRuleTypeLabel(rule.type)}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveRule(rule.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="corun" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Co-Run Rules
                  </CardTitle>
                  <CardDescription>
                    Define tasks that must be executed together by the same worker
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rule Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Data Processing Suite"
                        value={coRunForm.name}
                        onChange={(e) => setCoRunForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <input
                        type="text"
                        placeholder="Brief description of this rule"
                        value={coRunForm.description}
                        onChange={(e) => setCoRunForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tasks (Select multiple)</label>
                    <select
                      multiple
                      value={coRunForm.tasks}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setCoRunForm(prev => ({ ...prev, tasks: selected }));
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {tasks.map(task => (
                        <option key={task.TaskID} value={task.TaskID}>
                          {task.TaskName} ({task.TaskID})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Hold Ctrl/Cmd to select multiple tasks
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="required"
                      checked={coRunForm.required}
                      onChange={(e) => setCoRunForm(prev => ({ ...prev, required: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="required" className="text-sm">Required (must run together)</label>
                  </div>

                  <Button onClick={handleAddCoRunRule} className="w-full">
                    Add Co-Run Rule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="slot" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-green-500" />
                    Slot Restriction Rules
                  </CardTitle>
                  <CardDescription>
                    Set minimum common slot requirements for client or worker groups
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rule Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Enterprise Client Priority"
                        value={slotRestrictionForm.name}
                        onChange={(e) => setSlotRestrictionForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <input
                        type="text"
                        placeholder="Brief description of this rule"
                        value={slotRestrictionForm.description}
                        onChange={(e) => setSlotRestrictionForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Group Type</label>
                      <select
                        value={slotRestrictionForm.groupType}
                        onChange={(e) => setSlotRestrictionForm(prev => ({ ...prev, groupType: e.target.value as 'client' | 'worker' }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="client">Client Group</option>
                        <option value="worker">Worker Group</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Group Name</label>
                      <select
                        value={slotRestrictionForm.groupName}
                        onChange={(e) => setSlotRestrictionForm(prev => ({ ...prev, groupName: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Select group...</option>
                        {(slotRestrictionForm.groupType === 'client' ? [...new Set(clients.map(c => c.GroupTag).filter(Boolean))] : [...new Set(workers.map(w => w.WorkerGroup))]).map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Minimum Common Slots</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={slotRestrictionForm.minSlots}
                      onChange={(e) => setSlotRestrictionForm(prev => ({ ...prev, minSlots: parseInt(e.target.value) || 2 }))}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum number of common time slots required
                    </p>
                  </div>

                  <Button onClick={handleAddSlotRestrictionRule} className="w-full">
                    Add Slot Restriction Rule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="load" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-orange-500" />
                    Load Limit Rules
                  </CardTitle>
                  <CardDescription>
                    Set maximum workload limits for worker groups per phase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rule Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Senior Developer Load Limit"
                        value={loadLimitForm.name}
                        onChange={(e) => setLoadLimitForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <input
                        type="text"
                        placeholder="Brief description of this rule"
                        value={loadLimitForm.description}
                        onChange={(e) => setLoadLimitForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Worker Group</label>
                      <select
                        value={loadLimitForm.workerGroup}
                        onChange={(e) => setLoadLimitForm(prev => ({ ...prev, workerGroup: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Select worker group...</option>
                        {[...new Set(workers.map(w => w.WorkerGroup))].map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Slots Per Phase</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={loadLimitForm.maxSlotsPerPhase}
                        onChange={(e) => setLoadLimitForm(prev => ({ ...prev, maxSlotsPerPhase: parseInt(e.target.value) || 5 }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                  </div>

                  <Button onClick={handleAddLoadLimitRule} className="w-full">
                    Add Load Limit Rule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="phase" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Phase Window Rules
                  </CardTitle>
                  <CardDescription>
                    Define which phases a task can be scheduled in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rule Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Data Tasks - Early Phases"
                        value={phaseWindowForm.name}
                        onChange={(e) => setPhaseWindowForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <input
                        type="text"
                        placeholder="Brief description of this rule"
                        value={phaseWindowForm.description}
                        onChange={(e) => setPhaseWindowForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Task</label>
                    <select
                      value={phaseWindowForm.taskId}
                      onChange={(e) => setPhaseWindowForm(prev => ({ ...prev, taskId: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="">Select task...</option>
                      {tasks.map(task => (
                        <option key={task.TaskID} value={task.TaskID}>
                          {task.TaskName} ({task.TaskID})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Allowed Phases</label>
                    <input
                      type="text"
                      placeholder="e.g., 1,2,3 or 1-3"
                      value={phaseWindowForm.allowedPhases.join(',')}
                      onChange={(e) => {
                        const phases = e.target.value.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
                        setPhaseWindowForm(prev => ({ ...prev, allowedPhases: phases }));
                      }}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter phase numbers separated by commas, or use ranges (e.g., 1-3)
                    </p>
                  </div>

                  <Button onClick={handleAddPhaseWindowRule} className="w-full">
                    Add Phase Window Rule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-pink-500" />
                    AI-Powered Rule Generation
                  </CardTitle>
                  <CardDescription>
                    Describe your business rule in natural language and let AI create it for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rule Description</label>
                    <textarea
                      placeholder="Describe your business rule in plain English...&#10;&#10;Examples:&#10;• Tasks T1 and T2 should always run together&#10;• Workers in the Senior group should not exceed 3 tasks per phase&#10;• Only allow Python tasks in the first phase"
                      value={naturalLanguageForm.description}
                      onChange={(e) => setNaturalLanguageForm({ description: e.target.value })}
                      className="w-full h-32 p-3 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleNaturalLanguageRule}
                    disabled={isSubmitting || !naturalLanguageForm.description.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Generating Rule...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Business Rule
                      </>
                    )}
                  </Button>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">💡 Tips for Better Results</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Be specific about what the rule should do</li>
                      <li>• Mention specific tasks, workers, or groups by name</li>
                      <li>• Include numbers for limits or constraints</li>
                      <li>• Use clear business language</li>
                    </ul>
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
