import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { User } from '../entities/user.entity';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'kubra',
      };

      const expectedResult: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        username: 'kubra',
        createdAt: new Date(),
        updatedAt: new Date(),
        ratings: [],
        watchlist: [],
      };

      mockUsersService.create.mockResolvedValue(expectedResult);

      expect(await controller.create(createUserDto)).toBe(expectedResult);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should handle errors from service', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'kubra',
      };

      mockUsersService.create.mockRejectedValue(
        new InternalServerErrorException(),
      );

      await expect(controller.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedResult: User[] = [
        {
          id: 1,
          email: 'test1@example.com',
          password: 'hashedpassword1',
          username: 'kubra',
          createdAt: new Date(),
          updatedAt: new Date(),
          ratings: [],
          watchlist: [],
        },
        {
          id: 2,
          email: 'test2@example.com',
          password: 'hashedpassword2',
          username: 'umme',
          createdAt: new Date(),
          updatedAt: new Date(),
          ratings: [],
          watchlist: [],
        },
      ];

      mockUsersService.findAll.mockResolvedValue(expectedResult);

      expect(await controller.findAll()).toBe(expectedResult);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '1';
      const expectedResult: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        username: 'kubra',
        createdAt: new Date(),
        updatedAt: new Date(),
        ratings: [],
        watchlist: [],
      };

      mockUsersService.findOne.mockResolvedValue(expectedResult);

      expect(await controller.findOne(userId)).toBe(expectedResult);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    });

    it('should handle not found exception', async () => {
      const userId = '999';

      mockUsersService.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        username: 'updated',
      };
      const expectedResult: User = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        username: 'updated',
        createdAt: new Date(),
        updatedAt: new Date(),
        ratings: [],
        watchlist: [],
      };

      mockUsersService.update.mockResolvedValue(expectedResult);

      expect(await controller.update(userId, updateUserDto)).toBe(
        expectedResult,
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should handle not found exception', async () => {
      const userId = '999';
      const updateUserDto: UpdateUserDto = {
        username: 'Updated',
      };

      mockUsersService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = '1';

      mockUsersService.remove.mockResolvedValue(undefined);

      expect(await controller.remove(userId)).toBeUndefined();
      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
    });

    it('should handle not found exception', async () => {
      const userId = '999';

      mockUsersService.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
