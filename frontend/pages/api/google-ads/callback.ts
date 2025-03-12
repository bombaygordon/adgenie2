import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ADS_CLIENT_ID,
  process.env.GOOGLE_ADS_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/google-ads/callback`
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ message: 'Authorization code is required' });
  }

  try {
    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const { refresh_token, access_token } = tokens;

    if (!refresh_token) {
      throw new Error('No refresh token received');
    }

    // TODO: Store these tokens securely in your database
    // Associate them with the user's account
    
    // For now, we'll store them in an HTTP-only cookie
    // In production, you should store them more securely
    res.setHeader('Set-Cookie', [
      `googleAdsRefreshToken=${refresh_token}; HttpOnly; Path=/; SameSite=Lax; Secure`,
      `googleAdsAccessToken=${access_token}; HttpOnly; Path=/; SameSite=Lax; Secure`
    ]);

    // Redirect back to the Google Ads dashboard
    res.redirect('/dashboard/google-ads');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      message: 'Failed to complete OAuth flow',
      error: error.message
    });
  }
} 