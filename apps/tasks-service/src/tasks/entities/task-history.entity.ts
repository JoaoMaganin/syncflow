import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Quem fez a mudança
  @Column()
  userId: string;

  @Column()
  username: string;

  // O que mudou
  @Column()
  action: string; // Ex: 'STATUS_CHANGE', 'ASSIGNEE_ADDED'

  @Column({ type: 'text', nullable: true })
  oldValue: string | null;

  @Column({ type: 'text', nullable: true })
  newValue: string | null;

  // A qual tarefa este log pertence
  @ManyToOne(() => Task, (task) => task.history, { onDelete: 'CASCADE' })
  task: Task;

  @CreateDateColumn()
  timestamp: Date;
}