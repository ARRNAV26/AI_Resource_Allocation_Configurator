import { create } from 'zustand';
import { Client, Worker, Task, ValidationError, BusinessRule, PriorityWeights, SearchResult, FileUpload } from '@/types';

interface AppState {
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

interface AppActions {
  // Data actions
  setClients: (clients: Client[]) => void;
  setWorkers: (workers: Worker[]) => void;
  setTasks: (tasks: Task[]) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  
  // Validation actions
  setErrors: (errors: ValidationError[]) => void;
  addError: (error: ValidationError) => void;
  removeError: (errorId: string) => void;
  clearErrors: (entity?: 'clients' | 'workers' | 'tasks') => void;
  
  // Business rules actions
  addRule: (rule: BusinessRule) => void;
  removeRule: (ruleId: string) => void;
  updateRule: (ruleId: string, updates: Partial<BusinessRule>) => void;
  
  // Priorities actions
  setPriorities: (priorities: PriorityWeights) => void;
  updatePriority: (key: keyof PriorityWeights, value: number) => void;
  
  // UI actions
  setActiveTab: (tab: 'clients' | 'workers' | 'tasks') => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult | null) => void;
  
  // File upload actions
  addUpload: (upload: FileUpload) => void;
  updateUpload: (fileId: string, updates: Partial<FileUpload>) => void;
  removeUpload: (fileId: string) => void;
  
  // Loading actions
  setLoading: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  
  // Utility actions
  reset: () => void;
}

const initialState: AppState = {
  clients: [],
  workers: [],
  tasks: [],
  errors: [],
  rules: [],
  priorities: {
    clientPriorityFulfillment: 50,
    workerWorkLifeBalance: 50,
    costEfficiency: 50,
  },
  activeTab: 'clients',
  searchQuery: '',
  searchResults: null,
  uploads: [],
  isLoading: false,
  isProcessing: false,
};

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,
  
  // Data actions
  setClients: (clients) => set({ clients }),
  setWorkers: (workers) => set({ workers }),
  setTasks: (tasks) => set({ tasks }),
  
  updateClient: (id, updates) => set((state) => ({
    clients: state.clients.map(client => 
      client.ClientID === id ? { ...client, ...updates } : client
    )
  })),
  
  updateWorker: (id, updates) => set((state) => ({
    workers: state.workers.map(worker => 
      worker.WorkerID === id ? { ...worker, ...updates } : worker
    )
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.TaskID === id ? { ...task, ...updates } : task
    )
  })),
  
  // Validation actions
  setErrors: (errors) => set({ errors }),
  addError: (error) => set((state) => ({ errors: [...state.errors, error] })),
  removeError: (errorId) => set((state) => ({ 
    errors: state.errors.filter(error => error.id !== errorId) 
  })),
  clearErrors: (entity) => set((state) => ({ 
    errors: entity ? state.errors.filter(error => error.entity !== entity) : [] 
  })),
  
  // Business rules actions
  addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
  removeRule: (ruleId) => set((state) => ({ 
    rules: state.rules.filter(rule => rule.id !== ruleId) 
  })),
  updateRule: (ruleId, updates) => set((state) => ({
    rules: state.rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    )
  })),
  
  // Priorities actions
  setPriorities: (priorities) => set({ priorities }),
  updatePriority: (key, value) => set((state) => ({
    priorities: { ...state.priorities, [key]: value }
  })),
  
  // UI actions
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  
  // File upload actions
  addUpload: (upload) => set((state) => ({ uploads: [...state.uploads, upload] })),
  updateUpload: (fileId, updates) => set((state) => ({
    uploads: state.uploads.map(upload => 
      upload.file.name === fileId ? { ...upload, ...updates } : upload
    )
  })),
  removeUpload: (fileId) => set((state) => ({ 
    uploads: state.uploads.filter(upload => upload.file.name !== fileId) 
  })),
  
  // Loading actions
  setLoading: (isLoading) => set({ isLoading }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  // Utility actions
  reset: () => set(initialState),
})); 