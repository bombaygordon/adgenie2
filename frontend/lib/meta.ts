export interface MetaAccount {
  id: string;
  name: string;
  status: string;
  currency: string;
  timezone_name: string;
}

export async function getMetaAccounts(userId: string): Promise<MetaAccount[]> {
  // Fetch from your database or Meta API
  const response = await fetch(`${process.env.API_URL}/meta/accounts`, {
    headers: {
      'Authorization': `Bearer ${process.env.API_KEY}`,
      'X-User-ID': userId
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Meta accounts');
  }

  const data = await response.json();
  return data.accounts;
} 