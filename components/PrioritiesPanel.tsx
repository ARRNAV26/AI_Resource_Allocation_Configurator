'use client';

import { PriorityWeights } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Users, DollarSign } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface PrioritiesPanelProps {
  priorities: PriorityWeights;
  onClose?: () => void;
  isFullscreen?: boolean;
}

export function PrioritiesPanel({ priorities, onClose, isFullscreen = false }: PrioritiesPanelProps) {
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
      default:
        break;
    }
  };

  const priorityOptions = [
    {
      key: 'clientPriorityFulfillment' as keyof PriorityWeights,
      label: 'Client Priority',
      icon: Target,
      description: 'Prioritize high-priority clients',
      color: 'bg-blue-500'
    },
    {
      key: 'workerWorkLifeBalance' as keyof PriorityWeights,
      label: 'Work-Life Balance',
      icon: Users,
      description: 'Ensure fair workload distribution',
      color: 'bg-green-500'
    },
    {
      key: 'costEfficiency' as keyof PriorityWeights,
      label: 'Cost Efficiency',
      icon: DollarSign,
      description: 'Minimize costs and maximize efficiency',
      color: 'bg-orange-500'
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4" />
          Priorities
        </CardTitle>
        <CardDescription className="text-xs">
          Set allocation priorities and weights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Priority Sliders */}
        <div className="space-y-3">
          {priorityOptions.map((option) => {
            const Icon = option.icon;
            const value = priorities[option.key];
            
            return (
              <div key={option.key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-3 h-3" />
                  <span className="text-xs font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {value}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => handlePriorityChange(option.key, parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${value}%, hsl(var(--muted)) ${value}%, hsl(var(--muted)) 100%)`
                  }}
                />
                
                <p className="text-xs text-muted-foreground leading-tight">
                  {option.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Preset Profiles */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium">Quick Presets</h4>
          <div className="space-y-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start h-7 text-xs"
              onClick={() => handlePreset('growth')}
            >
              <div className="text-left">
                <div className="font-medium">Growth Mode</div>
                <div className="text-xs text-muted-foreground">
                  Focus on client satisfaction
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start h-7 text-xs"
              onClick={() => handlePreset('teamHealth')}
            >
              <div className="text-left">
                <div className="font-medium">Team Health</div>
                <div className="text-xs text-muted-foreground">
                  Prioritize worker well-being
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start h-7 text-xs"
              onClick={() => handlePreset('costOptimization')}
            >
              <div className="text-left">
                <div className="font-medium">Cost Optimization</div>
                <div className="text-xs text-muted-foreground">
                  Focus on efficiency
                </div>
              </div>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
