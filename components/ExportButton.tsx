'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { FileService } from '@/lib/fileService';
import { Button } from '@/components/ui/button';
import { Download, Package, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ExportButton() {
  const { clients, workers, tasks, rules, priorities } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      // Create the export package
      const packageBlob = await FileService.createExportPackage(
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
      link.download = `Allo-Ready-Package-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const totalRecords = clients.length + workers.length + tasks.length;

  return (
    <Button 
      onClick={handleExport} 
      disabled={isExporting || totalRecords === 0}
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Package className="w-4 h-4" />
      )}
      {isExporting ? 'Exporting...' : 'Export Package'}
      <Badge variant="secondary" className="ml-2">
        {totalRecords} records
      </Badge>
    </Button>
  );
} 