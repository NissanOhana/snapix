import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { TokenPayload } from '../types';

export class AuthService {
  generateTokens(user: IUser) {
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRE,
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE,
    });

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string): Promise<IUser | null> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET!
      ) as TokenPayload;

      const user = await User.findById(decoded.id).select('+refreshToken');
      
      if (!user || user.refreshToken !== token) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  async saveRefreshToken(userId: string, refreshToken: string) {
    await User.findByIdAndUpdate(userId, { refreshToken });
  }

  async revokeRefreshToken(userId: string) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
}

export default new AuthService();