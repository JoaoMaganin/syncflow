export const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
} as const;

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  ownerId: string;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
  assignees: { id: string; username: string }[];
  comments: { id: string; authorUsername: string }[];
  history: TaskHistory[];
}

export interface mockedTask {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  ownerId: string;
  ownerUsername: string;
  createdAt: string;
  updatedAt: string;
  assignees: { id: string; username: string }[];
  comments: { id: string; authorUsername: string }[];
}

export interface TaskCardProps {
    task: Task
    onEdit: (task: Task) => void
    onDelete: (taskId: string) => void
}

export interface TaskHistory {
  id: string;
  username: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}