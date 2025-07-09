import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: '정산 금액' })
  amount: number;

  @Column({ comment: '정산 상태' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 