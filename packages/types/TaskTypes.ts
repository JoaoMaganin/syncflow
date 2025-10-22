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
  ownerUsername: string; // Já vamos adicionar o que fizemos antes
  createdAt: string;
  updatedAt: string;
  assignees: { id: string; username: string }[]; // Já vamos adicionar o que fizemos antes
  comments: { id: string; authorUsername: string }[]; // E aqui também
}


export interface TaskCardProps {
    task: Task
    onEdit: (task: Task) => void
    onDelete: (taskId: string) => void
}