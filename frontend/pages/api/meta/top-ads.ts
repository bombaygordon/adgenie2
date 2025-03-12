import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

interface TopAdMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  thumbstopRate: number;
  conversionRate: number;
}

interface TopAd {
  id: string;
  name: string;
  campaignName: string;
  thumbnailUrl: string;
  metrics: TopAdMetrics;
}

interface ApiResponse {
  ads: TopAd[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ads: [],
      error: 'Method not allowed'
    });
  }

  try {
    const session = await getSession({ req });
    if (!session?.user?.id || !session?.accessToken) {
      return res.status(401).json({
        ads: [],
        error: 'Unauthorized'
      });
    }

    const { accountIds, conversionAction, dateRange, metrics } = req.body;

    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({
        ads: [],
        error: 'Account IDs are required'
      });
    }

    // Fetch top ads from your backend API
    const response = await fetch(`${process.env.API_URL}/meta/ads/top`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        'X-User-ID': session.user.id
      },
      body: JSON.stringify({
        accountIds,
        conversionAction,
        dateRange,
        metrics: [
          'spend',
          'impressions',
          'clicks',
          'conversions',
          'ctr',
          'cpc',
          'roas',
          'video_p75_watched_actions', // For thumbstop ratio
          'conversion_rate'
        ],
        limit: 50 // Get top 50 ads
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch top ads');
    }

    const data = await response.json();
    
    // Transform the response to match our frontend interface
    const transformedAds = data.ads.map((ad: any) => ({
      id: ad.id,
      name: ad.name,
      campaignName: ad.campaign_name,
      thumbnailUrl: ad.thumbnail_url || '',
      metrics: {
        spend: parseFloat(ad.spend || 0),
        impressions: parseInt(ad.impressions || 0),
        clicks: parseInt(ad.clicks || 0),
        conversions: parseInt(ad.conversions || 0),
        ctr: parseFloat(ad.ctr || 0),
        cpc: parseFloat(ad.cpc || 0),
        roas: parseFloat(ad.roas || 0),
        thumbstopRate: parseFloat(ad.video_p75_watched_actions?.[0]?.value || 0) / parseFloat(ad.impressions || 1),
        conversionRate: parseFloat(ad.conversion_rate || 0)
      }
    }));

    return res.status(200).json({
      ads: transformedAds
    });

  } catch (error) {
    console.error('Error fetching top ads:', error);
    return res.status(500).json({
      ads: [],
      error: error instanceof Error ? error.message : 'Failed to fetch top ads'
    });
  }
} 