import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dtos/login.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
  };

  const mockLoginDto: LoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser(
        'test@example.com',
        'password123',
      );
      expect(result).toEqual(mockUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
    });

    it('should throw UnauthorizedException when email is invalid', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.validateUser('wrong@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).toHaveBeenCalledWith(
        'wrong@example.com',
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.validateUser('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
      );
    });
  });

  describe('login', () => {
    it('should return tokens and user info when login is successful', async () => {
      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      jest.spyOn(authService, 'validateUser').mockResolvedValue(mockUser);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (configService.get as jest.Mock).mockReturnValue('1h');

      const result = await authService.login(mockLoginDto);

      expect(result).toEqual({
        userId: mockUser.id,
        username: mockUser.username,
        access_token: mockAccessToken,
        refresh_token: mockRefreshToken,
        expires_in: '1h',
      });
      expect(authService.validateUser).toHaveBeenCalledWith(
        mockLoginDto.email,
        mockLoginDto.password,
      );
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(configService.get).toHaveBeenCalledWith('JWT_EXPIRY', '1h');
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      const mockToken = 'valid-refresh-token';
      const mockPayload = { sub: '1', email: 'test@example.com' };
      const mockLoginResponse = {
        userId: '1',
        username: 'testuser',
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: '1h',
      };

      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      (usersService.findOne as jest.Mock).mockResolvedValue(mockUser);
      jest.spyOn(authService, 'login').mockResolvedValue(mockLoginResponse);

      const result = await authService.refreshToken(mockToken);

      expect(result).toEqual(mockLoginResponse);
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: undefined,
      });
      expect(usersService.findOne).toHaveBeenCalledWith(mockPayload.sub);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      const mockToken = 'invalid-refresh-token';

      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      await expect(authService.refreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: undefined,
      });
    });
  });

  describe('token generation', () => {
    it('should generate access token with correct parameters', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      const mockToken = 'generated-token';
      const mockSecret = 'test-secret';
      const mockExpiry = '1h';

      (jwtService.sign as jest.Mock).mockReturnValue(mockToken);
      (configService.get as jest.Mock)
        .mockReturnValueOnce(mockSecret)
        .mockReturnValueOnce(mockExpiry);

      // Using private method via any type cast
      const result = (authService as any).generateAccessToken(payload);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: mockSecret,
        expiresIn: mockExpiry,
      });
    });

    it('should generate refresh token with correct parameters', async () => {
      const payload = { sub: '1', email: 'test@example.com' };
      const mockToken = 'generated-refresh-token';
      const mockSecret = 'refresh-secret';
      const mockExpiry = '7d';

      (jwtService.sign as jest.Mock).mockReturnValue(mockToken);
      (configService.get as jest.Mock)
        .mockReturnValueOnce(mockSecret)
        .mockReturnValueOnce(mockExpiry);

      // Using private method via any type cast
      const result = (authService as any).generateRefreshToken(payload);

      expect(result).toBe(mockToken);
      expect(jwtService.sign).toHaveBeenCalledWith(payload, {
        secret: mockSecret,
        expiresIn: mockExpiry,
      });
    });
  });
});
