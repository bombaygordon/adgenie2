import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { PlusIcon } from '@heroicons/react/24/outline';

interface AdAccount {
  id: string;
  name: string;
  status: 'active' | 'disconnected';
  platform: 'meta';
  lastSync?: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectMetaAccount = async () => {
    setIsConnecting(true);
    try {
      // Initialize Meta SDK
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID,
        version: 'v19.0'
      });

      // Request permissions
      window.FB.login((response) => {
        if (response.authResponse) {
          // Handle successful auth
          const accessToken = response.authResponse.accessToken;
          // Call our backend to store the token and fetch ad accounts
          fetch('/api/meta/connect', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accessToken }),
          })
          .then(res => res.json())
          .then(data => {
            // Add the new account to the list
            setAccounts(prev => [...prev, {
              id: data.accountId,
              name: data.accountName,
              status: 'active',
              platform: 'meta',
              lastSync: new Date().toISOString(),
            }]);
          });
        }
      }, { scope: 'ads_management,ads_read' });
    } catch (error) {
      console.error('Error connecting Meta account:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Ad Accounts</h1>
          <p className="text-gray-400">
            Connect your ad accounts to start analyzing your campaigns.
          </p>
        </div>

        {/* Connect Account Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={connectMetaAccount}
            disabled={isConnecting}
            className="p-6 bg-surface rounded-xl border border-gray-700 hover:border-gray-600 transition-colors text-left"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <PlusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Connect Meta Ads</h3>
                <p className="text-sm text-gray-400">
                  Import your Facebook and Instagram ad data
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Connected accounts</h2>
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-surface rounded-xl border border-gray-700 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">M</span>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{account.name}</h3>
                    <p className="text-sm text-gray-400">
                      Last synced: {new Date(account.lastSync || '').toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Accounts State */}
        {accounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">
              No ad accounts connected yet. Connect your first account to get started.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 