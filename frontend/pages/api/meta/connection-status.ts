import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

interface ApiResponse {
  isConnected: boolean;
  connectedAccount?: {
    id: string;
    name: string;
    accessToken: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      isConnected: false,
      error: 'Method not allowed'
    });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({
        isConnected: false,
        error: 'Unauthorized'
      });
    }

    // Check if user has Meta connection in your database
    const response = await fetch(`${process.env.API_URL}/users/${session.user.id}/meta-connection`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'X-User-ID': session.user.id
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return res.status(200).json({
          isConnected: false
        });
      }
      throw new Error('Failed to check Meta connection');
    }

    const data = await response.json();
    
    return res.status(200).json({
      isConnected: true,
      connectedAccount: data.account // This should include id, name, and accessToken
    });

  } catch (error) {
    console.error('Error checking Meta connection:', error);
    return res.status(500).json({
      isConnected: false,
      error: error instanceof Error ? error.message : 'Failed to check Meta connection'
    });
  }
} 