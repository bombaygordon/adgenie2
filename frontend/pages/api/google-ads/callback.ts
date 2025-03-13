import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Debug log everything
    console.log('Full request query:', req.query);
    
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      console.error('No code provided in query parameters');
      return res.status(400).json({ error: 'No authorization code provided' });
    }

    // Initialize OAuth2 client with environment variables
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/google-ads/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Successfully exchanged code for tokens');

    // Set cookies with tokens
    if (tokens.access_token) {
      res.setHeader('Set-Cookie', [
        `googleAccessToken=${tokens.access_token}; HttpOnly; Secure; Path=/; SameSite=Lax`,
        tokens.refresh_token ? 
          `googleRefreshToken=${tokens.refresh_token}; HttpOnly; Secure; Path=/; SameSite=Lax` : 
          ''
      ].filter(Boolean));
    }

    // Redirect to dashboard
    res.redirect('/dashboard/google-ads');
  } catch (error) {
    console.error('Error in Google Ads callback:', error);
    res.status(500).json({ error: 'Failed to complete OAuth flow' });
  }
} 