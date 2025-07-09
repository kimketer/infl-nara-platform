import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Performance } from './entities/performance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Performance])],
  controllers: [],
  providers: [],
  exports: [],
})
export class PerformanceModule {} 