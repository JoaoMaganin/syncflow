import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('users', { synchronize: false }) // O nome da tabela deve ser o mesmo do auth-service
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  username: string;
}