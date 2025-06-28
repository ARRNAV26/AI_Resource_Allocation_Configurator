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
  Zap
} from 'lucide-react';
import { BusinessRule } from '@/types';

interface BusinessRulesPanelProps {
  rules: BusinessRule[];
  onAddRule: (rule: BusinessRule) => void;
  onRemoveRule: (ruleId: string) => void;
  onUpdateRule: (ruleId: string, updates: Partial<BusinessRule>) => void;
  clients: any[];
  workers: any[];
  tasks: any[];
}

export function BusinessRulesPanel({ 
  rules, 
  onAddRule, 
  onRemoveRule, 
  onUpdateRule,
  clients,
  workers,
  tasks
}: BusinessRulesPanelProps) {
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
        throw new Error(`Rule generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.rule) {
        onAddRule(data.rule);
        setNaturalLanguageForm({ description: '' });
        setSubmitMessage({ type: 'success', message: 'Rule generated and added successfully!' });
      } else {
        setSubmitMessage({ type: 'error', message: data.error || 'Failed to generate rule' });
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings className="w-4 h-4" />
          Business Rules
        </CardTitle>
        <CardDescription className="text-xs">
          {rules.length} rules configured
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="rules" className="text-xs">Rules</TabsTrigger>
            <TabsTrigger value="create" className="text-xs">Create</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rules" className="mt-3">
            {rules.length === 0 ? (
              <div className="text-center text-muted-foreground py-4 text-xs">
                No rules configured
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-2 rounded border text-xs ${
                      rule.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {getRuleTypeIcon(rule.type)}
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {getRuleTypeLabel(rule.type)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveRule(rule.id)}
                        className="h-4 w-4 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {rule.description && (
                      <p className="text-muted-foreground mt-1 leading-tight">
                        {rule.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="create" className="mt-3 space-y-3">
            {submitMessage && (
              <Alert variant={submitMessage.type === 'error' ? 'destructive' : 'default'} className="py-2">
                <AlertCircle className="w-3 h-3" />
                <AlertDescription className="text-xs">{submitMessage.message}</AlertDescription>
              </Alert>
            )}
            
            {/* Natural Language Rule Creation */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Natural Language Rule</label>
              <textarea
                value={naturalLanguageForm.description}
                onChange={(e) => setNaturalLanguageForm({ description: e.target.value })}
                placeholder="Describe your rule in plain English..."
                className="w-full p-2 text-xs border rounded resize-none"
                rows={3}
              />
              <Button
                onClick={handleNaturalLanguageRule}
                disabled={isSubmitting || !naturalLanguageForm.description}
                size="sm"
                className="w-full h-6 text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 mr-1" />
                    Generate Rule
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 