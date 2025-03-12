import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AccountFilter from '@/components/AccountFilter';
import { ChevronUpIcon, ChevronDownIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { makeGraphRequest, performFacebookLogin } from '@/lib/facebook-sdk';
import { useAuth } from '@/context/AuthContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TopAdMetrics {
  // Cost metrics
  spend: number;
  cpc: number;
  cpm: number;
  cpp: number;
  costPerInlineLinkClick: number;
  costPerEstimatedAdRecallers: number;
  costPerThruplay: number;

  // Performance metrics
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  uniqueClicks: number;
  ctr: number;
  uniqueCtr: number;
  estimatedAdRecallRate: number;
  estimatedAdRecallers: number;

  // Engagement metrics
  postEngagement: number;
  postReactions: number;
  postComments: number;
  postShares: number;
  linkClicks: number;
  outboundClicks: number;
  outboundClicksCtr: number;
  pageEngagement: number;
  pageLikes: number;

  // Video metrics
  videoPlays: number;
  videoPPlays: number;
  videoPlayRate: number;
  videoAvgTimeWatched: number;
  videoP25WatchedRate: number;
  videoP50WatchedRate: number;
  videoP75WatchedRate: number;
  videoP95WatchedRate: number;
  videoP100WatchedRate: number;
  videoContinuous2SecWatched: number;
  videoThruplayWatched: number;

  // Conversion metrics
  purchases: number;
  costPerPurchase: number;
  purchaseValue: number;
  purchaseRoas: number;
  addToCart: number;
  costPerAddToCart: number;
  checkouts: number;
  costPerCheckout: number;

  // Lead Generation
  leads: number;
  costPerLead: number;
  registrations: number;
  costPerRegistration: number;

  // Custom Conversions
  customConversions: number;
  costPerCustomConversion: number;
  uniqueConversions: number;
  costPerUniqueConversion: number;

  // Mobile App
  mobileAppInstalls: number;
  costPerMobileAppInstall: number;
  mobileAppActions: number;
  costPerMobileAppAction: number;

  // Messaging
  messagingConversationsStarted: number;
  costPerMessagingConversationStarted: number;
  messagingReplies: number;

  // Cross-Device
  crossDeviceConversions: number;
  crossDevicePurchases: number;
}

interface MetricTemplate {
  id: string;
  name: string;
  metrics: Set<keyof TopAdMetrics>;
}

interface MetricGroup {
  label: string;
  metrics: Array<{
    key: keyof TopAdMetrics;
    label: string;
    type: 'currency' | 'percentage' | 'number' | 'time';
    description: string;
  }>;
}

