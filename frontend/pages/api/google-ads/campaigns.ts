import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface GoogleAdsMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  costPerConversion: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  metrics: GoogleAdsMetrics;
}

// Initialize Google Ads API client
const googleAds = google.ads({
  version: 'v14',
  auth: new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_ADS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_ADS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/adwords'],
  }),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { timeRange = 'LAST_30_DAYS' } = req.query;
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

    if (!customerId) {
      throw new Error('Google Ads Customer ID not configured');
    }

    // Construct the GAQL query
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.campaign_budget,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_per_conversion
      FROM campaign
      WHERE segments.date DURING ${timeRange}
    `;

    // Execute the query
    const response = await googleAds.customers.search({
      customerId,
      query,
    });

    // Transform the response
    const campaigns = response.data.results?.map((result: any) => ({
      id: result.campaign.id,
      name: result.campaign.name,
      status: result.campaign.status,
      budget: Number(result.campaign.campaignBudget) / 1_000_000, // Convert micros to actual amount
      metrics: {
        impressions: Number(result.metrics.impressions),
        clicks: Number(result.metrics.clicks),
        cost: Number(result.metrics.costMicros) / 1_000_000,
        conversions: Number(result.metrics.conversions),
        ctr: Number(result.metrics.ctr) * 100,
        cpc: Number(result.metrics.averageCpc) / 1_000_000,
        conversionRate: Number(result.metrics.conversions) / Number(result.metrics.clicks) * 100,
        costPerConversion: Number(result.metrics.costPerConversion) / 1_000_000,
      },
    })) || [];

    // Calculate account-level metrics
    const accountMetrics = campaigns.reduce(
      (acc: GoogleAdsMetrics, campaign: Campaign) => ({
        impressions: acc.impressions + campaign.metrics.impressions,
        clicks: acc.clicks + campaign.metrics.clicks,
        cost: acc.cost + campaign.metrics.cost,
        conversions: acc.conversions + campaign.metrics.conversions,
        ctr: 0, // Will calculate after
        cpc: 0, // Will calculate after
        conversionRate: 0, // Will calculate after
        costPerConversion: 0, // Will calculate after
      }),
      {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        conversionRate: 0,
        costPerConversion: 0,
      }
    );

    // Calculate derived metrics
    accountMetrics.ctr = (accountMetrics.clicks / accountMetrics.impressions) * 100;
    accountMetrics.cpc = accountMetrics.cost / accountMetrics.clicks;
    accountMetrics.conversionRate = (accountMetrics.conversions / accountMetrics.clicks) * 100;
    accountMetrics.costPerConversion = accountMetrics.cost / accountMetrics.conversions;

    return res.status(200).json({
      campaigns,
      accountMetrics,
    });
  } catch (error: any) {
    console.error('Google Ads API Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch Google Ads data',
      error: error.message,
    });
  }
} 