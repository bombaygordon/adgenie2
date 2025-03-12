import { NextPage } from 'next';
import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { EllipsisHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DataSource {
  id: string;
  name: string;
  icon: string;
  status: 'connected' | 'not_connected';
  accountId?: string;
  lastSync?: string;
  dataSince?: string;
  isBeta?: boolean;
  isComingSoon?: boolean;
}

const DataSourcesPage: NextPage = () => {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: 'meta',
      name: 'Meta',
      icon: '/icons/meta.svg',
      status: 'connected',
      accountId: 'b982633061913101',
      lastSync: 'about 10 hours ago',
      dataSince: 'Mar 1, 2024'
    },
    {
      id: 'google-ads',
      name: 'Google Ads',
      icon: '/icons/google-ads.svg',
      status: 'not_connected'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: '/icons/tiktok.svg',
      status: 'not_connected'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: '/icons/linkedin.svg',
      status: 'not_connected'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '/icons/youtube.svg',
      status: 'not_connected',
      isBeta: true,
      isComingSoon: true
    }
  ]);

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState('');
  const [googleDeveloperToken, setGoogleDeveloperToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (sourceId: string) => {
    if (sourceId === 'google-ads') {
      setShowGoogleModal(true);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      setError('');
      setIsConnecting(true);

      // Here you would make an API call to your backend to validate and store the credentials
      // For now, we'll simulate a successful connection
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update the data source status
      setDataSources(prev => prev.map(source => {
        if (source.id === 'google-ads') {
          return {
            ...source,
            status: 'connected',
            accountId: googleCustomerId,
            lastSync: 'just now',
            dataSince: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          };
        }
        return source;
      }));

      setShowGoogleModal(false);
      setGoogleCustomerId('');
      setGoogleDeveloperToken('');
    } catch (err) {
      setError('Failed to connect to Google Ads. Please check your credentials and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-white">Data sources</h1>
            <p className="mt-2 text-sm text-gray-400">
              Connect and manage your ad data sources to unlock insights into your ads data.
            </p>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {dataSources.map((source, index) => (
              <div
                key={source.id}
                className={`flex items-center justify-between p-6 ${
                  index !== dataSources.length - 1 ? 'border-b border-gray-700' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={source.icon}
                      alt={`${source.name} icon`}
                      className="h-8 w-8"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-white">{source.name}</h3>
                      {source.isBeta && (
                        <span className="inline-flex items-center rounded-md bg-gray-700 px-2 py-1 text-xs font-medium text-gray-300">
                          Beta
                        </span>
                      )}
                    </div>
                    {source.accountId && (
                      <p className="text-sm text-gray-400">{source.accountId}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {source.status === 'connected' ? (
                    <>
                      <div className="text-sm text-gray-400">
                        Synced {source.lastSync}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-400 mr-2"></span>
                        Data since {source.dataSince} synced
                      </div>
                      <button className="p-2 text-gray-400 hover:text-white">
                        <EllipsisHorizontalIcon className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-400">
                        No accounts connected
                      </div>
                      {source.isComingSoon ? (
                        <span className="inline-flex items-center rounded-md bg-gray-700 px-3 py-1 text-sm font-medium text-gray-300">
                          Coming soon
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleConnect(source.id)}
                          className="inline-flex items-center rounded-md bg-green-900 px-3 py-1 text-sm font-medium text-green-400 hover:bg-green-800"
                        >
                          Add account
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Google Ads Connection Modal */}
        {showGoogleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Connect Google Ads</h2>
                <button 
                  onClick={() => setShowGoogleModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    value={googleCustomerId}
                    onChange={(e) => setGoogleCustomerId(e.target.value)}
                    placeholder="123-456-7890"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Your 10-digit Google Ads customer ID (XXX-XXX-XXXX)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Developer Token
                  </label>
                  <input
                    type="password"
                    value={googleDeveloperToken}
                    onChange={(e) => setGoogleDeveloperToken(e.target.value)}
                    placeholder="Enter your developer token"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Your Google Ads API developer token
                  </p>
                </div>

                {error && (
                  <div className="text-red-400 text-sm">{error}</div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowGoogleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGoogleConnect}
                    disabled={!googleCustomerId || !googleDeveloperToken || isConnecting}
                    className="px-4 py-2 text-sm font-medium bg-green-900 text-green-400 rounded-md hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DataSourcesPage; 