const METRIC_GROUPS: MetricGroup[] = [
  {
    label: 'Cost Metrics',
    metrics: [
      { key: 'spend', label: 'Spend', type: 'currency', description: 'Total amount spent' },
      { key: 'cpc', label: 'Cost per Click', type: 'currency', description: 'Average cost per click' },
      { key: 'cpm', label: 'CPM', type: 'currency', description: 'Cost per 1,000 impressions' },
      { key: 'cpp', label: 'CPP', type: 'currency', description: 'Cost per 1,000 people reached' },
      { key: 'costPerInlineLinkClick', label: 'Cost per Link Click', type: 'currency', description: 'Average cost per link click' },
      { key: 'costPerEstimatedAdRecallers', label: 'Cost per Ad Recall', type: 'currency', description: 'Cost per person who recalls your ad' },
      { key: 'costPerThruplay', label: 'Cost per Thruplay', type: 'currency', description: 'Average cost per video thruplay' }
    ]
  },
  {
    label: 'Performance Metrics',
    metrics: [
      { key: 'impressions', label: 'Impressions', type: 'number', description: 'Number of times ads were shown' },
      { key: 'reach', label: 'Reach', type: 'number', description: 'Number of unique people who saw ads' },
      { key: 'frequency', label: 'Frequency', type: 'number', description: 'Average number of times each person saw ads' },
      { key: 'clicks', label: 'Clicks', type: 'number', description: 'Total clicks on ads' },
      { key: 'uniqueClicks', label: 'Unique Clicks', type: 'number', description: 'Number of unique people who clicked' },
      { key: 'ctr', label: 'CTR', type: 'percentage', description: 'Click-through rate' },
      { key: 'uniqueCtr', label: 'Unique CTR', type: 'percentage', description: 'Unique click-through rate' },
      { key: 'estimatedAdRecallRate', label: 'Est. Ad Recall Rate', type: 'percentage', description: 'Estimated ad recall lift rate' },
      { key: 'estimatedAdRecallers', label: 'Est. Ad Recallers', type: 'number', description: 'Estimated number of people likely to recall your ad' }
    ]
  },
  {
    label: 'Engagement Metrics',
    metrics: [
      { key: 'postEngagement', label: 'Post Engagement', type: 'number', description: 'Total post engagements' },
      { key: 'postReactions', label: 'Reactions', type: 'number', description: 'Total post reactions' },
      { key: 'postComments', label: 'Comments', type: 'number', description: 'Total post comments' },
      { key: 'postShares', label: 'Shares', type: 'number', description: 'Total post shares' },
      { key: 'linkClicks', label: 'Link Clicks', type: 'number', description: 'Total link clicks' },
      { key: 'outboundClicks', label: 'Outbound Clicks', type: 'number', description: 'Clicks to external destinations' },
      { key: 'outboundClicksCtr', label: 'Outbound CTR', type: 'percentage', description: 'Outbound clicks divided by impressions' },
      { key: 'pageEngagement', label: 'Page Engagement', type: 'number', description: 'Total page engagements' },
      { key: 'pageLikes', label: 'Page Likes', type: 'number', description: 'Number of page likes from ads' }
    ]
  },
  {
    label: 'Video Metrics',
    metrics: [
      { key: 'videoPlays', label: 'Video Plays', type: 'number', description: 'Number of times your video started playing' },
      { key: 'videoPPlays', label: 'Paid Video Plays', type: 'number', description: 'Number of paid video plays' },
      { key: 'videoPlayRate', label: 'Play Rate', type: 'percentage', description: 'Video play rate' },
      { key: 'videoAvgTimeWatched', label: 'Avg Watch Time', type: 'time', description: 'Average video watch time' },
      { key: 'videoP25WatchedRate', label: '25% Watched', type: 'percentage', description: 'Percentage who watched 25%' },
      { key: 'videoP50WatchedRate', label: '50% Watched', type: 'percentage', description: 'Percentage who watched 50%' },
      { key: 'videoP75WatchedRate', label: '75% Watched', type: 'percentage', description: 'Percentage who watched 75%' },
      { key: 'videoP95WatchedRate', label: '95% Watched', type: 'percentage', description: 'Percentage who watched 95%' },
      { key: 'videoP100WatchedRate', label: '100% Watched', type: 'percentage', description: 'Percentage who watched 100%' },
      { key: 'videoContinuous2SecWatched', label: '2s Continuous Views', type: 'number', description: 'Number of 2-second continuous video views' },
      { key: 'videoThruplayWatched', label: 'Thruplay Views', type: 'number', description: 'Number of video thruplay views' }
    ]
  },
  {
    label: 'Conversion Metrics',
    metrics: [
      { key: 'purchases', label: 'Purchases', type: 'number', description: 'Total purchase events' },
      { key: 'costPerPurchase', label: 'Cost per Purchase', type: 'currency', description: 'Average cost per purchase' },
      { key: 'purchaseValue', label: 'Purchase Value', type: 'currency', description: 'Total value of purchases' },
      { key: 'purchaseRoas', label: 'Purchase ROAS', type: 'number', description: 'Return on ad spend for purchases' },
      { key: 'addToCart', label: 'Add to Cart', type: 'number', description: 'Number of add to cart events' },
      { key: 'costPerAddToCart', label: 'Cost per Add to Cart', type: 'currency', description: 'Average cost per add to cart' },
      { key: 'checkouts', label: 'Checkouts', type: 'number', description: 'Number of checkout events' },
      { key: 'costPerCheckout', label: 'Cost per Checkout', type: 'currency', description: 'Average cost per checkout' }
    ]
  },
  {
    label: 'Lead Generation',
    metrics: [
      { key: 'leads', label: 'Leads', type: 'number', description: 'Number of leads generated' },
      { key: 'costPerLead', label: 'Cost per Lead', type: 'currency', description: 'Average cost per lead' },
      { key: 'registrations', label: 'Registrations', type: 'number', description: 'Number of registrations' },
      { key: 'costPerRegistration', label: 'Cost per Registration', type: 'currency', description: 'Average cost per registration' }
    ]
  },
  {
    label: 'Custom Conversions',
    metrics: [
      { key: 'customConversions', label: 'Custom Conversions', type: 'number', description: 'Total custom conversion events' },
      { key: 'costPerCustomConversion', label: 'Cost per Custom Conv.', type: 'currency', description: 'Average cost per custom conversion' },
      { key: 'uniqueConversions', label: 'Unique Conversions', type: 'number', description: 'Number of unique conversions' },
      { key: 'costPerUniqueConversion', label: 'Cost per Unique Conv.', type: 'currency', description: 'Average cost per unique conversion' }
    ]
  },
  {
    label: 'Mobile App',
    metrics: [
      { key: 'mobileAppInstalls', label: 'App Installs', type: 'number', description: 'Number of mobile app installs' },
      { key: 'costPerMobileAppInstall', label: 'Cost per Install', type: 'currency', description: 'Average cost per app install' },
      { key: 'mobileAppActions', label: 'App Actions', type: 'number', description: 'Number of mobile app actions' },
      { key: 'costPerMobileAppAction', label: 'Cost per App Action', type: 'currency', description: 'Average cost per app action' }
    ]
  },
  {
    label: 'Messaging',
    metrics: [
      { key: 'messagingConversationsStarted', label: 'Conversations Started', type: 'number', description: 'Number of messaging conversations started' },
      { key: 'costPerMessagingConversationStarted', label: 'Cost per Conversation', type: 'currency', description: 'Average cost per messaging conversation' },
      { key: 'messagingReplies', label: 'Message Replies', type: 'number', description: 'Number of messaging replies' }
    ]
  },
  {
    label: 'Cross-Device',
    metrics: [
      { key: 'crossDeviceConversions', label: 'Cross-Device Conv.', type: 'number', description: 'Number of cross-device conversions' },
      { key: 'crossDevicePurchases', label: 'Cross-Device Purchases', type: 'number', description: 'Number of cross-device purchases' }
    ]
  }
];

interface TopAd {
  id: string;
  name: string;
  campaignName: string;
  thumbnailUrl: string;
  metrics: TopAdMetrics;
  // Updated properties to match Meta's API fields
  adsetName?: string;
  adId?: string;
  adsetId?: string;
  creativeMediaType?: string;
  platform?: string;
  placement?: string;
  devicePlatform?: string;
  country?: string;
  gender?: string;
  age?: string;
  publisherPlatform?: string;
  platformPosition?: string;
  impressionDevice?: string;
  carouselCardId?: string;
  productId?: string;
  placePageId?: string;
}

interface Account {
  id: string;
  name: string;
  status: 'active' | 'disconnected';
  business?: string;
  currency?: string;
}

interface ConnectedAccount {
  id: string;
  name: string;
  accessToken: string;
}

