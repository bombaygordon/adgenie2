import type { NextApiRequest, NextApiResponse } from 'next';
import bizSdk from 'facebook-nodejs-business-sdk';

interface MetaAdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  business_name?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    // Initialize Meta Business SDK
    const api = bizSdk.FacebookAdsApi.init(accessToken);
    const account = new bizSdk.User(api);

    // Get all ad accounts with detailed information
    const adAccounts = await account.getAdAccounts([
      'name',
      'id',
      'account_status',
      'currency',
      'business_name',
    ]);

    if (!adAccounts || adAccounts.length === 0) {
      return res.status(404).json({ message: 'No ad accounts found' });
    }

    // Format the accounts data
    const formattedAccounts = adAccounts.map((acc: MetaAdAccount) => ({
      id: acc.id,
      name: acc.name,
      businessName: acc.business_name,
      status: acc.account_status === 1 ? 'active' : 'inactive',
      currency: acc.currency,
    }));

    return res.status(200).json({
      accounts: formattedAccounts
    });
  } catch (error) {
    console.error('Error fetching Meta accounts:', error);
    return res.status(500).json({ 
      message: 'Error fetching Meta accounts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 