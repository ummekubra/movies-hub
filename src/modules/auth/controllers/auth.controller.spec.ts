import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dtos/login.dto';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login with loginDto', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockLoginResponse = {
        userId: '1',
        username: 'testuser',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: '1h',
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      const result = await authController.login(loginDto);

      expect(result).toEqual(mockLoginResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with token from dto', async () => {
      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: 'refreshToken',
      };

      const mockRefreshResponse = {
        userId: '1',
        username: 'testuser',
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: '1h',
      };

      mockAuthService.refreshToken.mockResolvedValue(mockRefreshResponse);

      const result = await authController.refreshToken(refreshTokenDto);

      expect(result).toEqual(mockRefreshResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith('refreshToken');
    });
  });
});
