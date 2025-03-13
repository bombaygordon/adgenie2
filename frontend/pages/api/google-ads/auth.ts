import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Debug log environment variables
    console.log('Environment variables check:');
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
    console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Missing required Google OAuth credentials');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/google-ads/callback`
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true,
      prompt: 'consent'
    });

    // Debug log the generated URL
    console.log('Generated auth URL:', authUrl);

    res.status(200).json({ authUrl });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ 
      error: 'Failed to initialize OAuth client',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 