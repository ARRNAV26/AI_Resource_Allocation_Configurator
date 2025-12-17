'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchResult } from '@/types';
import { Search, X, Users, Briefcase, FileText } from 'lucide-react';

interface SearchResultsProps {
  searchResults: SearchResult | null;
  onClear: () => void;
}

export function SearchResults({ searchResults, onClear }: SearchResultsProps) {
  if (!searchResults) return null;

  const getEntityIcon = (entity: string) => {
    switch (entity) {
      case 'clients': return <Users className="w-4 h-4" />;
      case 'workers': return <Briefcase className="w-4 h-4" />;
      case 'tasks': return <FileText className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'clients': return 'Clients';
      case 'workers': return 'Workers';
      case 'tasks': return 'Tasks';
      default: return entity;
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            {getEntityIcon(searchResults.entity)}
            Search Results
            <Badge variant="secondary" className="text-xs">
              {searchResults.rowIds.length} matches
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Query: &ldquo;{searchResults.query}&rdquo;
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="max-h-32 overflow-y-auto">
          {searchResults.rowIds.length > 0 ? (
            <div className="space-y-1">
              {searchResults.rowIds.map((id, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                >
                  <span className="font-mono">{id}</span>
                  <Badge variant="outline" className="text-xs">
                    {getEntityLabel(searchResults.entity)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No matches found for your query
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
