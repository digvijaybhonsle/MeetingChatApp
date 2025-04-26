// src/types/express/index.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: any;
        id: string;
        name?: string;
        email?: string;
      };
    }
  }
}
