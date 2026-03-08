export interface Task {
  id: string;
  text: string;
  details: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export interface TaskGroup {
  id: string;
  name: string;
  tasks: Task[];
  archived: boolean;
  pinned?: boolean;
}

export interface UserData {
  taskGroups: TaskGroup[];
  activeAgendaId: string | null;
  preferences: {
    sidebarWidth: number;
    sidebarCollapsed: boolean;
    soundEnabled?: boolean;
  };
  updatedAt: string;
}

export const defaultUserData: UserData = {
  taskGroups: [],
  activeAgendaId: null,
  preferences: {
    sidebarWidth: 280,
    sidebarCollapsed: false,
    soundEnabled: true,
  },
  updatedAt: new Date().toISOString(),
};

export type SortMode = "manual" | "dueDate" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";