const DEFAULT_TEMPLATES: MetricTemplate[] = [
  {
    id: 'default_basic',
    name: 'Basic Metrics',
    metrics: new Set<keyof TopAdMetrics>(['spend', 'impressions', 'clicks', 'ctr', 'cpc'])
  },
  {
    id: 'default_conversion',
    name: 'Conversion Focus',
    metrics: new Set<keyof TopAdMetrics>(['spend', 'purchases', 'costPerPurchase', 'purchaseValue', 'purchaseRoas'])
  },
  {
    id: 'default_video',
    name: 'Video Performance',
    metrics: new Set<keyof TopAdMetrics>(['videoPlays', 'videoPlayRate', 'videoAvgTimeWatched', 'videoP25WatchedRate', 'videoP100WatchedRate'])
  }
];

interface DateRange {
  startDate: string;
  endDate: string;
}

interface TimeRangeOption {
  id: string;
  label: string;
  preset?: string;
  range?: DateRange;
}

const TIME_RANGES: TimeRangeOption[] = [
  { id: 'today', label: 'Today', preset: 'today' },
  { id: 'yesterday', label: 'Yesterday', preset: 'yesterday' },
  { id: 'last_7d', label: 'Last 7 Days', preset: 'last_7d' },
  { id: 'last_14d', label: 'Last 14 Days', preset: 'last_14d' },
  { id: 'last_28d', label: 'Last 28 Days', preset: 'last_28d' },
  { id: 'last_30d', label: 'Last 30 Days', preset: 'last_30d' },
  { id: 'last_90d', label: 'Last 90 Days', preset: 'last_90d' },
  { id: 'this_month', label: 'This Month', preset: 'this_month' },
  { id: 'last_month', label: 'Last Month', preset: 'last_month' },
  { id: 'this_quarter', label: 'This Quarter', preset: 'this_quarter' },
  { id: 'last_quarter', label: 'Last Quarter', preset: 'last_quarter' },
  { id: 'this_year', label: 'This Year', preset: 'this_year' },
  { id: 'last_year', label: 'Last Year', preset: 'last_year' },
  { id: 'custom', label: 'Custom Range', preset: undefined }
];

