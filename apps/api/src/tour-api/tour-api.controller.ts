import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TourApiService } from './tour-api.service';

@ApiTags('Tour API')
@Controller('tour')
export class TourApiController {
  constructor(private readonly tourApiService: TourApiService) {}

  @Get('area')
  @ApiOperation({ summary: '지역 기반 관광지 목록 조회' })
  @ApiResponse({ status: 200, description: '관광지 목록 반환' })
  async getAreaBasedList(@Query() query: any) {
    return await this.tourApiService.getAreaBasedList(query);
  }

  @Get('search')
  @ApiOperation({ summary: '키워드 기반 관광지 검색' })
  @ApiResponse({ status: 200, description: '검색 결과 반환' })
  async searchByKeyword(@Query() query: any) {
    return await this.tourApiService.searchByKeyword(query);
  }

  @Get('photos')
  @ApiOperation({ summary: '관광지 사진 갤러리 조회' })
  @ApiResponse({ status: 200, description: '사진 갤러리 반환' })
  async getPhotoGalleryList(@Query() query: any) {
    return await this.tourApiService.getPhotoGalleryList(query);
  }
} 