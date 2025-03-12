import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get cookies from the request
  const cookies = parse(req.headers.cookie || '');
  const refreshToken = cookies.googleAdsRefreshToken;

  // Check if we have a refresh token
  const isConnected = !!refreshToken;

  res.json({ isConnected });
} 