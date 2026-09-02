import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendPaginated = <T>(
  res: Response,
  items: T[],
  pagination: PaginationMeta,
  statusCode: number = 200
): Response<ApiResponse<PaginatedData<T>>> => {
  return res.status(statusCode).json({
    success: true,
    data: {
      items,
      pagination,
    },
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  fields?: Record<string, string[]>
): Response<ApiResponse> => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(fields ? { fields } : {}),
    },
  });
};
