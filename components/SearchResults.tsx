'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users,
  Briefcase,
  FileText,
  Eye,
  Star,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Code,
  Target
} from 'lucide-react';

interface SearchResultsProps {
  results: any[];
  entity: 'clients' | 'workers' | 'tasks';
  query: string;
}

export function SearchResults({ results, entity, query }: SearchResultsProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'clients': return <Users className="w-4 h-4" />;
      case 'workers': return <User className="w-4 h-4" />;
      case 'tasks': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getEntityColor = (entityType: string) => {
    switch (entityType) {
      case 'clients': return 'border-blue-200 bg-blue-50';
      case 'workers': return 'border-green-200 bg-green-50';
      case 'tasks': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const renderItemCard = (item: any, index: number) => {
    const id = item.ClientID || item.WorkerID || item.TaskID;
    const name = item.ClientName || item.WorkerName || item.TaskName;
    const priority = item.PriorityLevel;

    return (
      <Card
        key={index}
        className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${getEntityColor(entity)}`}
        onClick={() => handleItemClick(item)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getEntityIcon(entity)}
              <div>
                <CardTitle className="text-sm">{name}</CardTitle>
                <CardDescription className="text-xs">ID: {id}</CardDescription>
              </div>
            </div>
            {priority && (
              <Badge variant={priority >= 4 ? "default" : priority >= 3 ? "secondary" : "outline"}>
                Priority {priority}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {entity === 'clients' && item.RequestedTaskIDs && (
                <span>{item.RequestedTaskIDs.length} tasks requested</span>
              )}
              {entity === 'workers' && item.Skills && (
                <span>{item.Skills.length} skills</span>
              )}
              {entity === 'tasks' && item.RequiredSkills && (
                <span>{item.RequiredSkills.length} skills required</span>
              )}
            </div>
            <Button size="sm" variant="ghost" className="h-6 px-2">
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDetailModal = () => {
    if (!selectedItem) return null;

    const getDetailFields = () => {
      switch (entity) {
        case 'clients':
          return [
            { label: 'Client ID', value: selectedItem.ClientID, icon: <Building className="w-4 h-4" /> },
            { label: 'Client Name', value: selectedItem.ClientName, icon: <User className="w-4 h-4" /> },
            { label: 'Priority Level', value: selectedItem.PriorityLevel, icon: <Star className="w-4 h-4" /> },
            { label: 'Requested Tasks', value: selectedItem.RequestedTaskIDs?.join(', '), icon: <FileText className="w-4 h-4" /> },
            { label: 'Group Tag', value: selectedItem.GroupTag, icon: <Target className="w-4 h-4" /> },
            { label: 'Attributes', value: selectedItem.AttributesJSON, icon: <Code className="w-4 h-4" /> },
          ];
        case 'workers':
          return [
            { label: 'Worker ID', value: selectedItem.WorkerID, icon: <User className="w-4 h-4" /> },
            { label: 'Worker Name', value: selectedItem.WorkerName, icon: <User className="w-4 h-4" /> },
            { label: 'Skills', value: selectedItem.Skills?.join(', '), icon: <Code className="w-4 h-4" /> },
            { label: 'Available Slots', value: selectedItem.AvailableSlots?.join(', '), icon: <Calendar className="w-4 h-4" /> },
            { label: 'Max Load Per Phase', value: selectedItem.MaxLoadPerPhase, icon: <Briefcase className="w-4 h-4" /> },
            { label: 'Worker Group', value: selectedItem.WorkerGroup, icon: <Users className="w-4 h-4" /> },
            { label: 'Qualification Level', value: selectedItem.QualificationLevel, icon: <Star className="w-4 h-4" /> },
          ];
        case 'tasks':
          return [
            { label: 'Task ID', value: selectedItem.TaskID, icon: <FileText className="w-4 h-4" /> },
            { label: 'Task Name', value: selectedItem.TaskName, icon: <FileText className="w-4 h-4" /> },
            { label: 'Category', value: selectedItem.Category, icon: <Target className="w-4 h-4" /> },
            { label: 'Duration', value: selectedItem.Duration, icon: <Calendar className="w-4 h-4" /> },
            { label: 'Required Skills', value: selectedItem.RequiredSkills?.join(', '), icon: <Code className="w-4 h-4" /> },
            { label: 'Max Concurrent', value: selectedItem.MaxConcurrent, icon: <Users className="w-4 h-4" /> },
          ];
        default:
          return [];
      }
    };

    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getEntityIcon(entity)}
              {selectedItem.ClientName || selectedItem.WorkerName || selectedItem.TaskName}
              <Badge variant="outline" className="ml-2">
                {entity.slice(0, -1).toUpperCase()}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this {entity.slice(0, -1)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {getDetailFields().map((field, index) => (
              field.value && (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="text-muted-foreground mt-0.5">
                    {field.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-muted-foreground">
                      {field.label}
                    </div>
                    <div className="text-sm break-words">
                      {field.value}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No results found for "{query}"</p>
        <p className="text-sm mt-2">Try adjusting your search query</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          {getEntityIcon(entity)}
          Search Results for "{query}"
        </h3>
        <Badge variant="secondary">
          {results.length} {entity} found
        </Badge>
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {results.map((item, index) => renderItemCard(item, index))}
      </div>

      {renderDetailModal()}
    </div>
  );
}
