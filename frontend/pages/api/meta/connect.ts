import type { NextApiRequest, NextApiResponse } from 'next';
import type { AdAccount, BusinessManager } from '@/types/meta';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ message: 'Access token is required' });
  }

  try {
    // First, fetch business managers with proper error handling
    const businessResponse = await fetch(
      'https://graph.facebook.com/v19.0/me/businesses',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
      }
    );

    const businessData = await businessResponse.json();

    if (!businessResponse.ok) {
      const errorMessage = businessData.error?.message || 'Failed to fetch business managers';
      throw new Error(errorMessage);
    }

    if (!businessData.data || !Array.isArray(businessData.data)) {
      throw new Error('Invalid response from Meta API');
    }

    const businessManagers: BusinessManager[] = [];

    // For each business, fetch its ad accounts
    for (const business of businessData.data) {
      try {
        const adAccountsResponse = await fetch(
          `https://graph.facebook.com/v19.0/${business.id}/client_ad_accounts?fields=name,currency,account_status,business_name`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Accept': 'application/json'
            },
          }
        );

        const adAccountsData = await adAccountsResponse.json();

        if (!adAccountsResponse.ok) {
          console.error(`Failed to fetch ad accounts for business ${business.id}:`, adAccountsData.error?.message);
          continue;
        }

        // Initialize empty array if no accounts are found
        const adAccounts: AdAccount[] = adAccountsData.data ? adAccountsData.data.map((account: any) => ({
          id: account.id,
          name: account.name,
          currency: account.currency || 'USD',
          status: account.account_status === 1 ? 'active' : 'inactive',
          businessName: account.business_name || business.name,
        })) : [];

        // Only add business managers that have ad accounts
        if (adAccounts.length > 0) {
          businessManagers.push({
            id: business.id,
            name: business.name,
            adAccounts: adAccounts,
          });
        }
      } catch (error) {
        console.error(`Error processing business ${business.id}:`, error);
        // Continue with other businesses even if one fails
        continue;
      }
    }

    // If no business managers with ad accounts were found
    if (businessManagers.length === 0) {
      return res.status(404).json({
        message: 'No ad accounts found in any of your business managers',
        businessManagers: []
      });
    }

    return res.status(200).json({
      businessManagers,
    });
  } catch (error) {
    console.error('Error fetching Meta data:', error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Failed to fetch Meta data',
      businessManagers: []
    });
  }
} 