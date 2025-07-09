import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TourApiController } from './tour-api.controller';
import { TourApiService } from './tour-api.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [TourApiController],
  providers: [TourApiService],
  exports: [TourApiService],
})
export class TourApiModule {} 