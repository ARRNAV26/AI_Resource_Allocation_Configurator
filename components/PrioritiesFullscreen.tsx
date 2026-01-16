'use client';

import { PriorityWeights } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Target,
  Users,
  DollarSign,
  CheckCircle,
  ArrowLeft,
  X,
  TrendingUp,
  Heart,
  Coins,
  BarChart3
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface PrioritiesFullscreenProps {
  priorities: PriorityWeights;
  onClose: () => void;
}

export function PrioritiesFullscreen({ priorities, onClose }: PrioritiesFullscreenProps) {
  const { updatePriority, setPriorities } = useAppStore();

  const handlePriorityChange = (key: keyof PriorityWeights, value: number) => {
    updatePriority(key, value);
  };

  const handlePreset = (presetName: string) => {
    switch (presetName) {
      case 'growth':
        setPriorities({
          clientPriorityFulfillment: 80,
          workerWorkLifeBalance: 30,
          costEfficiency: 40,
        });
        break;
      case 'teamHealth':
        setPriorities({
          clientPriorityFulfillment: 40,
          workerWorkLifeBalance: 80,
          costEfficiency: 30,
        });
        break;
      case 'costOptimization':
        setPriorities({
          clientPriorityFulfillment: 30,
          workerWorkLifeBalance: 40,
          costEfficiency: 80,
        });
        break;
      case 'balanced':
        setPriorities({
          clientPriorityFulfillment: 50,
          workerWorkLifeBalance: 50,
          costEfficiency: 50,
        });
        break;
      default:
        break;
    }
  };

  const priorityOptions = [
    {
      key: 'clientPriorityFulfillment' as keyof PriorityWeights,
      label: 'Client Priority Fulfillment',
      shortLabel: 'Client Priority',
      icon: Target,
      description: 'Prioritize high-priority clients and ensure their needs are met first',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      impact: 'Higher values ensure VIP clients get preferred scheduling',
      tradeoffs: 'May reduce overall team utilization and increase costs'
    },
    {
      key: 'workerWorkLifeBalance' as keyof PriorityWeights,
      label: 'Worker Work-Life Balance',
      shortLabel: 'Work-Life Balance',
      icon: Users,
      description: 'Ensure fair workload distribution and prevent worker burnout',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      impact: 'Creates sustainable workloads and improves team satisfaction',
      tradeoffs: 'May limit peak productivity and project timelines'
    },
    {
      key: 'costEfficiency' as keyof PriorityWeights,
      label: 'Cost Efficiency',
      shortLabel: 'Cost Efficiency',
      icon: DollarSign,
      description: 'Minimize operational costs and maximize resource utilization',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      impact: 'Reduces expenses and improves profit margins',
      tradeoffs: 'May compromise service quality and team satisfaction'
    }
  ];

  const presets = [
    {
      name: 'Growth Mode',
      icon: TrendingUp,
      description: 'Maximize client satisfaction and revenue growth',
      values: { clientPriorityFulfillment: 80, workerWorkLifeBalance: 30, costEfficiency: 40 },
      color: 'from-blue-500 to-cyan-500',
      recommended: 'Best for sales-driven organizations'
    },
    {
      name: 'Team Health',
      icon: Heart,
      description: 'Prioritize employee well-being and retention',
      values: { clientPriorityFulfillment: 40, workerWorkLifeBalance: 80, costEfficiency: 30 },
      color: 'from-green-500 to-emerald-500',
      recommended: 'Ideal for employee-centric cultures'
    },
    {
      name: 'Cost Optimization',
      icon: Coins,
      description: 'Minimize expenses while maintaining service levels',
      values: { clientPriorityFulfillment: 30, workerWorkLifeBalance: 40, costEfficiency: 80 },
      color: 'from-orange-500 to-red-500',
      recommended: 'Perfect for budget-conscious operations'
    },
    {
      name: 'Balanced Approach',
      icon: BarChart3,
      description: 'Harmonious balance across all priorities',
      values: { clientPriorityFulfillment: 50, workerWorkLifeBalance: 50, costEfficiency: 50 },
      color: 'from-purple-500 to-pink-500',
      recommended: 'Great for most organizations'
    }
  ];

  const totalWeight = priorities.clientPriorityFulfillment + priorities.workerWorkLifeBalance + priorities.costEfficiency;

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Allocation Priorities</h2>
                <p className="text-sm text-muted-foreground">Optimization Engine</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-6">
          {/* Current Weights Overview */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">Current Configuration</div>

            <div className="space-y-3">
              {priorityOptions.map((option) => {
                const Icon = option.icon;
                const value = priorities[option.key];
                const percentage = Math.round((value / totalWeight) * 100);

                return (
                  <div key={option.key} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{option.shortLabel}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{value}%</div>
                        <div className="text-xs text-muted-foreground">({percentage}%)</div>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${option.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weight Distribution */}
            <div className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-2">Weight Distribution</div>
              <div className="flex h-4 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500"
                  style={{ width: `${(priorities.clientPriorityFulfillment / totalWeight) * 100}%` }}
                ></div>
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500"
                  style={{ width: `${(priorities.workerWorkLifeBalance / totalWeight) * 100}%` }}
                ></div>
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-500"
                  style={{ width: `${(priorities.costEfficiency / totalWeight) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Client</span>
                <span>Team</span>
                <span>Cost</span>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Quick Presets</div>
            <div className="space-y-2">
              {presets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handlePreset(preset.name.toLowerCase().replace(' ', ''))}
                    className="w-full p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-r ${preset.color} rounded-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Insights */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="text-sm font-medium mb-2">Priority Insights</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Configuration validated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Total weight: {totalWeight}%</span>
              </div>
              {totalWeight !== 150 && (
                <div className="flex items-center gap-2">
                  <Alert className="w-3 h-3 text-orange-500" />
                  <span className="text-orange-600">
                    Total weight is {totalWeight}%, consider adjusting for optimal balance
                  </span>
                </div>
              )}
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
              <h1 className="text-2xl font-bold">Priority Configuration</h1>
              <p className="text-muted-foreground">
                Fine-tune allocation priorities to match your organizational goals
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Priority Sliders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Fine-tune Priorities
                </CardTitle>
                <CardDescription>
                  Adjust the weight of each priority factor. Higher values give more importance to that factor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {priorityOptions.map((option) => {
                  const Icon = option.icon;
                  const value = priorities[option.key];

                  return (
                    <div key={option.key} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 bg-gradient-to-r ${option.color} rounded-xl`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{option.label}</h3>
                            <p className="text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{value}%</div>
                          <div className="text-sm text-muted-foreground">
                            Weight: {Math.round((value / totalWeight) * 100)}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => handlePriorityChange(option.key, parseInt(e.target.value))}
                          className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer slider accent-primary"
                          style={{
                            background: `linear-gradient(to right, hsl(var(--muted)) 0%, hsl(var(--muted)) ${value}%, hsl(var(--primary)) ${value}%, hsl(var(--primary)) 100%)`
                          }}
                        />

                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>0% - No priority</span>
                          <span className="font-medium">Current: {value}%</span>
                          <span>100% - Maximum priority</span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg ${option.bgColor}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm mb-1">Impact</h4>
                            <p className="text-sm text-muted-foreground">{option.impact}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm mb-1">Trade-offs</h4>
                            <p className="text-sm text-muted-foreground">{option.tradeoffs}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Preset Profiles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Preset Profiles
                </CardTitle>
                <CardDescription>
                  Choose from pre-configured priority profiles based on common organizational goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {presets.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <Card
                        key={preset.name}
                        className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50"
                        onClick={() => handlePreset(preset.name.toLowerCase().replace(/\s+/g, ''))}
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-3 bg-gradient-to-r ${preset.color} rounded-xl`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{preset.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {preset.recommended}
                                </Badge>
                              </div>
                            </div>

                            <p className="text-muted-foreground">{preset.description}</p>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Client Priority:</span>
                                <span className="font-medium">{preset.values.clientPriorityFulfillment}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Work-Life Balance:</span>
                                <span className="font-medium">{preset.values.workerWorkLifeBalance}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Cost Efficiency:</span>
                                <span className="font-medium">{preset.values.costEfficiency}%</span>
                              </div>
                            </div>

                            <Button className="w-full" variant="outline">
                              Apply {preset.name}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Summary</CardTitle>
                <CardDescription>
                  Review your current priority settings and their implications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {priorities.clientPriorityFulfillment}%
                    </div>
                    <div className="text-sm text-muted-foreground">Client Focus</div>
                    <div className="text-xs mt-1">
                      {priorities.clientPriorityFulfillment > 60 ? 'High' : priorities.clientPriorityFulfillment > 40 ? 'Medium' : 'Low'} priority on client satisfaction
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {priorities.workerWorkLifeBalance}%
                    </div>
                    <div className="text-sm text-muted-foreground">Team Health</div>
                    <div className="text-xs mt-1">
                      {priorities.workerWorkLifeBalance > 60 ? 'High' : priorities.workerWorkLifeBalance > 40 ? 'Medium' : 'Low'} focus on work-life balance
                    </div>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <DollarSign className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">
                      {priorities.costEfficiency}%
                    </div>
                    <div className="text-sm text-muted-foreground">Cost Control</div>
                    <div className="text-xs mt-1">
                      {priorities.costEfficiency > 60 ? 'High' : priorities.costEfficiency > 40 ? 'Medium' : 'Low'} emphasis on cost optimization
                    </div>
                  </div>
                </div>

                <Alert className="mt-6">
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    Your priority configuration has been saved and will be applied to all future allocation calculations.
                    You can adjust these settings at any time to adapt to changing business needs.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