const POPULAR_TEMPLATES: MetricTemplate[] = [
  {
    id: 'popular_performance',
    name: 'Performance Overview',
    metrics: new Set<keyof TopAdMetrics>(['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'purchases', 'purchaseRoas'])
  },
  {
    id: 'popular_engagement',
    name: 'Engagement Focus',
    metrics: new Set<keyof TopAdMetrics>(['impressions', 'postEngagement', 'postReactions', 'postComments', 'postShares', 'linkClicks'])
  },
  {
    id: 'popular_video',
    name: 'Video Completion',
    metrics: new Set<keyof TopAdMetrics>(['videoPlays', 'videoP25WatchedRate', 'videoP50WatchedRate', 'videoP75WatchedRate', 'videoP100WatchedRate'])
  },
  {
    id: 'popular_conversion',
    name: 'Conversion Details',
    metrics: new Set<keyof TopAdMetrics>(['spend', 'purchases', 'costPerPurchase', 'purchaseValue', 'purchaseRoas'])
  }
];

interface BusinessManager {
  id: string;
  name: string;
  status: 'active' | 'disabled';
}

export default function TopAdsPage() {
  const { isAuthenticated, metaAccessToken, setMetaAuth, ensureInitialized } = useAuth();
  const router = useRouter();
  const [ads, setAds] = useState<TopAd[]>([]);
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(TIME_RANGES[2]); // Default to last 7 days
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedMetric, setSelectedMetric] = useState<keyof TopAdMetrics>('spend');
  const [showMetricDropdown, setShowMetricDropdown] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<keyof TopAdMetrics>>(
    new Set<keyof TopAdMetrics>(['spend', 'ctr'])
  );
  const [showGalleryDropdown, setShowGalleryDropdown] = useState(false);
  const [viewType, setViewType] = useState<'gallery' | 'bar' | 'stacked-bar' | 'line' | 'area'>('gallery');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TopAdMetrics | 'name';
    direction: 'asc' | 'desc';
  }>({
    key: 'spend',
    direction: 'desc'
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<string>('name');
  const [selectedMetricTimeframe, setSelectedMetricTimeframe] = useState<string>('daily');

  useEffect(() => {
    console.log('[TopAds] Initial render');
    console.log('[TopAds] Meta auth status:', isAuthenticated);
    console.log('[TopAds] Meta access token:', metaAccessToken?.substring(0, 10) + '...');

    const initializeConnection = async () => {
      try {
        // Check localStorage directly as a backup
        const storedToken = localStorage.getItem('metaAccessToken');
        console.log('[TopAds] Token in localStorage:', storedToken ? 'present' : 'missing');

        if (!isAuthenticated && storedToken) {
          console.log('[TopAds] Found token in localStorage but context not set, manually restoring');
          setMetaAuth(storedToken);
          return; // Let the next effect handle the connection check
        }

        if (isAuthenticated && metaAccessToken) {
          console.log('[TopAds] User is authenticated, checking Meta connection...');
          await checkMetaConnection();
        } else {
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('[TopAds] Failed to initialize connection:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize connection');
        setIsLoading(false);
      }
    };

    initializeConnection();
  }, [isAuthenticated, metaAccessToken]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchAdAccounts(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    if (selectedAccounts.length > 0 && timeRange) {
      console.log('[TopAds] Fetching data with time range:', timeRange);
      setIsLoading(true);
      fetchTopAds()
        .catch(error => {
          console.error('[TopAds] Error fetching data:', error);
          setError(error instanceof Error ? error.message : 'Failed to fetch top ads');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [timeRange, selectedAccounts]);

  const fetchAdAccounts = async (businessId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to fetch client ad accounts first
      const clientAccountsResponse = await makeGraphRequest(`/${businessId}/client_ad_accounts`, {
        fields: 'id,name,account_status,business,currency,account_id'
      }, metaAccessToken!);

      if (clientAccountsResponse.data && clientAccountsResponse.data.length > 0) {
        handleAccountsResponse(clientAccountsResponse);
      } else {
        // If no client accounts, try owned accounts
        console.log('[TopAds] No client accounts found, trying owned accounts...');
        const ownedAccountsResponse = await makeGraphRequest(`/${businessId}/owned_ad_accounts`, {
          fields: 'id,name,account_status,business,currency,account_id'
        }, metaAccessToken!);

        if (ownedAccountsResponse.data && ownedAccountsResponse.data.length > 0) {
          handleAccountsResponse(ownedAccountsResponse);
        } else {
          throw new Error('No ad accounts found in this business manager.');
        }
      }
    } catch (error) {
      console.error('[TopAds] Failed to fetch ad accounts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ad accounts');
      setAccounts([]);
      setSelectedAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkMetaConnection = async () => {
    try {
      console.log('[TopAds] Checking Meta connection...');
      setIsLoading(true);
      setError(null);
      
      if (!metaAccessToken) {
        throw new Error('No access token available');
      }

      // Ensure SDK is initialized before making any API calls
      await ensureInitialized();
      console.log('[TopAds] SDK initialization confirmed');

      // First, check for business manager access
      const businessResponse = await makeGraphRequest('/me/businesses', {
        fields: 'id,name,verification_status,is_disabled,permitted_tasks,client_ad_account_count'
      }, metaAccessToken);
      
      console.log('[TopAds] Business managers response:', businessResponse);
      
      if (!businessResponse.data || businessResponse.data.length === 0) {
        throw new Error('No business manager accounts found. Please ensure you have access to a Business Manager.');
      }

      // Get all business accounts that aren't disabled
      const availableBusinesses = businessResponse.data.map((business: any) => ({
        id: business.id,
        name: business.name,
        status: business.is_disabled ? 'disabled' : 'active'
      }));

      setBusinessManagers(availableBusinesses);

      const activeBusinesses = availableBusinesses.filter((b: BusinessManager) => b.status === 'active');
      if (activeBusinesses.length === 0) {
        throw new Error('No active business managers found. Please ensure you have access to an active Business Manager.');
      }

      // Set the first active business as selected
      const firstActiveBusiness = activeBusinesses[0];
      setSelectedBusinessId(firstActiveBusiness.id);
      
    } catch (error: any) {
      console.error('[TopAds] Meta connection check failed:', error);
      if (error.code === 190) {
        // Token expired or invalid, clear auth
        localStorage.removeItem('metaAccessToken');
        setMetaAuth('');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountsResponse = (response: any) => {
    const accounts = response.data.map((account: any) => ({
      id: account.id || account.account_id,
      name: account.name,
      status: account.account_status === 1 ? 'active' : 'disconnected',
      business: account.business?.name,
      currency: account.currency
    }));
    
    const activeAccounts = accounts.filter((account: Account) => account.status === 'active');
    console.log('[TopAds] Found active accounts:', activeAccounts);
    
    setAccounts(activeAccounts);
    
    if (activeAccounts.length > 0) {
      setSelectedAccounts([activeAccounts[0].id]);
    } else {
      setError('No active ad accounts found');
    }
    
    setIsLoading(false);
  };

  const fetchTopAds = async () => {
    if (!metaAccessToken || !selectedAccounts.length) {
      console.error('No access token or selected accounts');
      setError('Authentication or account selection required');
      return;
    }

    setError(null);
    try {
      console.log('[TopAds] Fetching data with time range:', timeRange);
      
      // Determine date parameters based on timeRange
      let dateParams = {};
      if (timeRange.id === 'custom' && timeRange.range) {
        dateParams = {
          since: timeRange.range.startDate,
          until: timeRange.range.endDate
        };
      } else if (timeRange.preset) {
        dateParams = {
          date_preset: timeRange.preset
        };
      } else {
        dateParams = {
          date_preset: 'last_30d'
        };
      }
      
      // Construct insights fields properly
      const insightsFields = [
        'spend',
        'impressions',
        'reach',
        'frequency',
        'clicks',
        'ctr',
        'cpc',
        'cpp',
        'actions',
        'action_values',
        'cost_per_action_type',
        'video_p25_watched_actions',
        'video_p50_watched_actions',
        'video_p75_watched_actions',
        'video_p95_watched_actions',
        'video_p100_watched_actions',
        'video_avg_time_watched_actions',
        'video_play_actions',
        'video_play_curve_actions'
      ].join(',');
      
      const fields = [
        'id',
        'name',
        'campaign{name}',
        'creative{thumbnail_url}',
        `insights.${timeRange.id === 'custom' ? `since(${timeRange.range?.startDate}).until(${timeRange.range?.endDate})` : `date_preset(${timeRange.preset || 'last_30d'})`}{${insightsFields}}`
      ].join(',');

      console.log('[TopAds] Query fields:', fields);
      console.log('[TopAds] Date parameters:', dateParams);

      const adsPromises = selectedAccounts.map(accountId => 
        makeGraphRequest(`/${accountId}/ads`, {
          fields,
          limit: 50,
          status: ['ACTIVE', 'PAUSED']
        }, metaAccessToken)
      );

      const responses = await Promise.all(adsPromises);
      console.log('[TopAds] Ad responses:', responses);

      const allAds = responses.flatMap(response => response.data || []);
      console.log('[TopAds] All ads:', allAds);

      const transformedAds = allAds.map(ad => {
        const insights = ad.insights?.data?.[0] || {};
        const actions = insights.actions || [];
        const actionValues = insights.action_values || [];

        const getActionValue = (actionType: string) => 
          actions.find((a: any) => a.action_type === actionType)?.value || 0;
        
        const getActionRate = (actionType: string) =>
          parseFloat(getActionValue(actionType)) / parseFloat(insights.impressions || 1);

        return {
          id: ad.id,
          name: ad.name,
          campaignName: ad.campaign?.name || '',
          thumbnailUrl: ad.creative?.thumbnail_url || '',
          metrics: {
            // Cost metrics
            spend: parseFloat(insights.spend || 0),
            cpc: parseFloat(insights.cpc || 0),
            cpm: parseFloat(insights.cpm || 0),
            cpp: parseFloat(insights.cpp || 0),
            costPerInlineLinkClick: parseFloat(insights.cost_per_action_type?.find((a: any) => a.action_type === 'link_click')?.value || 0),
            costPerEstimatedAdRecallers: parseFloat(insights.cost_per_action_type?.find((a: any) => a.action_type === 'ad_recall')?.value || 0),
            costPerThruplay: parseFloat(insights.cost_per_action_type?.find((a: any) => a.action_type === 'thruplay')?.value || 0),

            // Performance metrics
            impressions: parseInt(insights.impressions || 0),
            reach: parseInt(insights.reach || 0),
            frequency: parseFloat(insights.frequency || 0),
            clicks: parseInt(insights.clicks || 0),
            uniqueClicks: parseInt(insights.unique_clicks || 0),
            ctr: parseFloat(insights.ctr || 0),
            uniqueCtr: parseFloat(insights.unique_ctr || 0),
            estimatedAdRecallRate: parseFloat(insights.estimated_ad_recall_rate || 0),
            estimatedAdRecallers: parseInt(insights.estimated_ad_recallers || 0),

            // Engagement metrics
            postEngagement: getActionValue('post_engagement'),
            postReactions: getActionValue('post_reaction'),
            postComments: getActionValue('comment'),
            postShares: getActionValue('post'),
            linkClicks: getActionValue('link_click'),
            outboundClicks: parseInt(insights.outbound_clicks || 0),
            outboundClicksCtr: parseFloat(insights.outbound_clicks_ctr || 0),
            pageEngagement: getActionValue('page_engagement'),
            pageLikes: parseInt(insights.page_likes || 0),

            // Video metrics
            videoPlays: getActionValue('video_play'),
            videoPPlays: getActionValue('video_view'),
            videoPlayRate: getActionRate('video_play'),
            videoAvgTimeWatched: parseFloat(insights.video_avg_time_watched_actions?.[0]?.value || 0),
            videoP25WatchedRate: getActionRate('video_p25_watched_actions'),
            videoP50WatchedRate: getActionRate('video_p50_watched_actions'),
            videoP75WatchedRate: getActionRate('video_p75_watched_actions'),
            videoP95WatchedRate: getActionRate('video_p95_watched_actions'),
            videoP100WatchedRate: getActionRate('video_p100_watched_actions'),
            videoContinuous2SecWatched: parseInt(insights.video_continuous_2_sec_watched_actions?.[0]?.value || 0),
            videoThruplayWatched: parseInt(insights.video_thruplay_watched_actions?.[0]?.value || 0),

            // Conversion metrics
            purchases: getActionValue('purchase'),
            costPerPurchase: parseFloat(insights.spend || 0) / getActionValue('purchase'),
            purchaseValue: parseFloat(actionValues.find((a: any) => a.action_type === 'purchase')?.value || 0),
            purchaseRoas: parseFloat(actionValues.find((a: any) => a.action_type === 'purchase')?.value || 0) / parseFloat(insights.spend || 1),
            addToCart: getActionValue('add_to_cart'),
            costPerAddToCart: parseFloat(insights.spend || 0) / getActionValue('add_to_cart'),
            checkouts: getActionValue('checkout'),
            costPerCheckout: parseFloat(insights.spend || 0) / getActionValue('checkout'),

            // Lead Generation
            leads: getActionValue('lead'),
            costPerLead: parseFloat(insights.spend || 0) / getActionValue('lead'),
            registrations: getActionValue('registration'),
            costPerRegistration: parseFloat(insights.spend || 0) / getActionValue('registration'),

            // Custom Conversions
            customConversions: getActionValue('custom_conversion'),
            costPerCustomConversion: parseFloat(insights.spend || 0) / getActionValue('custom_conversion'),
            uniqueConversions: getActionValue('unique_conversion'),
            costPerUniqueConversion: parseFloat(insights.spend || 0) / getActionValue('unique_conversion'),

            // Mobile App
            mobileAppInstalls: getActionValue('app_install'),
            costPerMobileAppInstall: parseFloat(insights.spend || 0) / getActionValue('app_install'),
            mobileAppActions: getActionValue('app_action'),
            costPerMobileAppAction: parseFloat(insights.spend || 0) / getActionValue('app_action'),

            // Messaging
            messagingConversationsStarted: getActionValue('messaging_conversation_started'),
            costPerMessagingConversationStarted: parseFloat(insights.spend || 0) / getActionValue('messaging_conversation_started'),
            messagingReplies: getActionValue('messaging_reply'),

            // Cross-Device
            crossDeviceConversions: getActionValue('cross_device_conversion'),
            crossDevicePurchases: getActionValue('cross_device_purchase')
          }
        };
      });

      console.log('[TopAds] Transformed ads:', transformedAds);
      setAds(transformedAds);
    } catch (err) {
      console.error('Failed to fetch top ads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch top ads');
    }
  };

  const formatMetric = (value: number | { [key: string]: number } | undefined, type: 'currency' | 'percentage' | 'number' | 'time' = 'number') => {
    if (value === undefined) return '-';
    if (typeof value === 'object') return '-'; // Skip object values for now
    
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value);
    }
    if (type === 'percentage') {
      return `${(value * 100).toFixed(2)}%`;
    }
    if (type === 'time') {
      const seconds = Math.floor(value);
      return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return new Intl.NumberFormat('en-US').format(value);
  };

  const handleDirectLogin = async () => {
    try {
      console.log('[TopAds] Attempting direct login');
      const authResponse = await performFacebookLogin(
        'email,ads_management,ads_read,business_management,public_profile,business_data_access'
      );
      console.log('[TopAds] Facebook login successful:', authResponse);
      
      if (authResponse.accessToken) {
        localStorage.setItem('metaAccessToken', authResponse.accessToken);
        setMetaAuth(authResponse.accessToken);
        setIsLoading(true);
        await checkMetaConnection();
      }
    } catch (error) {
      console.error('[TopAds] Direct login failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to login with Facebook');
    }
  };

  const handleAddMetric = (metricKey: keyof TopAdMetrics) => {
    const newMetrics = new Set<keyof TopAdMetrics>(selectedMetrics);
    if (newMetrics.has(metricKey)) {
      newMetrics.delete(metricKey);
    } else {
      newMetrics.add(metricKey);
    }
    setSelectedMetrics(newMetrics);
  };

  const handleRemoveMetric = (metric: keyof TopAdMetrics) => {
    const newMetrics = new Set<keyof TopAdMetrics>(selectedMetrics);
    newMetrics.delete(metric);
    if (newMetrics.size === 0) {
      newMetrics.add('spend'); // Always keep at least one metric
    }
    setSelectedMetrics(newMetrics);
  };

  const toggleGroup = (groupLabel: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupLabel)) {
      newCollapsed.delete(groupLabel);
    } else {
      newCollapsed.add(groupLabel);
    }
    setCollapsedGroups(newCollapsed);
  };

  const renderChartView = () => {
    const chartData = [...ads]
      .sort((a, b) => b.metrics[selectedMetric] - a.metrics[selectedMetric])
      .slice(0, 10)
      .map(ad => {
        const formattedMetrics = Array.from(selectedMetrics).reduce((acc, metric) => {
          const metricDef = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metric);
          let value = ad.metrics[metric];
          
          // Format the value based on metric type
          if (metricDef?.type === 'percentage') {
            value = value * 100; // Convert to actual percentage for charts
          }
          
          return {
            ...acc,
            [metric]: value,
            [`${metric}_formatted`]: formatMetric(value, metricDef?.type)
          };
        }, {});

        return {
          name: ad.name.length > 20 ? ad.name.substring(0, 20) + '...' : ad.name,
          ...formattedMetrics
        };
      });

    const colors = ['#60A5FA', '#34D399', '#F87171', '#FBBF24', '#A78BFA', '#EC4899', '#8B5CF6', '#14B8A6'];
    const commonProps = {
      margin: { top: 30, right: 30, left: 60, bottom: 60 }
    };
    
    switch (viewType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => {
                  const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === Array.from(selectedMetrics)[0]);
                  if (metric?.type === 'currency') return `$${value.toLocaleString()}`;
                  if (metric?.type === 'percentage') return `${value.toFixed(1)}%`;
                  return value.toLocaleString();
                }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '6px' }}
                labelStyle={{ color: '#F3F4F6' }}
                itemStyle={{ color: '#F3F4F6' }}
                formatter={(value: any, name: string) => {
                  const metricKey = name.replace('_formatted', '');
                  const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metricKey);
                  return [formatMetric(value, metric?.type), metric?.label || name];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {Array.from(selectedMetrics).map((metric, index) => {
                const metricDef = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metric);
                return (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    fill={colors[index % colors.length]}
                    name={metricDef?.label || metric}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'stacked-bar':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chartData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '6px' }}
                labelStyle={{ color: '#F3F4F6' }}
                itemStyle={{ color: '#F3F4F6' }}
                formatter={(value: any, name: string) => {
                  const metricKey = name.replace('_formatted', '');
                  const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metricKey);
                  return [formatMetric(value, metric?.type), metric?.label || name];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {Array.from(selectedMetrics).map((metric, index) => {
                const metricDef = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metric);
                return (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    stackId="a"
                    fill={colors[index % colors.length]}
                    name={metricDef?.label || metric}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chartData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => {
                  const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === Array.from(selectedMetrics)[0]);
                  if (metric?.type === 'currency') return `$${value.toLocaleString()}`;
                  if (metric?.type === 'percentage') return `${value.toFixed(1)}%`;
                  return value.toLocaleString();
                }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '6px' }}
                labelStyle={{ color: '#F3F4F6' }}
                itemStyle={{ color: '#F3F4F6' }}
                formatter={(value: any, name: string) => {
                  const metricKey = name.replace('_formatted', '');
                  const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metricKey);
                  return [formatMetric(value, metric?.type), metric?.label || name];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {Array.from(selectedMetrics).map((metric, index) => {
                const metricDef = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metric);
                return (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={colors[index % colors.length]}
                    name={metricDef?.label || metric}
                    dot={{ fill: colors[index % colors.length] }}
                    strokeWidth={2}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <AreaChart data={chartData} {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => {
                  const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === Array.from(selectedMetrics)[0]);
                  if (metric?.type === 'currency') return `$${value.toLocaleString()}`;
                  if (metric?.type === 'percentage') return `${value.toFixed(1)}%`;
                  return value.toLocaleString();
                }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '6px' }}
                labelStyle={{ color: '#F3F4F6' }}
                itemStyle={{ color: '#F3F4F6' }}
                formatter={(value: any, name: string) => {
                  const metricKey = name.replace('_formatted', '');
                  const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metricKey);
                  return [formatMetric(value, metric?.type), metric?.label || name];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              {Array.from(selectedMetrics).map((metric, index) => {
                const metricDef = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metric);
                return (
                  <Area
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stackId="1"
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    name={metricDef?.label || metric}
                    fillOpacity={0.3}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'gallery':
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...ads]
              .sort((a, b) => b.metrics[selectedMetric] - a.metrics[selectedMetric])
              .slice(0, 10)
              .map((ad) => (
                <div key={ad.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                  <img
                    src={ad.thumbnailUrl || '/placeholder-ad.png'}
                    alt={ad.name}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-white truncate">{ad.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{ad.campaignName}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === selectedMetric)?.label || selectedMetric}
                      </span>
                      <span className="text-xs font-medium text-white">
                        {formatMetric(
                          ad.metrics[selectedMetric],
                          METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === selectedMetric)?.type || 'number'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        );
    }
  };

  const handleDateRangeChange = (selectedRange: TimeRangeOption) => {
    console.log('[TopAds] Date range changed:', selectedRange);
    setTimeRange(selectedRange);
    if (selectedRange.id === 'custom') {
      setShowDatePicker(true);
    }
  };

  const handleCustomDateApply = () => {
    const newTimeRange: TimeRangeOption = {
      id: 'custom',
      label: `${customDateRange.startDate} - ${customDateRange.endDate}`,
      range: customDateRange
    };
    console.log('[TopAds] Applying custom date range:', newTimeRange);
    setTimeRange(newTimeRange);
    setShowDatePicker(false);
  };

  const handleSort = (key: keyof TopAdMetrics | 'name') => {
    setSortConfig(currentSort => ({
      key,
      direction: currentSort.key === key && currentSort.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const sortData = (data: TopAd[]) => {
    // First group the data based on the selected groupBy option
    const groupedData = data.reduce((acc: { [key: string]: TopAd[] }, ad) => {
      let groupKey = '';
      switch (groupBy) {
        case 'name':
          groupKey = ad.name;
          break;
        case 'adset':
          groupKey = ad.adsetName || 'Unknown';
          break;
        case 'campaign':
          groupKey = ad.campaignName;
          break;
        case 'creative_media_type':
          groupKey = ad.creativeMediaType || 'Unknown';
          break;
        case 'platform':
          groupKey = ad.platform || 'Unknown';
          break;
        case 'placement':
          groupKey = ad.placement || 'Unknown';
          break;
        case 'device_platform':
          groupKey = ad.devicePlatform || 'Unknown';
          break;
        case 'country':
          groupKey = ad.country || 'Unknown';
          break;
        case 'gender':
          groupKey = ad.gender || 'Unknown';
          break;
        case 'age':
          groupKey = ad.age || 'Unknown';
          break;
        case 'publisher_platform':
          groupKey = ad.publisherPlatform || 'Unknown';
          break;
        case 'platform_position':
          groupKey = ad.platformPosition || 'Unknown';
          break;
        case 'impression_device':
          groupKey = ad.impressionDevice || 'Unknown';
          break;
        case 'carousel_card':
          groupKey = ad.carouselCardId || 'Unknown';
          break;
        case 'product':
          groupKey = ad.productId || 'Unknown';
          break;
        case 'place_page':
          groupKey = ad.placePageId || 'Unknown';
          break;
        default:
          groupKey = ad.name;
      }

      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(ad);
      return acc;
    }, {});

    // Calculate aggregated metrics for each group
    const aggregatedData = Object.entries(groupedData).map(([key, ads]) => {
      const aggregatedMetrics = ads.reduce((acc, ad) => {
        Object.entries(ad.metrics).forEach(([metricKey, value]) => {
          if (typeof value === 'number') {
            if (!acc[metricKey as keyof TopAdMetrics]) acc[metricKey as keyof TopAdMetrics] = 0;
            acc[metricKey as keyof TopAdMetrics] = (acc[metricKey as keyof TopAdMetrics] as number) + value;
          }
        });
        return acc;
      }, {} as TopAdMetrics);

      // Calculate averages for rate-based metrics
      const ratesToAverage: (keyof TopAdMetrics)[] = ['ctr', 'frequency', 'uniqueCtr', 'estimatedAdRecallRate', 'videoPlayRate'];
      ratesToAverage.forEach(rate => {
        if (aggregatedMetrics[rate]) {
          aggregatedMetrics[rate] = (aggregatedMetrics[rate] as number) / ads.length;
        }
      });

      return {
        id: key,
        name: key,
        campaignName: ads[0].campaignName,
        thumbnailUrl: ads[0].thumbnailUrl,
        metrics: aggregatedMetrics,
        adsCount: ads.length
      };
    });

    // Sort the aggregated data
    return aggregatedData.sort((a, b) => {
      if (sortConfig.key === 'name') {
        return sortConfig.direction === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      
      const aValue = a.metrics[sortConfig.key as keyof TopAdMetrics] || 0;
      const bValue = b.metrics[sortConfig.key as keyof TopAdMetrics] || 0;
      
      return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  // Update the table rendering to show the grouped data
  const renderTableBody = () => {
    return sortData(ads).map((group, index) => (
      <tr key={group.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <img className="h-10 w-10 rounded object-cover" src={group.thumbnailUrl || '/placeholder-ad.png'} alt="" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-white">{group.name}</div>
              <div className="text-sm text-gray-400">
                {groupBy === 'campaign' ? `${group.adsCount} ads` : group.campaignName}
                {group.adsCount > 1 && groupBy !== 'campaign' && ` • ${group.adsCount} ads`}
              </div>
            </div>
          </div>
        </td>
        {Array.from(selectedMetrics).map(metricKey => {
          const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metricKey);
          const value = group.metrics[metricKey as keyof TopAdMetrics];
          return (
            <td key={metricKey} className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm text-white">
                {formatMetric(value, metric?.type || 'number')}
              </div>
            </td>
          );
        })}
      </tr>
    ));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading ad data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">You need to connect to Meta Ads first</p>
            <button
              onClick={handleDirectLogin}
              className="px-4 py-2 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white rounded"
            >
              Login with Meta Directly
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-white">Top Ads</h1>
            <p className="mt-2 text-sm text-gray-400">
              The "Top Ads" report highlights your highest-spending ads with key performance metrics like CTR, Thumbspot ratio and ROAS. A common use-case would be to add your desired conversion conversion action to it.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center space-x-4">
          <div className="flex-1">
            <select
              value={selectedAccounts[0] || ''}
              onChange={(e) => setSelectedAccounts([e.target.value])}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              disabled={!selectedBusinessId || accounts.length === 0}
            >
              <option value="">Select Ad Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div className="flex space-x-2">
              <select
                value={timeRange.id}
                onChange={(e) => {
                  const selected = TIME_RANGES.find(r => r.id === e.target.value);
                  if (selected) {
                    handleDateRangeChange(selected);
                  }
                }}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                {TIME_RANGES.map((range) => (
                  <option key={range.id} value={range.id}>
                    {range.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowDatePicker(true)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white hover:bg-gray-700"
              >
                <CalendarIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value="name">Ad Name</option>
              <option value="adset">Ad Set</option>
              <option value="campaign">Campaign</option>
              <option value="creative_media_type">Media Type</option>
              <option value="platform">Platform</option>
              <option value="placement">Placement</option>
              <option value="device_platform">Device Platform</option>
              <option value="country">Country</option>
              <option value="gender">Gender</option>
              <option value="age">Age Range</option>
              <option value="publisher_platform">Publisher Platform</option>
              <option value="platform_position">Platform Position</option>
              <option value="impression_device">Impression Device</option>
              <option value="carousel_card">Carousel Card</option>
              <option value="product">Product</option>
              <option value="place_page">Business Location</option>
            </select>
          </div>
        </div>

        {/* New Metric Pills Section */}
        <div className="mt-4 border-b border-gray-700 pb-4">
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {Array.from(selectedMetrics).map(metricKey => {
              const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metricKey);
              return (
                <div 
                  key={metricKey}
                  className="flex items-center space-x-1 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-white">{metric?.label || metricKey}</span>
                  <button
                    onClick={() => handleRemoveMetric(metricKey)}
                    className="ml-2 text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <div className="relative">
              <button
                onClick={() => setShowMetricDropdown(!showMetricDropdown)}
                className="flex items-center space-x-1 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 text-sm text-white hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add metric</span>
              </button>

              {showMetricDropdown && (
                <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 max-h-[80vh] overflow-y-auto">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {METRIC_GROUPS.map(group => (
                      <div key={group.label}>
                        <button
                          onClick={() => toggleGroup(group.label)}
                          className="w-full px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-700 flex items-center justify-between"
                        >
                          <span>{group.label}</span>
                          <svg
                            className={`w-4 h-4 transform transition-transform ${
                              collapsedGroups.has(group.label) ? '' : 'rotate-180'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {!collapsedGroups.has(group.label) && (
                          <div className="border-l border-gray-700 ml-4">
                            {group.metrics.map(metric => (
                              <button
                                key={metric.key}
                                onClick={() => handleAddMetric(metric.key)}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 flex items-center space-x-3 ${
                                  selectedMetrics.has(metric.key) ? 'text-white' : 'text-gray-300'
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  <div className={`w-4 h-4 border rounded ${
                                    selectedMetrics.has(metric.key) 
                                      ? 'bg-blue-500 border-blue-500' 
                                      : 'border-gray-500'
                                  } flex items-center justify-center`}>
                                    {selectedMetrics.has(metric.key) && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <span>{metric.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowGalleryDropdown(!showGalleryDropdown)}
                className="flex items-center space-x-1 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5 text-sm text-white hover:bg-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Gallery</span>
              </button>

              {showGalleryDropdown && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white divide-y divide-gray-100">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-900 px-2 py-1">
                      Chart style
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setViewType('bar');
                          setShowGalleryDropdown(false);
                        }}
                        className="flex flex-col items-center p-2 rounded hover:bg-gray-50"
                      >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M20 18H4M20 6H4" />
                        </svg>
                        <span className="mt-1 text-xs text-gray-900">Bar</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewType('stacked-bar');
                          setShowGalleryDropdown(false);
                        }}
                        className="flex flex-col items-center p-2 rounded hover:bg-gray-50"
                      >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M20 18H4M20 6H4" />
                        </svg>
                        <span className="mt-1 text-xs text-gray-900">Stacked Bar</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewType('line');
                          setShowGalleryDropdown(false);
                        }}
                        className="flex flex-col items-center p-2 rounded hover:bg-gray-50"
                      >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
                        </svg>
                        <span className="mt-1 text-xs text-gray-900">Line</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewType('area');
                          setShowGalleryDropdown(false);
                        }}
                        className="flex flex-col items-center p-2 rounded hover:bg-gray-50"
                      >
                        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M7 19l3-3 3 3 4-4" />
                        </svg>
                        <span className="mt-1 text-xs text-gray-900">Area</span>
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setViewType('gallery');
                        setShowGalleryDropdown(false);
                      }}
                      className="mt-2 w-full flex items-center justify-center p-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="ml-2 text-xs text-gray-900">Gallery</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-400">Loading ads...</p>
                </div>
              ) : ads.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400">No ads found for the selected criteria</p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-4">
                  {renderChartView()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Updated Table Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <button className="text-sm text-gray-400 flex items-center hover:text-white">
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Change columns
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-between">
                      <span>Ad Name</span>
                      {sortConfig.key === 'name' && (
                        <span className="ml-2">
                          {sortConfig.direction === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </div>
                  </th>
                  {Array.from(selectedMetrics).map(metricKey => {
                    const metric = METRIC_GROUPS.flatMap(g => g.metrics).find(m => m.key === metricKey);
                    return (
                      <th 
                        key={metricKey} 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                        onClick={() => handleSort(metricKey)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{metric?.label || metricKey}</span>
                          {sortConfig.key === metricKey ? (
                            <span className="ml-2">
                              {sortConfig.direction === 'desc' ? '↓' : '↑'}
                            </span>
                          ) : null}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMetric(metricKey);
                            }}
                            className="ml-2 text-gray-500 hover:text-gray-300"
                          >
                            ×
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {renderTableBody()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {ads.length} results
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">1 - 20 of {ads.length}</span>
              <nav className="relative z-0 inline-flex -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-700 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700">
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Custom Date Range</h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                    max={customDateRange.endDate}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                    min={customDateRange.startDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomDateApply}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 