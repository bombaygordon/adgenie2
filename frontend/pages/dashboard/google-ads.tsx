import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { ChartBarIcon, ArrowTrendingUpIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

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

const GoogleAdsBoard: NextPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [timeRange, setTimeRange] = useState('LAST_30_DAYS');
  const [accountMetrics, setAccountMetrics] = useState<GoogleAdsMetrics>({
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    conversionRate: 0,
    costPerConversion: 0
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/google-ads/status');
      const { isConnected } = await response.json();
      setIsConnected(isConnected);
      if (isConnected) {
        fetchGoogleAdsData();
      }
    } catch (err) {
      console.error('Failed to check connection status:', err);
      setIsConnected(false);
    }
  };

  const handleConnect = () => {
    router.push('/api/google-ads/auth');
  };

  const fetchGoogleAdsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/google-ads/campaigns?timeRange=${timeRange}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch Google Ads data');
      }

      setCampaigns(data.campaigns);
      setAccountMetrics(data.accountMetrics);
    } catch (err) {
      setError('Failed to fetch Google Ads data. Please try again later.');
      console.error('Error fetching Google Ads data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatMetric = (value: number, type: 'currency' | 'percentage' | 'number' = 'number') => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value);
    }
    if (type === 'percentage') {
      return `${value.toFixed(2)}%`;
    }
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'enabled':
        return 'bg-green-500/10 text-green-400';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'removed':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-white">Google Ads Performance</h1>
              <p className="mt-2 text-sm text-gray-400">
                Connect your Google Ads account to view and analyze your campaign performance metrics.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center bg-gray-800 rounded-lg p-8 border border-gray-700">
            <img
              src="/icons/google-ads.svg"
              alt="Google Ads"
              className="h-16 w-16 mb-6"
            />
            <h2 className="text-xl font-medium text-white mb-2">
              Connect Google Ads Account
            </h2>
            <p className="text-sm text-gray-400 text-center max-w-md mb-6">
              To view your Google Ads performance data, you need to connect your account. 
              This will allow us to fetch your campaign metrics and provide insights.
            </p>
            <button
              onClick={handleConnect}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Connect Google Ads
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-white">Google Ads Performance</h1>
            <p className="mt-2 text-sm text-gray-400">
              View and analyze your Google Ads campaign performance metrics.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2 text-sm"
            >
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_7_DAYS">Last 7 days</option>
              <option value="LAST_30_DAYS">Last 30 days</option>
              <option value="THIS_MONTH">This month</option>
              <option value="LAST_MONTH">Last month</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-500/10 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Impressions</p>
                <p className="text-2xl font-semibold text-white">
                  {formatMetric(accountMetrics.impressions)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-green-500/10 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">CTR</p>
                <p className="text-2xl font-semibold text-white">
                  {formatMetric(accountMetrics.ctr, 'percentage')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-500/10 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Cost</p>
                <p className="text-2xl font-semibold text-white">
                  {formatMetric(accountMetrics.cost, 'currency')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-yellow-500/10 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Conversions</p>
                <p className="text-2xl font-semibold text-white">
                  {formatMetric(accountMetrics.conversions)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="mt-8 flow-root">
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">
                      Campaign
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                      Budget
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                      Impressions
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                      Clicks
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                      CTR
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                      Cost
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                      Conv.
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-white">
                      Cost/Conv.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-4 text-sm text-center text-gray-400">
                        Loading campaign data...
                      </td>
                    </tr>
                  ) : campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-4 text-sm text-center text-gray-400">
                        No campaigns found
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-700/50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">
                          {campaign.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                            {campaign.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-300">
                          {formatMetric(campaign.budget, 'currency')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-300">
                          {formatMetric(campaign.metrics.impressions)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-300">
                          {formatMetric(campaign.metrics.clicks)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-300">
                          {formatMetric(campaign.metrics.ctr, 'percentage')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-300">
                          {formatMetric(campaign.metrics.cost, 'currency')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-300">
                          {formatMetric(campaign.metrics.conversions)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-300">
                          {formatMetric(campaign.metrics.costPerConversion, 'currency')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GoogleAdsBoard; 