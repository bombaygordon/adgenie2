import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_ADS_CLIENT_ID,
  process.env.GOOGLE_ADS_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/google-ads/callback`
);

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Generate the URL for Google's OAuth2 consent screen
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // This will return a refresh token
    scope: ['https://www.googleapis.com/auth/adwords'],
    prompt: 'consent' // Force consent screen to ensure we get refresh token
  });

  // Redirect the user to Google's OAuth2 consent screen
  res.redirect(authUrl);
} 