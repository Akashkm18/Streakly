import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code = 'ERROR',
  details?: any
): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details,
    },
  });
}
