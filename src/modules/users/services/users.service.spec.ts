import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { NotFoundException } from '@nestjs/common';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'kubra',
      };

      const hashedPassword = 'hashedPassword123';
      const salt = 'salt';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(salt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const newUser = {
        id: 1,
        ...createUserDto,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(newUser);
      mockRepository.save.mockResolvedValue(newUser);

      const result = await service.create(createUserDto);

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, salt);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(mockRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [
        {
          id: 1,
          email: 'test1@example.com',
          password: 'hashedPassword1',
          username: 'kubra',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          email: 'test2@example.com',
          password: 'hashedPassword2',
          username: 'kubra',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(expectedUsers);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(expectedUsers);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = 1;
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'kubra',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(expectedUser);

      const result = await service.findOne(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    // it('should throw InternalServerErrorException on unexpected errors', async () => {
    //   const userId = 1;

    //   mockRepository.findOne.mockRejectedValue(new Error('Database error'));

    //   await expect(service.findOne(userId)).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    // });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 1;
      const updateUserDto: UpdateUserDto = {
        username: 'kubra',
      };

      const existingUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'kubra',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        ...updateUserDto,
      };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingUser,
        ...updateUserDto,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should hash password if included in update', async () => {
      const userId = 1;
      const updateUserDto: UpdateUserDto = {
        password: 'newPassword123',
      };

      const hashedPassword = 'newHashedPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const existingUser = {
        id: userId,
        email: 'test@example.com',
        password: 'oldHashedPassword',
        username: 'kubra',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        password: hashedPassword,
      };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...existingUser,
        password: hashedPassword,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;
      const updateUserDto: UpdateUserDto = {
        username: 'Updated',
      };

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const userId = 1;
      const existingUser = {
        id: userId,
        email: 'test@example.com',
        password: 'hashedPassword',
        username: 'kubra',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingUser);
      mockRepository.remove.mockResolvedValue(undefined);

      await service.remove(userId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(existingUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
