import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { getMetaAccounts, MetaAccount } from '@/lib/meta';

interface ApiResponse {
  accounts: {
    id: string;
    name: string;
    status: 'active' | 'disconnected';
  }[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      accounts: [],
      error: 'Method not allowed' 
    });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.id) {
      return res.status(401).json({ 
        accounts: [],
        error: 'Unauthorized' 
      });
    }

    const accounts = await getMetaAccounts(session.user.id);
    
    return res.status(200).json({
      accounts: accounts.map((account: MetaAccount) => ({
        id: account.id,
        name: account.name,
        status: account.status === 'ACTIVE' ? 'active' : 'disconnected'
      }))
    });

  } catch (error) {
    console.error('Error fetching Meta accounts:', error);
    return res.status(500).json({ 
      accounts: [],
      error: error instanceof Error ? error.message : 'Failed to fetch Meta accounts' 
    });
  }
} 