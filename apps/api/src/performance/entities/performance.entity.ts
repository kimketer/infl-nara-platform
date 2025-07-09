import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Performance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: '성과 지표' })
  metric: string;

  @Column({ comment: '성과 값' })
  value: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 