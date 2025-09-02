import { Request } from 'express';
import { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface TokenPayload {
  id: string;
  email: string;
}

export interface FacebookTokens {
  accessToken: string;
  refreshToken?: string;
}