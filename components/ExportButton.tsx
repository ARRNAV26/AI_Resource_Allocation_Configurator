'use client';

import { useAppStore } from '@/lib/store';
import { FileService } from '@/lib/fileService';
import { Button } from '@/components/ui/button';
import { Download, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ExportButton() {
  const { clients, workers, tasks, rules, priorities } = useAppStore();

  const handleExport = async () => {
    try {
      // Create the export package
      const packageBlob = FileService.createExportPackage(
        clients,
        workers,
        tasks,
        rules,
        priorities
      );

      // Create download link
      const url = URL.createObjectURL(packageBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Allo-Ready-Package-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      // TODO: Show error toast
    }
  };

  const totalRecords = clients.length + workers.length + tasks.length;

  return (
    <Button onClick={handleExport} className="flex items-center gap-2">
      <Package className="w-4 h-4" />
      Export Package
      <Badge variant="secondary" className="ml-2">
        {totalRecords} records
      </Badge>
    </Button>
  );
} 