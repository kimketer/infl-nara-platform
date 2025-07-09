import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settlement } from './entities/settlement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement])],
  controllers: [],
  providers: [],
  exports: [],
})
export class SettlementsModule {} 