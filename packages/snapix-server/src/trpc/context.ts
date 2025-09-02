import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { TokenPayload } from '../types';

export interface CreateContextOptions {
  req: Request;
  res: Response;
}

export const createContext = async ({ req, res }: CreateContextOptions) => {
  // Get token from Authorization header
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  let user: IUser | null = null;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      user = await User.findById(decoded.id);
    } catch (error) {
      // Invalid token, user remains null
    }
  }

  return {
    req,
    res,
    user,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;