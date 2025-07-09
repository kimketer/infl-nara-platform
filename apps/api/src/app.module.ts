import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// 모듈들 import
import { CampaignsModule } from './campaigns/campaigns.module';
import { SettlementsModule } from './settlements/settlements.module';
import { PerformanceModule } from './performance/performance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommunityModule } from './community/community.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { TourApiModule } from './tour-api/tour-api.module';

// 엔티티들 import
import { Campaign } from './campaigns/entities/campaign.entity';
import { Settlement } from './settlements/entities/settlement.entity';
import { Performance } from './performance/entities/performance.entity';
import { Post } from './community/entities/post.entity';
import { Comment } from './community/entities/comment.entity';
import { User } from './users/entities/user.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Auth } from './auth/entities/auth.entity';

@Module({
  imports: [
    // 환경 설정
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    
    // TypeORM 설정
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        Campaign,
        Settlement,
        Performance,
        Post,
        Comment,
        User,
        Notification,
        Auth,
      ],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    
    // 기능 모듈들
    CampaignsModule,
    SettlementsModule,
    PerformanceModule,
    NotificationsModule,
    CommunityModule,
    AdminModule,
    AuthModule,
    UsersModule,
    HealthModule,
    TourApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
