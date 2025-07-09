import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CampaignsService } from './campaigns.service';
import { Campaign } from './entities/campaign.entity';
import { DeepLink } from './entities/deep-link.entity';
import { CampaignStatus } from './enums/campaign-status.enum';
import { UserRole } from '../users/enums/user-role.enum';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let campaignRepository: Repository<Campaign>;
  let deepLinkRepository: Repository<DeepLink>;
  let configService: ConfigService;

  const mockCampaignRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    })),
  };

  const mockDeepLinkRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(DeepLink),
          useValue: mockDeepLinkRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    campaignRepository = module.get<Repository<Campaign>>(getRepositoryToken(Campaign));
    deepLinkRepository = module.get<Repository<DeepLink>>(getRepositoryToken(DeepLink));
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new campaign', async () => {
      const createCampaignDto = {
        title: 'Test Campaign',
        description: 'Test Description',
        budget: 1000000,
        startDate: new Date(),
        endDate: new Date(),
        advertiserId: 1,
      };

      const mockCampaign = {
        id: 1,
        ...createCampaignDto,
        status: CampaignStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCampaignRepository.save.mockResolvedValue(mockCampaign);

      const result = await service.create(createCampaignDto);

      expect(result).toEqual(mockCampaign);
      expect(mockCampaignRepository.save).toHaveBeenCalledWith({
        ...createCampaignDto,
        status: CampaignStatus.DRAFT,
      });
    });

    it('should validate budget constraints', async () => {
      const createCampaignDto = {
        title: 'Test Campaign',
        description: 'Test Description',
        budget: 50000, // Below minimum
        startDate: new Date(),
        endDate: new Date(),
        advertiserId: 1,
      };

      mockConfigService.get.mockReturnValue(100000); // min_campaign_budget

      await expect(service.create(createCampaignDto)).rejects.toThrow('Budget must be at least 100000 KRW');
    });
  });

  describe('findAll', () => {
    it('should return all campaigns', async () => {
      const mockCampaigns = [
        { id: 1, title: 'Campaign 1', status: CampaignStatus.ACTIVE },
        { id: 2, title: 'Campaign 2', status: CampaignStatus.DRAFT },
      ];

      mockCampaignRepository.find.mockResolvedValue(mockCampaigns);

      const result = await service.findAll();

      expect(result).toEqual(mockCampaigns);
      expect(mockCampaignRepository.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return campaign by id', async () => {
      const mockCampaign = {
        id: 1,
        title: 'Test Campaign',
        status: CampaignStatus.ACTIVE,
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockCampaign),
      };

      mockCampaignRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findById(1);

      expect(result).toEqual(mockCampaign);
      expect(queryBuilder.where).toHaveBeenCalledWith('campaign.id = :id', { id: 1 });
    });

    it('should return null when campaign not found', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockCampaignRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update campaign successfully', async () => {
      const campaignId = 1;
      const updateCampaignDto = {
        title: 'Updated Campaign',
        description: 'Updated Description',
      };

      const mockCampaign = {
        id: campaignId,
        ...updateCampaignDto,
        status: CampaignStatus.DRAFT,
      };

      mockCampaignRepository.update.mockResolvedValue({ affected: 1 });
      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);

      const result = await service.update(campaignId, updateCampaignDto);

      expect(result).toEqual(mockCampaign);
      expect(mockCampaignRepository.update).toHaveBeenCalledWith(campaignId, updateCampaignDto);
    });

    it('should throw error when campaign not found', async () => {
      const campaignId = 999;
      const updateCampaignDto = { title: 'Updated Campaign' };

      mockCampaignRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.update(campaignId, updateCampaignDto)).rejects.toThrow('Campaign not found');
    });
  });

  describe('remove', () => {
    it('should remove campaign successfully', async () => {
      const campaignId = 1;

      mockCampaignRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(campaignId);

      expect(mockCampaignRepository.delete).toHaveBeenCalledWith(campaignId);
    });

    it('should throw error when campaign not found', async () => {
      const campaignId = 999;

      mockCampaignRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(campaignId)).rejects.toThrow('Campaign not found');
    });
  });

  describe('findByAdvertiser', () => {
    it('should return campaigns by advertiser id', async () => {
      const advertiserId = 1;
      const mockCampaigns = [
        { id: 1, title: 'Campaign 1', advertiserId },
        { id: 2, title: 'Campaign 2', advertiserId },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCampaigns),
      };

      mockCampaignRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByAdvertiser(advertiserId);

      expect(result).toEqual(mockCampaigns);
      expect(queryBuilder.where).toHaveBeenCalledWith('campaign.advertiserId = :advertiserId', { advertiserId });
    });
  });

  describe('findByStatus', () => {
    it('should return campaigns by status', async () => {
      const status = CampaignStatus.ACTIVE;
      const mockCampaigns = [
        { id: 1, title: 'Active Campaign 1', status },
        { id: 2, title: 'Active Campaign 2', status },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCampaigns),
      };

      mockCampaignRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByStatus(status);

      expect(result).toEqual(mockCampaigns);
      expect(queryBuilder.where).toHaveBeenCalledWith('campaign.status = :status', { status });
    });
  });

  describe('approveCampaign', () => {
    it('should approve campaign successfully', async () => {
      const campaignId = 1;
      const mockCampaign = {
        id: campaignId,
        title: 'Test Campaign',
        status: CampaignStatus.PENDING,
      };

      mockCampaignRepository.update.mockResolvedValue({ affected: 1 });
      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);

      const result = await service.approveCampaign(campaignId);

      expect(result).toEqual(mockCampaign);
      expect(mockCampaignRepository.update).toHaveBeenCalledWith(campaignId, { status: CampaignStatus.ACTIVE });
    });

    it('should throw error when campaign not found', async () => {
      const campaignId = 999;

      mockCampaignRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.approveCampaign(campaignId)).rejects.toThrow('Campaign not found');
    });
  });

  describe('rejectCampaign', () => {
    it('should reject campaign successfully', async () => {
      const campaignId = 1;
      const mockCampaign = {
        id: campaignId,
        title: 'Test Campaign',
        status: CampaignStatus.REJECTED,
      };

      mockCampaignRepository.update.mockResolvedValue({ affected: 1 });
      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);

      const result = await service.rejectCampaign(campaignId);

      expect(result).toEqual(mockCampaign);
      expect(mockCampaignRepository.update).toHaveBeenCalledWith(campaignId, { status: CampaignStatus.REJECTED });
    });
  });

  describe('createDeepLink', () => {
    it('should create deep link for campaign', async () => {
      const campaignId = 1;
      const createDeepLinkDto = {
        originalUrl: 'https://example.com/product',
        campaignId,
      };

      const mockDeepLink = {
        id: 1,
        ...createDeepLinkDto,
        shortUrl: 'https://bit.ly/abc123',
        clicks: 0,
        conversions: 0,
        revenue: 0,
        createdAt: new Date(),
      };

      mockDeepLinkRepository.save.mockResolvedValue(mockDeepLink);

      const result = await service.createDeepLink(createDeepLinkDto);

      expect(result).toEqual(mockDeepLink);
      expect(mockDeepLinkRepository.save).toHaveBeenCalledWith(createDeepLinkDto);
    });
  });

  describe('getCampaignStats', () => {
    it('should return campaign statistics', async () => {
      const campaignId = 1;
      const mockStats = {
        totalClicks: 1000,
        totalConversions: 50,
        totalRevenue: 500000,
        conversionRate: 5.0,
        averageOrderValue: 10000,
      };

      // Mock the query builder for stats calculation
      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockStats),
      };

      mockDeepLinkRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.getCampaignStats(campaignId);

      expect(result).toEqual(mockStats);
    });
  });
}); 