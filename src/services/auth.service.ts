import jwt from 'jsonwebtoken';
import { User } from '../models';
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors';

export class AuthService {
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    dateOfBirth: Date;
    address: string;
    city: string;
    country: string;
    postalCode: string;
    nationalId: string;
  }) {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const existingNationalId = await User.findOne({ where: { nationalId: data.nationalId } });
    if (existingNationalId) {
      throw new ConflictError('National ID already registered');
    }

    const user = await User.create(data);
    const tokens = this.generateTokens(user);

    return { user: user.toSafeJSON(), ...tokens };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await user.update({ lastLogin: new Date() });
    const tokens = this.generateTokens(user);

    return { user: user.toSafeJSON(), ...tokens };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret') as { id: string };
      const user = await User.findByPk(decoded.id);

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User');
    return user.toSafeJSON();
  }

  async updateProfile(userId: string, data: Partial<{ firstName: string; lastName: string; phone: string; address: string; city: string; country: string; postalCode: string }>) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User');
    await user.update(data);
    return user.toSafeJSON();
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw new UnauthorizedError('Current password is incorrect');

    await user.update({ password: newPassword });
    return { message: 'Password changed successfully' };
  }

  private generateTokens(user: User) {
    const payload = { id: user.id, email: user.email, role: user.role };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}

export default new AuthService();
