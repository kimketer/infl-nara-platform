import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
  ) {}

  async create(creatorId: number, createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const campaign = this.campaignRepository.create({
      ...createCampaignDto,
      creatorId,
    });
    return await this.campaignRepository.save(campaign);
  }

  async findAll(): Promise<Campaign[]> {
    return await this.campaignRepository.find({
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Campaign> {
    const campaign = await this.campaignRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!campaign) {
      throw new NotFoundException('캠페인을 찾을 수 없습니다.');
    }
    return campaign;
  }

  async update(id: number, updateCampaignDto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.findOne(id);
    Object.assign(campaign, updateCampaignDto);
    return await this.campaignRepository.save(campaign);
  }

  async remove(id: number): Promise<void> {
    const campaign = await this.findOne(id);
    await this.campaignRepository.remove(campaign);
  }

  async findByCreatorId(creatorId: number): Promise<Campaign[]> {
    return await this.campaignRepository.find({
      where: { creatorId },
      order: { createdAt: 'DESC' },
    });
  }
} 