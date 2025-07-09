import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class DeepLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ comment: '딥링크 URL' })
  url: string;

  @Column({ comment: '딥링크 코드' })
  code: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 