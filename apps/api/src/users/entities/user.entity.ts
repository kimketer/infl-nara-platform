import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Campaign } from '../../campaigns/entities/campaign.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'user' })
  role: string; // user, admin, influencer

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ default: 0 })
  followers: number;

  @Column({ default: 0 })
  following: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Campaign, campaign => campaign.user)
  campaigns: Campaign[];
} 