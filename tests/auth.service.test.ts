import { AuthService } from '../src/services/auth.service';
import { User } from '../src/models';
import { UnauthorizedError } from '../src/errors';

// Mock the models
jest.mock('../src/models', () => ({
  User: {
    findOne: jest.fn(),
  },
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-token'),
}));

const authService = new AuthService();

describe('AuthService.login()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC1 - P1 : User non trouve
  it('should throw UnauthorizedError when email does not exist', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await expect(authService.login('unknown@test.com', 'password'))
      .rejects.toThrow('Invalid email or password');
  });

  // TC2 - P2 : Compte desactive
  it('should throw UnauthorizedError when account is deactivated', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      isActive: false,
    });

    await expect(authService.login('inactive@test.com', 'password'))
      .rejects.toThrow('Account is deactivated');
  });

  // TC3 - P3 : Mauvais mot de passe
  it('should throw UnauthorizedError when password is incorrect', async () => {
    (User.findOne as jest.Mock).mockResolvedValue({
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(false),
    });

    await expect(authService.login('active@test.com', 'wrongpassword'))
      .rejects.toThrow('Invalid email or password');
  });

  // TC4 - P4 : Login reussi
  it('should return user and tokens on successful login', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'active@test.com',
      role: 'customer',
      isActive: true,
      comparePassword: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(true),
      toSafeJSON: jest.fn().mockReturnValue({
        id: 'user-1',
        email: 'active@test.com',
        role: 'customer',
      }),
    };
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const result = await authService.login('active@test.com', 'correctpassword');

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(result.user.email).toBe('active@test.com');
    expect(mockUser.update).toHaveBeenCalled();
    expect(mockUser.comparePassword).toHaveBeenCalledWith('correctpassword');
  });
});
