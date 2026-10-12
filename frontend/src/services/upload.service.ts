import axios from 'axios';
import { api } from './api';
import { ApiResponse } from '../types';

export interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export const uploadService = {
  async uploadImage(file: File, folder = 'farmlink/products'): Promise<{ imageUrl: string; publicId: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await api.post<ApiResponse<{ imageUrl: string; publicId: string }>>(
      `/uploads?folder=${encodeURIComponent(folder)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      }
    );

    return res.data.data;
  },
};
