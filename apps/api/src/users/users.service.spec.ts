import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.INFLUENCER,
      };

      const hashedPassword = 'hashedPassword';
      const mockUser = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as any);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
    });

    it('should throw error when user with email already exists', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        role: UserRole.INFLUENCER,
      };

      mockRepository.findOne.mockResolvedValue({ id: 1, email: 'existing@example.com' });

      await expect(service.create(createUserDto)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, email: 'user1@example.com', role: UserRole.INFLUENCER },
        { id: 2, email: 'user2@example.com', role: UserRole.ADVERTISER },
      ];

      mockRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: UserRole.INFLUENCER,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: UserRole.INFLUENCER,
      };

      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const userId = 1;
      const updateUserDto = {
        email: 'updated@example.com',
        role: UserRole.ADVERTISER,
      };

      const mockUser = {
        id: userId,
        ...updateUserDto,
        isActive: true,
      };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.update(userId, updateUserDto);

      expect(result).toEqual(mockUser);
      expect(mockRepository.update).toHaveBeenCalledWith(userId, updateUserDto);
    });

    it('should throw error when user not found', async () => {
      const userId = 999;
      const updateUserDto = { email: 'updated@example.com' };

      mockRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.update(userId, updateUserDto)).rejects.toThrow('User not found');
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      const userId = 1;

      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(userId);

      expect(mockRepository.delete).toHaveBeenCalledWith(userId);
    });

    it('should throw error when user not found', async () => {
      const userId = 999;

      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(userId)).rejects.toThrow('User not found');
    });
  });

  describe('findByRole', () => {
    it('should return users by role', async () => {
      const role = UserRole.INFLUENCER;
      const mockUsers = [
        { id: 1, email: 'influencer1@example.com', role },
        { id: 2, email: 'influencer2@example.com', role },
      ];

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockUsers),
      };

      mockRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findByRole(role);

      expect(result).toEqual(mockUsers);
      expect(queryBuilder.where).toHaveBeenCalledWith('user.role = :role', { role });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('user.isActive = :isActive', { isActive: true });
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const userId = 1;

      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.deactivateUser(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, { isActive: false });
    });

    it('should throw error when user not found', async () => {
      const userId = 999;

      mockRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.deactivateUser(userId)).rejects.toThrow('User not found');
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const userId = 1;

      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.activateUser(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, { isActive: true });
    });

    it('should throw error when user not found', async () => {
      const userId = 999;

      mockRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.activateUser(userId)).rejects.toThrow('User not found');
    });
  });
}); 