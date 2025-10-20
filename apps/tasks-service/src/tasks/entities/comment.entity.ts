import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  authorUsername: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  authorId: string; // ID do usuário que escreveu o comentário

  @CreateDateColumn()
  createdAt: Date;

  // Define a relação: Muitos comentários pertencem a UMA tarefa.
  @ManyToOne(() => Task, (task) => task.comments, { onDelete: 'CASCADE' })
  task: Task;
}