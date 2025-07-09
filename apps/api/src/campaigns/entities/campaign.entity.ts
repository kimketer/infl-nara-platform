import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// 캠페인 상태를 위한 Enum (타입 안정성)
export enum CampaignStatus {
  ACTIVE = 'active', // 진행중
  PAUSED = 'paused', // 중지됨
  ENDED = 'ended',   // 종료됨
  PENDING = 'pending', // 승인대기
}

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: '캠페인 이름' })
  title: string;

  @Column('text', { comment: '캠페인 상세 설명' })
  description: string;

  @Column({ type: 'timestamp', comment: '캠페인 시작일' })
  startDate: Date;

  @Column({ type: 'timestamp', comment: '캠페인 종료일' })
  endDate: Date;

  @Column({ type: 'int', default: 0, comment: '캠페인 예산' })
  budget: number;

  @Column()
  creatorId: number;

  @ManyToOne(() => User, user => user.campaigns, { onDelete: 'CASCADE' })
  creator: User;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.PENDING,
    comment: '캠페인 상태',
  })
  status: CampaignStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 