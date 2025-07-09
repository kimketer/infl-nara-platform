import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TourApiService {
  private readonly logger = new Logger(TourApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('TOUR_API_BASE_URL');
    this.apiKey = this.configService.get<string>('TOUR_API_KEY');
  }

  async getAreaBasedList(params: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/getAreaBasedList`, {
          params: {
            serviceKey: this.apiKey,
            ...params,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Tour API getAreaBasedList error:', error);
      throw error;
    }
  }

  async searchByKeyword(params: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/searchKeyword`, {
          params: {
            serviceKey: this.apiKey,
            ...params,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Tour API searchByKeyword error:', error);
      throw error;
    }
  }

  async getPhotoGalleryList(params: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/getPhotoGalleryList`, {
          params: {
            serviceKey: this.apiKey,
            ...params,
          },
        })
      );
      return response.data;
    } catch (error) {
      this.logger.error('Tour API getPhotoGalleryList error:', error);
      throw error;
    }
  }
} 