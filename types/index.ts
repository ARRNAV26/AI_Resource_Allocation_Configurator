// Core data entities
export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number;
  RequestedTaskIDs: string[];
  ContactEmail?: string;
  ContactPhone?: string;
  Budget?: number;
  Deadline?: string;
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string[];
  WorkerGroup: string;
  MaxLoadPerPhase: number;
  HourlyRate: number;
  Availability: string[];
  Location?: string;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  RequiredSkills: string[];
  EstimatedDuration: number;
  Phase: string;
  Dependencies: string[];
  Priority: number;
  Cost?: number;
}

// Validation error types
export interface ValidationError {
  id: string;
  entity: 'clients' | 'workers' | 'tasks';
  rowId: string;
  field: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  value?: any;
  suggestion?: string;
}

// Business rules
export interface BusinessRule {
  id: string;
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'skillRequirement';
  name: string;
  description: string;
  parameters: {
    // Co-run rule parameters
    tasks?: string[];
    required?: boolean;
    
    // Slot restriction parameters
    groupType?: 'client' | 'worker';
    groupName?: string;
    minSlots?: number;
    
    // Load limit parameters
    workerGroup?: string;
    maxSlotsPerPhase?: number;
    
    // Phase window parameters
    taskId?: string;
    allowedPhases?: number[];
    
    // Skill requirement parameters
    requiredSkills?: string[];
  };
  priority: number;
  enabled: boolean;
}

// Legacy rule types for backward compatibility
export interface CoRunRule {
  id: string;
  type: 'co-run';
  taskIds: string[];
  description: string;
}

export interface LoadLimitRule {
  id: string;
  type: 'load-limit';
  workerGroup: string;
  maxSlotsPerPhase: number;
  description: string;
}

export interface SkillRequirementRule {
  id: string;
  type: 'skill-requirement';
  taskId: string;
  requiredSkills: string[];
  description: string;
}

// Priorities and weights
export interface PriorityWeights {
  clientPriorityFulfillment: number;
  workerWorkLifeBalance: number;
  costEfficiency: number;
}

// File upload types
export interface FileUpload {
  file: File;
  entity: 'clients' | 'workers' | 'tasks';
  status: 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  columnMapping?: Record<string, string>;
}

// AI search and filter types
export interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'hasTasksWithSkill';
  value: any;
}

export interface SearchResult {
  entity: 'clients' | 'workers' | 'tasks';
  rowIds: string[];
  query: string;
}

// Export package structure
export interface ExportPackage {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules: BusinessRule[];
  priorities: PriorityWeights;
  metadata: {
    exportedAt: string;
    version: string;
    totalRecords: number;
  };
}

// App state types
export interface AppState {
  // Data
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  
  // Validation
  errors: ValidationError[];
  
  // Business rules
  rules: BusinessRule[];
  
  // Priorities
  priorities: PriorityWeights;
  
  // UI state
  activeTab: 'clients' | 'workers' | 'tasks';
  searchQuery: string;
  searchResults: SearchResult | null;
  
  // File uploads
  uploads: FileUpload[];
  
  // Loading states
  isLoading: boolean;
  isProcessing: boolean;
}

// AI response types
export interface ColumnMapping {
  [key: string]: string;
}

export interface AIFilterResponse {
  entity: 'clients' | 'workers' | 'tasks';
  filters: FilterCondition[];
}

export interface AIRuleResponse {
  ruleType: string;
  parameters: any;
  description: string;
} 