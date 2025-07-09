import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Campaigns')
@ApiBearerAuth()
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '캠페인 생성' })
  @ApiResponse({ status: 201, description: '캠페인 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async create(@Request() req, @Body() createCampaignDto: CreateCampaignDto) {
    return await this.campaignsService.create(req.user.id, createCampaignDto);
  }

  @Get()
  @ApiOperation({ summary: '캠페인 목록 조회' })
  @ApiResponse({ status: 200, description: '캠페인 목록 반환' })
  async findAll() {
    return await this.campaignsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '캠페인 상세 조회' })
  @ApiResponse({ status: 200, description: '캠페인 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '캠페인을 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    return await this.campaignsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '캠페인 수정' })
  @ApiResponse({ status: 200, description: '캠페인 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '캠페인을 찾을 수 없음' })
  async update(@Request() req, @Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto) {
    const campaign = await this.campaignsService.findOne(+id);
    if (campaign.creatorId !== req.user.id) {
      throw new ForbiddenException('캠페인을 수정할 권한이 없습니다.');
    }
    return await this.campaignsService.update(+id, updateCampaignDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '캠페인 삭제' })
  @ApiResponse({ status: 200, description: '캠페인 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '캠페인을 찾을 수 없음' })
  async remove(@Request() req, @Param('id') id: string) {
    const campaign = await this.campaignsService.findOne(+id);
    if (campaign.creatorId !== req.user.id) {
      throw new ForbiddenException('캠페인을 삭제할 권한이 없습니다.');
    }
    return await this.campaignsService.remove(+id);
  }

  @Get('my-campaigns')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '내가 만든 캠페인 목록' })
  @ApiResponse({ status: 200, description: '내 캠페인 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async findMyCampaigns(@Request() req) {
    return await this.campaignsService.findByCreatorId(req.user.id);
  }
} 