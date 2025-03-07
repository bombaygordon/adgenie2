import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { PlusIcon, UsersIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import MetaAccountSelector from '@/components/MetaAccountSelector';

interface MetaAccount {
  id: string;
  name: string;
  businessName?: string;
  status: string;
  currency: string;
}

interface AdAccount {
  id: string;
  name: string;
  status: 'active' | 'disconnected';
  platform: 'meta';
  lastSync?: string;
  businessName?: string;
  currency?: string;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<MetaAccount[]>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSDKInitialized, setIsSDKInitialized] = useState(false);

  // Load Facebook SDK
  useEffect(() => {
    const initializeFacebookSDK = () => {
      const appId = process.env.NEXT_PUBLIC_META_APP_ID;
      if (!appId) {
        console.error('Meta App ID not configured');
        setError('Meta App ID not configured');
        return;
      }

      try {
        window.FB?.init({
          appId,
          version: 'v17.0',
          cookie: true,
          xfbml: false,
          status: true
        });

        // Verify initialization
        window.FB?.getLoginStatus((response) => {
          console.log('FB Login Status:', response.status);
          setIsSDKInitialized(true);
          setError(null);
        });
      } catch (err) {
        console.error('Error initializing Facebook SDK:', err);
        setError('Failed to initialize Facebook SDK');
      }
    };

    // Only load once
    if (!document.getElementById('facebook-jssdk')) {
      // Define async init function
      window.fbAsyncInit = initializeFacebookSDK;

      // Load the SDK
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.id = 'facebook-jssdk';
      
      script.onload = () => {
        console.log('Facebook SDK script loaded');
      };

      script.onerror = () => {
        setError('Failed to load Facebook SDK');
      };

      document.head.appendChild(script);
    } else {
      // If script exists, try to initialize again
      initializeFacebookSDK();
    }

    return () => {
      setIsSDKInitialized(false);
    };
  }, []);

  const fetchMetaAccounts = async (accessToken: string) => {
    try {
      const res = await fetch('/api/meta/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch accounts');
      }

      setAvailableAccounts(data.accounts);
      setShowAccountSelector(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
      throw err;
    }
  };

  const connectMetaAccount = useCallback(() => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please refresh the page.');
      return;
    }

    if (!isSDKInitialized) {
      setError('Facebook SDK is still initializing. Please try again in a moment.');
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      window.FB.login(
        (response) => {
          if (response.authResponse) {
            fetchMetaAccounts(response.authResponse.accessToken)
              .catch((error) => {
                console.error('Error fetching Meta accounts:', error);
                setError('Failed to fetch accounts. Please try again.');
              })
              .finally(() => {
                setIsConnecting(false);
              });
          } else {
            setError('Login was cancelled or failed');
            setIsConnecting(false);
          }
        },
        {
          scope: 'ads_management,ads_read,business_management,public_profile,email',
          return_scopes: true,
          enable_profile_selector: true,
          auth_type: 'rerequest'
        }
      );
    } catch (error) {
      console.error('Error in connectMetaAccount:', error);
      setError('Failed to initialize Meta connection');
      setIsConnecting(false);
    }
  }, [isSDKInitialized]);

  const handleAccountSelection = (selectedAccounts: MetaAccount[]) => {
    setAccounts(prev => [
      ...prev,
      ...selectedAccounts.map(account => ({
        id: account.id,
        name: account.name,
        businessName: account.businessName,
        status: account.status.toLowerCase() === 'active' ? 'active' as const : 'disconnected' as const,
        platform: 'meta' as const,
        currency: account.currency,
        lastSync: new Date().toISOString(),
      }))
    ]);
    setShowAccountSelector(false);
    setAvailableAccounts([]);
  };

  const quickActions = [
    {
      title: 'Create new board',
      description: 'Build reports and grab insights into your creative performance',
      icon: PlusIcon,
      href: '/dashboard/new-board',
    },
    {
      title: 'Manage team members',
      description: 'Collaborate with your team members and build reports together',
      icon: UsersIcon,
      href: '/dashboard/team',
    },
    {
      title: 'Manage ad accounts',
      description: 'Connect your accounts to perform queries in less than a second',
      icon: CreditCardIcon,
      href: '/dashboard/accounts',
    },
  ];

  const reports = [
    {
      title: 'Top Ads',
      description: 'The "Top Ads" report highlights your highest-spending ads with key performance metrics...',
      image: '/images/report-top-ads.png',
      updatedAt: 'Updated about 1 hour ago',
      href: '/dashboard/top-ads',
    },
    {
      title: 'Starter board',
      description: '7 reports',
      image: '/images/report-starter.png',
      updatedAt: 'Created about 2 hours ago',
      href: '/dashboard/starter',
    },
    {
      title: 'Account Performance',
      description: 'This report shows aggregated performance of your whole ad account.',
      image: '/images/report-performance.png',
      updatedAt: 'Created about 2 hours ago',
      href: '/dashboard/performance',
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Home</h1>
          <p className="text-gray-400">
            Welcome to AdGenie, simple and powerful ad analytics that helps everyone make better decisions.
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Quick actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="p-6 bg-surface rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-700 rounded-lg">
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-400">{action.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Activity */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Latest activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <Link
                key={report.title}
                href={report.href}
                className="block bg-surface rounded-xl border border-gray-700 hover:border-gray-600 transition-colors overflow-hidden"
              >
                <div className="aspect-video relative bg-gray-800">
                  {/* Placeholder for report preview image */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <span className="text-sm">Report Preview</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium mb-1">{report.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">{report.description}</p>
                  <p className="text-xs text-gray-500">{report.updatedAt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Connected Accounts */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white mb-4">Connected accounts</h2>
          {accounts.length > 0 ? (
            <div className="space-y-4">
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
                      {account.businessName && (
                        <p className="text-sm text-gray-400">{account.businessName}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-400">
                          Last synced: {new Date(account.lastSync || '').toLocaleString()}
                        </p>
                        {account.currency && (
                          <span className="text-xs text-gray-500">{account.currency}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-auto">
                      <span className={`px-3 py-1 text-sm rounded-full ${
                        account.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={connectMetaAccount}
                disabled={isConnecting}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Connect another account
              </button>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-gray-700 p-8">
              <div className="text-center max-w-md mx-auto">
                <div className="mb-4">
                  <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <PlusIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Connect your first ad account</h3>
                <p className="text-gray-400 text-sm mb-6">
                  Connect your Meta Ads account to start analyzing your campaigns and getting insights.
                </p>
                <button
                  onClick={connectMetaAccount}
                  disabled={isConnecting}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConnecting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    'Connect Meta Ads'
                  )}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Account Selector Modal */}
        {showAccountSelector && (
          <MetaAccountSelector
            accounts={availableAccounts}
            onSelect={handleAccountSelection}
            onClose={() => {
              setShowAccountSelector(false);
              setAvailableAccounts([]);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
} 