import type { NextPage } from 'next';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import AccountFilter from '@/components/AccountFilter';
import { makeGraphRequest, initializeFacebookSDK, performFacebookLogin } from '@/lib/facebook-sdk';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/layouts/DashboardLayout';

const DashboardLayoutComponent = dynamic(() => import('@/components/layouts/DashboardLayout'), {
  ssr: false
});

interface BusinessManager {
  id: string;
  name: string;
  status: 'active' | 'disabled';
}

interface Account {
  id: string;
  name: string;
  status: 'active' | 'disconnected';
  business?: string;
  currency?: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  reach: number;
  frequency: number;
  [key: string]: string | number;
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  campaignId: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  reach: number;
  frequency: number;
  [key: string]: string | number;
}

interface Ad {
  id: string;
  name: string;
  status: string;
  adsetId: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  reach: number;
  frequency: number;
  [key: string]: string | number;
}

interface TimeRange {
  id: string;
  label: string;
  preset?: string;
}

interface Template {
  id: string;
  name: string;
  metrics: MetricId[];
  timeRange: TimeRange;
  sortConfig: SortConfig;
  createdAt: string;
  description?: string;
  isDefault?: boolean;
}

// Define valid metric IDs
type MetricId = 
  | 'name' 
  | 'status' 
  | 'impressions' 
  | 'reach' 
  | 'frequency' 
  | 'quality_ranking' 
  | 'engagement_rate_ranking' 
  | 'conversion_rate_ranking'
  | 'spend'
  | 'cpm'
  | 'cpc'
  | 'cost_per_unique_click'
  | 'cost_per_inline_link_click'
  | 'cost_per_estimated_ad_recallers'
  | 'cost_per_thruplay'
  | 'clicks'
  | 'unique_clicks'
  | 'ctr'
  | 'unique_ctr'
  | 'inline_link_clicks'
  | 'inline_link_click_ctr'
  | 'outbound_clicks'
  | 'outbound_clicks_ctr'
  | 'estimated_ad_recall_rate'
  | 'estimated_ad_recallers'
  | 'inline_post_engagement'
  | 'page_engagement'
  | 'page_likes'
  | 'post_reactions'
  | 'post_comments'
  | 'post_shares'
  | 'conversions'
  | 'cost_per_conversion'
  | 'conversion_rate'
  | 'unique_conversions'
  | 'cost_per_unique_conversion'
  | 'custom_conversions'
  | 'cost_per_custom_conversion'
  | 'purchases'
  | 'cost_per_purchase'
  | 'purchase_value'
  | 'purchase_roas'
  | 'website_purchase_roas'
  | 'mobile_app_purchase_roas'
  | 'video_plays'
  | 'video_p25_watched_actions'
  | 'video_p50_watched_actions'
  | 'video_p75_watched_actions'
  | 'video_p100_watched_actions'
  | 'video_avg_time_watched_actions'
  | 'video_continuous_2_sec_watched_actions'
  | 'video_thruplay_watched_actions'
  | 'messaging_conversation_started'
  | 'cost_per_messaging_conversation_started'
  | 'messaging_replies'
  | 'mobile_app_installs'
  | 'cost_per_mobile_app_install'
  | 'mobile_app_actions'
  | 'cost_per_mobile_app_action'
  | 'cross_device_conversions'
  | 'cross_device_purchases'
  | 'auction_competitiveness'
  | 'auction_overlap'
  | 'delivery'
  | 'reach_estimate'
  | 'attribution_setting'
  | 'conversion_values'
  | 'action_values'
  | 'adds_to_cart'
  | 'checkouts'
  | 'leads'
  | 'registrations'
  | 'content_views'
  | 'searches'
  | 'add_to_wishlist';

interface Metric {
  id: MetricId;
  label: string;
  type: 'number' | 'currency' | 'percentage';
  category: typeof METRIC_CATEGORIES[number];
  isSelected: boolean;
  description?: string;
}

interface SortConfig {
  key: MetricId;
  direction: 'asc' | 'desc';
}

const METRIC_CATEGORIES = [
  'Basic Performance',
  'Cost & Budget',
  'Engagement',
  'Clicks & Actions',
  'Conversions',
  'Value & ROAS',
  'Video Engagement',
  'Messaging',
  'App Events',
  'Cross-Device',
  'Targeting & Delivery',
  'Attribution',
  'Meta Pixel Events'
] as const;

const AVAILABLE_METRICS: Metric[] = [
  // Basic Performance
  { id: 'name', label: 'Name', type: 'number', category: 'Basic Performance', isSelected: true },
  { id: 'status', label: 'Status', type: 'number', category: 'Basic Performance', isSelected: true },
  { id: 'impressions', label: 'Impressions', type: 'number', category: 'Basic Performance', isSelected: true },
  { id: 'reach', label: 'Reach', type: 'number', category: 'Basic Performance', isSelected: true },
  { id: 'frequency', label: 'Frequency', type: 'number', category: 'Basic Performance', isSelected: true },
  { id: 'quality_ranking', label: 'Quality Ranking', type: 'number', category: 'Basic Performance', isSelected: false },
  { id: 'engagement_rate_ranking', label: 'Engagement Rate Ranking', type: 'number', category: 'Basic Performance', isSelected: false },
  { id: 'conversion_rate_ranking', label: 'Conversion Rate Ranking', type: 'number', category: 'Basic Performance', isSelected: false },

  // Cost & Budget
  { id: 'spend', label: 'Amount Spent', type: 'currency', category: 'Cost & Budget', isSelected: true },
  { id: 'cpm', label: 'CPM (Cost per 1,000 Impressions)', type: 'currency', category: 'Cost & Budget', isSelected: false },
  { id: 'cpc', label: 'CPC (All)', type: 'currency', category: 'Cost & Budget', isSelected: true },
  { id: 'cost_per_unique_click', label: 'Cost per Unique Click', type: 'currency', category: 'Cost & Budget', isSelected: false },
  { id: 'cost_per_inline_link_click', label: 'Cost per Link Click', type: 'currency', category: 'Cost & Budget', isSelected: false },
  { id: 'cost_per_estimated_ad_recallers', label: 'Cost per Estimated Ad Recall Lift', type: 'currency', category: 'Cost & Budget', isSelected: false },
  { id: 'cost_per_thruplay', label: 'Cost per ThruPlay', type: 'currency', category: 'Cost & Budget', isSelected: false },

  // Engagement
  { id: 'clicks', label: 'Clicks (All)', type: 'number', category: 'Engagement', isSelected: true },
  { id: 'unique_clicks', label: 'Unique Clicks', type: 'number', category: 'Engagement', isSelected: false },
  { id: 'ctr', label: 'CTR (All)', type: 'percentage', category: 'Engagement', isSelected: true },
  { id: 'unique_ctr', label: 'Unique CTR', type: 'percentage', category: 'Engagement', isSelected: false },
  { id: 'inline_link_clicks', label: 'Link Clicks', type: 'number', category: 'Engagement', isSelected: false },
  { id: 'inline_link_click_ctr', label: 'Link Click-Through Rate', type: 'percentage', category: 'Engagement', isSelected: false },
  { id: 'outbound_clicks', label: 'Outbound Clicks', type: 'number', category: 'Engagement', isSelected: false },
  { id: 'outbound_clicks_ctr', label: 'Outbound CTR', type: 'percentage', category: 'Engagement', isSelected: false },
  { id: 'estimated_ad_recall_rate', label: 'Estimated Ad Recall Lift Rate', type: 'percentage', category: 'Engagement', isSelected: false },
  { id: 'estimated_ad_recallers', label: 'Estimated Ad Recall Lift', type: 'number', category: 'Engagement', isSelected: false },

  // Clicks & Actions
  { id: 'inline_post_engagement', label: 'Post Engagement', type: 'number', category: 'Clicks & Actions', isSelected: false },
  { id: 'page_engagement', label: 'Page Engagement', type: 'number', category: 'Clicks & Actions', isSelected: false },
  { id: 'page_likes', label: 'Page Likes', type: 'number', category: 'Clicks & Actions', isSelected: false },
  { id: 'post_reactions', label: 'Post Reactions', type: 'number', category: 'Clicks & Actions', isSelected: false },
  { id: 'post_comments', label: 'Post Comments', type: 'number', category: 'Clicks & Actions', isSelected: false },
  { id: 'post_shares', label: 'Post Shares', type: 'number', category: 'Clicks & Actions', isSelected: false },

  // Conversions
  { id: 'conversions', label: 'Total Conversions', type: 'number', category: 'Conversions', isSelected: false },
  { id: 'cost_per_conversion', label: 'Cost per Conversion', type: 'currency', category: 'Conversions', isSelected: false },
  { id: 'conversion_rate', label: 'Conversion Rate', type: 'percentage', category: 'Conversions', isSelected: false },
  { id: 'unique_conversions', label: 'Unique Conversions', type: 'number', category: 'Conversions', isSelected: false },
  { id: 'cost_per_unique_conversion', label: 'Cost per Unique Conversion', type: 'currency', category: 'Conversions', isSelected: false },
  { id: 'custom_conversions', label: 'Custom Conversions', type: 'number', category: 'Conversions', isSelected: false },
  { id: 'cost_per_custom_conversion', label: 'Cost per Custom Conversion', type: 'currency', category: 'Conversions', isSelected: false },

  // Value & ROAS
  { id: 'purchases', label: 'Purchases', type: 'number', category: 'Value & ROAS', isSelected: false },
  { id: 'cost_per_purchase', label: 'Cost per Purchase', type: 'currency', category: 'Value & ROAS', isSelected: false },
  { id: 'purchase_value', label: 'Purchase Value', type: 'currency', category: 'Value & ROAS', isSelected: false },
  { id: 'purchase_roas', label: 'Return on Ad Spend (ROAS)', type: 'number', category: 'Value & ROAS', isSelected: false },
  { id: 'website_purchase_roas', label: 'Website Purchase ROAS', type: 'number', category: 'Value & ROAS', isSelected: false },
  { id: 'mobile_app_purchase_roas', label: 'Mobile App Purchase ROAS', type: 'number', category: 'Value & ROAS', isSelected: false },

  // Video Engagement
  { id: 'video_plays', label: 'Video Plays', type: 'number', category: 'Video Engagement', isSelected: false },
  { id: 'video_p25_watched_actions', label: 'Video Plays at 25%', type: 'number', category: 'Video Engagement', isSelected: false },
  { id: 'video_p50_watched_actions', label: 'Video Plays at 50%', type: 'number', category: 'Video Engagement', isSelected: false },
  { id: 'video_p75_watched_actions', label: 'Video Plays at 75%', type: 'number', category: 'Video Engagement', isSelected: false },
  { id: 'video_p100_watched_actions', label: 'Video Plays at 100%', type: 'number', category: 'Video Engagement', isSelected: false },
  { id: 'video_avg_time_watched_actions', label: 'Average Video Play Time', type: 'number', category: 'Video Engagement', isSelected: false },
  { id: 'video_continuous_2_sec_watched_actions', label: 'Video 2-Second Continuous Views', type: 'number', category: 'Video Engagement', isSelected: false },
  { id: 'video_thruplay_watched_actions', label: 'ThruPlays', type: 'number', category: 'Video Engagement', isSelected: false },

  // Messaging
  { id: 'messaging_conversation_started', label: 'New Messaging Conversations', type: 'number', category: 'Messaging', isSelected: false },
  { id: 'cost_per_messaging_conversation_started', label: 'Cost per Messaging Conversation Started', type: 'currency', category: 'Messaging', isSelected: false },
  { id: 'messaging_replies', label: 'Messaging Replies', type: 'number', category: 'Messaging', isSelected: false },

  // App Events
  { id: 'mobile_app_installs', label: 'Mobile App Installs', type: 'number', category: 'App Events', isSelected: false },
  { id: 'cost_per_mobile_app_install', label: 'Cost per Mobile App Install', type: 'currency', category: 'App Events', isSelected: false },
  { id: 'mobile_app_actions', label: 'Mobile App Actions', type: 'number', category: 'App Events', isSelected: false },
  { id: 'cost_per_mobile_app_action', label: 'Cost per Mobile App Action', type: 'currency', category: 'App Events', isSelected: false },

  // Cross-Device
  { id: 'cross_device_conversions', label: 'Cross-Device Conversions', type: 'number', category: 'Cross-Device', isSelected: false },
  { id: 'cross_device_purchases', label: 'Cross-Device Purchases', type: 'number', category: 'Cross-Device', isSelected: false },

  // Targeting & Delivery
  { id: 'auction_competitiveness', label: 'Auction Competitiveness', type: 'number', category: 'Targeting & Delivery', isSelected: false },
  { id: 'auction_overlap', label: 'Auction Overlap', type: 'number', category: 'Targeting & Delivery', isSelected: false },
  { id: 'delivery', label: 'Ad Delivery', type: 'number', category: 'Targeting & Delivery', isSelected: false },
  { id: 'reach_estimate', label: 'Estimated Potential Reach', type: 'number', category: 'Targeting & Delivery', isSelected: false },

  // Attribution
  { id: 'attribution_setting', label: 'Attribution Setting', type: 'number', category: 'Attribution', isSelected: false },
  { id: 'conversion_values', label: 'Conversion Values', type: 'currency', category: 'Attribution', isSelected: false },
  { id: 'action_values', label: 'Action Values', type: 'currency', category: 'Attribution', isSelected: false },

  // Meta Pixel Events
  { id: 'adds_to_cart', label: 'Adds to Cart', type: 'number', category: 'Meta Pixel Events', isSelected: false },
  { id: 'checkouts', label: 'Initiated Checkouts', type: 'number', category: 'Meta Pixel Events', isSelected: false },
  { id: 'leads', label: 'Leads', type: 'number', category: 'Meta Pixel Events', isSelected: false },
  { id: 'registrations', label: 'Registrations', type: 'number', category: 'Meta Pixel Events', isSelected: false },
  { id: 'content_views', label: 'Content Views', type: 'number', category: 'Meta Pixel Events', isSelected: false },
  { id: 'searches', label: 'Searches', type: 'number', category: 'Meta Pixel Events', isSelected: false },
  { id: 'add_to_wishlist', label: 'Add to Wishlist', type: 'number', category: 'Meta Pixel Events', isSelected: false }
];

const TIME_RANGES: TimeRange[] = [
  { id: 'today', label: 'Today', preset: 'today' },
  { id: 'yesterday', label: 'Yesterday', preset: 'yesterday' },
  { id: 'last_7d', label: 'Last 7 Days', preset: 'last_7d' },
  { id: 'last_14d', label: 'Last 14 Days', preset: 'last_14d' },
  { id: 'last_28d', label: 'Last 28 Days', preset: 'last_28d' },
  { id: 'last_30d', label: 'Last 30 Days', preset: 'last_30d' },
  { id: 'this_month', label: 'This Month', preset: 'this_month' },
  { id: 'last_month', label: 'Last Month', preset: 'last_month' },
];

// Add Meta's default reporting templates
const DEFAULT_TEMPLATES = [
  {
    id: 'performance',
    name: 'Performance',
    description: 'Key metrics for campaign performance',
    metrics: ['name', 'status', 'spend', 'impressions', 'clicks', 'ctr', 'cpc', 'reach', 'frequency'],
    timeRange: TIME_RANGES[2], // Last 7 days
    sortConfig: { key: 'spend', direction: 'desc' },
    isDefault: true
  },
  {
    id: 'engagement',
    name: 'Engagement',
    description: 'Focus on user engagement metrics',
    metrics: ['name', 'status', 'clicks', 'unique_clicks', 'ctr', 'unique_ctr', 'inline_link_clicks', 'inline_link_click_ctr'],
    timeRange: TIME_RANGES[2],
    sortConfig: { key: 'clicks', direction: 'desc' },
    isDefault: true
  },
  {
    id: 'video',
    name: 'Video Performance',
    description: 'Detailed video engagement metrics',
    metrics: ['name', 'status', 'video_plays', 'video_plays_at_25_percent', 'video_plays_at_50_percent', 'video_plays_at_75_percent', 'video_plays_at_100_percent', 'video_avg_time_watched'],
    timeRange: TIME_RANGES[2],
    sortConfig: { key: 'video_plays', direction: 'desc' },
    isDefault: true
  },
  {
    id: 'conversion',
    name: 'Conversion Tracking',
    description: 'Focus on conversion and revenue metrics',
    metrics: [
      'name',
      'status',
      'spend',
      'purchases',
      'purchase_value',
      'purchase_roas',
      'adds_to_cart',
      'checkouts',
      'leads',
      'registrations'
    ],
    timeRange: TIME_RANGES[2],
    sortConfig: { key: 'spend', direction: 'desc' },
    isDefault: true
  }
] as const;

export default function AccountPerformancePage() {
  const { isAuthenticated, metaAccessToken, ensureInitialized, setMetaAuth } = useAuth();
  const router = useRouter();
  
  const [businessManagers, setBusinessManagers] = useState<BusinessManager[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());
  const [timeRange, setTimeRange] = useState(TIME_RANGES[2]); // Default to last 7 days
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [metrics, setMetrics] = useState<Metric[]>(AVAILABLE_METRICS);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [showLoadTemplateModal, setShowLoadTemplateModal] = useState(false);

  const [accountTotals, setAccountTotals] = useState<{
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    ctr: number;
    cpc: number;
    frequency: number;
  }>({
    spend: 0,
    impressions: 0,
    clicks: 0,
    reach: 0,
    ctr: 0,
    cpc: 0,
    frequency: 0
  });

  useEffect(() => {
    const initializeSDK = async () => {
      try {
        console.log("[Account Performance] Starting initialization...");
        console.log("[Account Performance] Auth state:", { isAuthenticated, hasToken: !!metaAccessToken });
        
        // Clear any stale token first
        if (!isAuthenticated) {
          localStorage.removeItem('metaAccessToken');
        }
        
        // Ensure SDK is initialized first
        await ensureInitialized();
        console.log("[Account Performance] SDK initialized");
        
        if (isAuthenticated && metaAccessToken) {
          console.log("[Account Performance] Checking Meta connection...");
          try {
            await checkMetaConnection();
            console.log("[Account Performance] Meta connection check successful");
          } catch (error: any) {
            console.error("[Account Performance] Meta connection check failed:", error);
            // Handle expired token
            if (error?.code === 190 || error?.message?.includes('Session has expired')) {
              console.log('[Account Performance] Token expired, refreshing authentication...');
              const success = await refreshMetaAuth();
              if (!success) {
                setError('Authentication failed. Please try logging in again.');
                setIsLoading(false);
                return;
              }
            } else {
              setError(error instanceof Error ? error.message : 'Failed to check Meta connection');
              setIsLoading(false);
            }
          }
        } else {
          console.log("[Account Performance] Not authenticated, showing connect button");
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[Account Performance] Initialization failed:', error);
        setError('Failed to initialize Meta SDK. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initializeSDK();
  }, [isAuthenticated, metaAccessToken, ensureInitialized]);

  useEffect(() => {
    if (isAuthenticated && metaAccessToken && !selectedBusinessId) {
      console.log("[Account Performance] Authenticated but no business selected, initializing connection...");
      initializeMetaConnection();
    }
  }, [isAuthenticated, metaAccessToken]);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchAdAccounts(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    if (selectedAccount && metaAccessToken) {
      console.log("[Account Performance] Data dependencies changed, fetching new data...", {
        timeRange,
        customDateRange,
        selectedAccount
      });
      
      // Only fetch if this is the initial load or if the account/token changed
      // Time range changes are handled by the direct handlers
      if (!campaigns.length || !adSets.length || !ads.length) {
        // Set loading state
        setIsLoading(true);
        
        // Fetch new data
        fetchAccountData()
          .catch(error => {
            console.error("[Account Performance] Error fetching data:", error);
            setError(error instanceof Error ? error.message : 'Failed to fetch data');
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [selectedAccount, metaAccessToken]);

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('reportingTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Save templates to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('reportingTemplates', JSON.stringify(templates));
  }, [templates]);

  const refreshMetaAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Wait for SDK to be ready first
      await ensureInitialized();
      
      // Clear any existing token state
      localStorage.removeItem('metaAccessToken');
      
      // Perform new login to get fresh token
      const authResponse = await performFacebookLogin(
        'business_management,ads_management,ads_read,public_profile,email'
      );
      
      if (!authResponse || !authResponse.accessToken) {
        throw new Error('Failed to refresh Meta authentication');
      }

      // Save the new token
      setMetaAuth(authResponse.accessToken);
      localStorage.setItem('metaAccessToken', authResponse.accessToken);

      // Verify the new token works
      await checkMetaConnection();
      
      return true;
    } catch (error) {
      console.error('Failed to refresh Meta authentication:', error);
      setError('Session expired. Please reconnect to Meta.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkMetaConnection = async () => {
    try {
      setIsLoading(true);
      
      // Verify token is valid first
      const response = await makeGraphRequest('/me', {
        fields: 'id,name'
      }, metaAccessToken!);

      if (!response || !response.id) {
        throw new Error('Invalid access token');
      }
      
      const businessResponse = await makeGraphRequest('/me/businesses', {
        fields: 'id,name,verification_status,is_disabled'
      }, metaAccessToken!);
      
      if (!businessResponse.data || businessResponse.data.length === 0) {
        throw new Error('No business manager accounts found.');
      }

      const availableBusinesses = businessResponse.data.map((business: any) => ({
        id: business.id,
        name: business.name,
        status: business.is_disabled ? 'disabled' : 'active'
      }));

      setBusinessManagers(availableBusinesses);
      setError(null);

      const activeBusinesses = availableBusinesses.filter((b: BusinessManager) => b.status === 'active');
      if (activeBusinesses.length > 0) {
        setSelectedBusinessId(activeBusinesses[0].id);
      }
    } catch (err: any) {
      console.error('Meta connection check failed:', err);
      // If token expired, throw the error to be handled by the caller
      if (err?.code === 190 || (err instanceof Error && err.message.includes('Session has expired'))) {
        throw err;
      }
      setError(err instanceof Error ? err.message : 'Failed to check Meta connection');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdAccounts = async (businessId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("[Meta Connect] Fetching ad accounts for business:", businessId);

      // Try client accounts first
      const clientAccountsResponse = await makeGraphRequest(`/${businessId}/client_ad_accounts`, {
        fields: 'id,name,account_status,business,currency,account_id,permitted_tasks'
      }, metaAccessToken!);

      console.log("[Meta Connect] Client accounts response:", clientAccountsResponse);

      let accounts = [];
      if (clientAccountsResponse.data && clientAccountsResponse.data.length > 0) {
        accounts = clientAccountsResponse.data;
      } else {
        // Try owned accounts if no client accounts
        const ownedAccountsResponse = await makeGraphRequest(`/${businessId}/owned_ad_accounts`, {
          fields: 'id,name,account_status,business,currency,account_id,permitted_tasks'
        }, metaAccessToken!);

        console.log("[Meta Connect] Owned accounts response:", ownedAccountsResponse);

        if (ownedAccountsResponse.data && ownedAccountsResponse.data.length > 0) {
          accounts = ownedAccountsResponse.data;
        }
      }

      if (accounts.length === 0) {
        throw new Error('No ad accounts found in this business manager.');
      }

      // Filter only for active accounts
      const accessibleAccounts = accounts
        .filter((account: any) => account.account_status === 1)
        .map((account: any) => ({
          id: account.id || account.account_id,
          name: account.name,
          status: 'active',
          business: account.business?.name,
          currency: account.currency
        }));

      if (accessibleAccounts.length === 0) {
        throw new Error('No active ad accounts found in this business manager.');
      }

      console.log("[Meta Connect] Processed accounts:", accessibleAccounts);

      setAccounts(accessibleAccounts);
      if (accessibleAccounts.length > 0) {
        setSelectedAccount(accessibleAccounts[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch ad accounts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch ad accounts');
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await ensureInitialized();

      // Get selected metric IDs excluding 'name' and 'status'
      const selectedInsightMetrics = metrics
        .filter(m => m.isSelected && m.id !== 'name' && m.id !== 'status')
        .map(m => m.id);

      // Base fields that we always want to fetch for accurate totals
      const baseFields = [
        'account_id',
        'account_name',
        'spend',
        'impressions',
        'reach',
        'frequency',
        'clicks',
        'ctr',
        'cpc',
        'actions',
        'action_values',
        'cost_per_action_type',
        'conversion_values',
        'conversion_rate_ranking',
        'purchase_roas',
        'outbound_clicks',
        'outbound_clicks_ctr',
        'unique_clicks',
        'unique_ctr',
        'cost_per_unique_click',
        'inline_link_clicks',
        'inline_link_click_ctr',
        'cost_per_inline_link_click'
      ];

      // Combine base fields with selected metrics and remove duplicates
      const fields = Array.from(new Set([...baseFields, ...selectedInsightMetrics])).join(',');

      // First fetch account level insights for accurate totals
      const accountInsightsResponse = await makeGraphRequest(`/${selectedAccount}/insights`, {
        fields: fields,
        [timeRange.id === 'custom' ? 'time_range' : 'date_preset']: timeRange.id === 'custom'
          ? { since: customDateRange.startDate, until: customDateRange.endDate }
          : timeRange.preset,
        level: 'account'
      }, metaAccessToken!);

      console.log("[Account Performance] Account level insights:", accountInsightsResponse);

      // Store account level totals
      const accountInsightsData = processInsightsData(accountInsightsResponse.data?.[0]);
      setAccountTotals({
        spend: parseFloat(accountInsightsData.spend?.toString() || '0'),
        impressions: parseInt(accountInsightsData.impressions?.toString() || '0'),
        clicks: parseInt(accountInsightsData.clicks?.toString() || '0'),
        reach: parseInt(accountInsightsData.reach?.toString() || '0'),
        ctr: parseFloat(accountInsightsData.ctr?.toString() || '0'),
        cpc: parseFloat(accountInsightsData.cpc?.toString() || '0'),
        frequency: parseFloat(accountInsightsData.frequency?.toString() || '0')
      });

      // Clear existing data before fetching new data
      setCampaigns([]);
      setAdSets([]);
      setAds([]);

      // Fetch campaigns with insights
      const campaignsResponse = await makeGraphRequest(`/${selectedAccount}/campaigns`, {
        fields: `id,name,status,objective,insights{${fields}}`,
        limit: 1000,
        [timeRange.id === 'custom' ? 'time_range' : 'date_preset']: timeRange.id === 'custom'
          ? { since: customDateRange.startDate, until: customDateRange.endDate }
          : timeRange.preset
      }, metaAccessToken!);

      console.log("[Account Performance] Campaign response:", campaignsResponse);

      // Process campaign data
      const processedCampaigns = campaignsResponse.data.map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        ...processInsightsData(campaign.insights?.data?.[0])
      }));
      setCampaigns(processedCampaigns);

      // Fetch ad sets with insights
      const adSetsResponse = await makeGraphRequest(`/${selectedAccount}/adsets`, {
        fields: `id,name,status,campaign_id,insights{${fields}}`,
        limit: 1000,
        [timeRange.id === 'custom' ? 'time_range' : 'date_preset']: timeRange.id === 'custom'
          ? { since: customDateRange.startDate, until: customDateRange.endDate }
          : timeRange.preset
      }, metaAccessToken!);

      // Process ad set data
      const processedAdSets = adSetsResponse.data.map((adset: any) => ({
        id: adset.id,
        name: adset.name,
        status: adset.status,
        campaignId: adset.campaign_id,
        ...processInsightsData(adset.insights?.data?.[0])
      }));
      setAdSets(processedAdSets);

      // Fetch ads with insights
      const adsResponse = await makeGraphRequest(`/${selectedAccount}/ads`, {
        fields: `id,name,status,adset_id,insights{${fields}}`,
        limit: 1000,
        [timeRange.id === 'custom' ? 'time_range' : 'date_preset']: timeRange.id === 'custom'
          ? { since: customDateRange.startDate, until: customDateRange.endDate }
          : timeRange.preset
      }, metaAccessToken!);

      // Process ads data
      const processedAds = adsResponse.data.map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        adsetId: ad.adset_id,
        ...processInsightsData(ad.insights?.data?.[0])
      }));
      setAds(processedAds);

    } catch (error) {
      console.error('Failed to fetch account data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch account data');
    } finally {
      setIsLoading(false);
    }
  };

  const processInsightsData = (insights: any) => {
    if (!insights) {
      return {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        reach: 0,
        frequency: 0,
        conversions: 0,
        cost_per_conversion: 0,
        conversion_rate: 0,
        purchases: 0,
        cost_per_purchase: 0,
        purchase_value: 0,
        purchase_roas: 0
      };
    }

    const processedData: { [key: string]: any } = {
      spend: parseFloat(insights.spend || '0'),
      impressions: parseInt(insights.impressions || '0'),
      clicks: parseInt(insights.clicks || '0'),
      ctr: parseFloat(insights.ctr || '0'),
      cpc: parseFloat(insights.cpc || '0'),
      reach: parseInt(insights.reach || '0'),
      frequency: parseFloat(insights.frequency || '0'),
      conversions: 0,
      cost_per_conversion: 0,
      conversion_rate: 0,
      purchases: 0,
      cost_per_purchase: 0,
      purchase_value: 0,
      purchase_roas: parseFloat(insights.purchase_roas?.[0]?.value || '0'),
      outbound_clicks: parseInt(insights.outbound_clicks || '0'),
      outbound_clicks_ctr: parseFloat(insights.outbound_clicks_ctr || '0'),
      unique_clicks: parseInt(insights.unique_clicks || '0'),
      unique_ctr: parseFloat(insights.unique_ctr || '0'),
      cost_per_unique_click: parseFloat(insights.cost_per_unique_click || '0'),
      inline_link_clicks: parseInt(insights.inline_link_clicks || '0'),
      inline_link_click_ctr: parseFloat(insights.inline_link_click_ctr || '0'),
      cost_per_inline_link_click: parseFloat(insights.cost_per_inline_link_click || '0')
    };

    // Process actions (conversions)
    if (insights.actions) {
      let totalConversions = 0;
      const actionMap = new Map();

      insights.actions.forEach((action: any) => {
        if (action.action_type) {
          const value = parseInt(action.value || '0');
          actionMap.set(action.action_type, value);
          
          // Sum up conversion actions using Meta's exact action types
          if ([
            'offsite_conversion.fb_pixel_purchase',
            'purchase',
            'offsite_conversion.fb_pixel_lead',
            'lead',
            'offsite_conversion.fb_pixel_complete_registration',
            'complete_registration',
            'offsite_conversion.fb_pixel_add_to_cart',
            'add_to_cart',
            'offsite_conversion.fb_pixel_initiate_checkout',
            'initiate_checkout',
            'mobile_app_install'
          ].includes(action.action_type)) {
            totalConversions += value;
          }

          // Map specific action types
          switch (action.action_type) {
            case 'offsite_conversion.fb_pixel_purchase':
            case 'purchase':
              processedData.purchases = (processedData.purchases || 0) + value;
              break;
            case 'offsite_conversion.fb_pixel_lead':
            case 'lead':
              processedData.leads = (processedData.leads || 0) + value;
              break;
            case 'offsite_conversion.fb_pixel_complete_registration':
            case 'complete_registration':
              processedData.registrations = (processedData.registrations || 0) + value;
              break;
            case 'offsite_conversion.fb_pixel_add_to_cart':
            case 'add_to_cart':
              processedData.adds_to_cart = (processedData.adds_to_cart || 0) + value;
              break;
            case 'offsite_conversion.fb_pixel_initiate_checkout':
            case 'initiate_checkout':
              processedData.checkouts = (processedData.checkouts || 0) + value;
              break;
          }
        }
      });

      processedData.conversions = totalConversions;

      // Calculate conversion rate
      if (processedData.impressions > 0) {
        processedData.conversion_rate = totalConversions / processedData.impressions;
      }

      // Calculate cost per conversion
      if (totalConversions > 0) {
        processedData.cost_per_conversion = processedData.spend / totalConversions;
      }

      // Calculate cost per purchase
      if (processedData.purchases > 0) {
        processedData.cost_per_purchase = processedData.spend / processedData.purchases;
      }
    }

    // Process action values (conversion values)
    if (insights.action_values) {
      insights.action_values.forEach((value: any) => {
        if (value.action_type) {
          switch (value.action_type) {
            case 'offsite_conversion.fb_pixel_purchase':
            case 'purchase':
              processedData.purchase_value = parseFloat(value.value || '0');
              break;
          }
        }
      });
    }

    // Process cost per action type
    if (insights.cost_per_action_type) {
      insights.cost_per_action_type.forEach((item: any) => {
        if (item.action_type) {
          switch (item.action_type) {
            case 'offsite_conversion.fb_pixel_purchase':
            case 'purchase':
              processedData.cost_per_purchase = parseFloat(item.value || '0');
              break;
            case 'offsite_conversion.fb_pixel_lead':
            case 'lead':
              processedData.cost_per_lead = parseFloat(item.value || '0');
              break;
          }
        }
      });
    }

    return processedData;
  };

  const formatMetric = (value: string | number, type: 'currency' | 'percentage' | 'number' = 'number') => {
    // Convert string to number if needed
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(numericValue);
    }
    if (type === 'percentage') {
      // CTR comes directly as decimal (e.g., 0.0327 for 3.27%)
      return `${(numericValue * 100).toFixed(2)}%`;
    }
    return new Intl.NumberFormat('en-US').format(numericValue);
  };

  const toggleCampaign = (campaignId: string) => {
    const newExpanded = new Set(expandedCampaigns);
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId);
    } else {
      newExpanded.add(campaignId);
    }
    setExpandedCampaigns(newExpanded);
  };

  const toggleAdSet = (adSetId: string) => {
    const newExpanded = new Set(expandedAdSets);
    if (newExpanded.has(adSetId)) {
      newExpanded.delete(adSetId);
    } else {
      newExpanded.add(adSetId);
    }
    setExpandedAdSets(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-400';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-400';
      case 'deleted':
      case 'archived':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const calculateTotals = () => {
    // Use account level totals instead of calculating from campaigns
    return accountTotals;
  };

  // Update the time range change handler
  const handleTimeRangeChange = async (selected: TimeRange) => {
    console.log("[Account Performance] Changing time range to:", selected);
    
    // Set loading state first
    setIsLoading(true);
    
    try {
      // Update time range state
      setTimeRange(selected);
      
      // Clear existing data
      setCampaigns([]);
      setAdSets([]);
      setAds([]);
      
      // Only fetch if we have an account and token
      if (selectedAccount && metaAccessToken) {
        await fetchAccountData();
      }
    } catch (error) {
      console.error("[Account Performance] Error fetching data:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Update the custom date range handler
  const handleCustomDateApply = async () => {
    const newTimeRange = {
      id: 'custom',
      label: `${customDateRange.startDate} - ${customDateRange.endDate}`,
      preset: undefined
    };
    console.log("[Account Performance] Applying custom date range:", newTimeRange);
    
    // Set loading state first
    setIsLoading(true);
    
    try {
      // Update time range state
      setTimeRange(newTimeRange);
      
      // Clear existing data
      setCampaigns([]);
      setAdSets([]);
      setAds([]);
      
      // Only fetch if we have an account and token
      if (selectedAccount && metaAccessToken) {
        await fetchAccountData();
      }
    } catch (error) {
      console.error("[Account Performance] Error fetching data:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setShowDatePicker(false);
    }
  };

  const initializeMetaConnection = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure SDK is initialized
      await ensureInitialized();

      // Perform OAuth login with specific business permissions
      const authResponse = await performFacebookLogin(
        'business_management,ads_management,ads_read,public_profile,email'
      );

      if (!authResponse || !authResponse.accessToken) {
        throw new Error('Failed to authenticate with Meta');
      }

      console.log("[Meta Connect] Got auth response:", { accessToken: authResponse.accessToken.substring(0, 10) + '...' });

      // Save the access token to context
      setMetaAuth(authResponse.accessToken);

      // First verify the user has access to any business assets
      const userResponse = await makeGraphRequest('/me/businesses', {
        fields: 'id,name,verification_status,is_disabled,permitted_tasks,business_users{role}'
      }, authResponse.accessToken);

      console.log("[Meta Connect] Business response:", userResponse);

      if (!userResponse.data || userResponse.data.length === 0) {
        throw new Error('No business manager accounts found. Please ensure you have access to a Business Manager.');
      }

      // Filter businesses that are not disabled
      const availableBusinesses = userResponse.data
        .filter((business: any) => !business.is_disabled)
        .map((business: any) => ({
          id: business.id,
          name: business.name,
          status: 'active'
        }));

      if (availableBusinesses.length === 0) {
        throw new Error('No active Business Manager accounts found. Please ensure you have access to an active Business Manager.');
      }

      setBusinessManagers(availableBusinesses);

      // If there's only one business manager, select it automatically
      if (availableBusinesses.length === 1) {
        setSelectedBusinessId(availableBusinesses[0].id);
        await fetchAdAccounts(availableBusinesses[0].id);
      }

      setError(null);
    } catch (error) {
      console.error('Failed to initialize Meta connection:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Meta Ads');
      setBusinessManagers([]);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new helper functions for sorting and metrics
  const sortData = (data: any[]) => {
    return [...data].sort((a, b) => {
      const key = sortConfig.key;
      if (key === 'name' || key === 'status') {
        return sortConfig.direction === 'asc' 
          ? String(a[key]).localeCompare(String(b[key]))
          : String(b[key]).localeCompare(String(a[key]));
      }
      const aValue = parseFloat(a[key]) || 0;
      const bValue = parseFloat(b[key]) || 0;
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });
  };

  const handleSort = (key: MetricId) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleMetric = (metricId: string) => {
    setMetrics(current =>
      current.map(metric =>
        metric.id === metricId
          ? { ...metric, isSelected: !metric.isSelected }
          : metric
      )
    );
  };

  const selectedMetrics = metrics.filter(metric => metric.isSelected);

  const saveTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate: Template = {
      id: Date.now().toString(),
      name: newTemplateName.trim(),
      metrics: metrics.filter(m => m.isSelected).map(m => m.id),
      timeRange,
      sortConfig,
      createdAt: new Date().toISOString()
    };

    setTemplates(prev => [...prev, newTemplate]);
    setNewTemplateName('');
    setShowTemplateModal(false);
  };

  const loadTemplate = async (template: Template) => {
    // Clear existing data first
    setCampaigns([]);
    setAdSets([]);
    setAds([]);
    
    setMetrics(prev =>
      prev.map(metric => ({
        ...metric,
        isSelected: template.metrics.includes(metric.id)
      }))
    );

    setTimeRange(template.timeRange);
    setSortConfig(template.sortConfig);
    setShowLoadTemplateModal(false);

    if (selectedAccount) {
      await fetchAccountData();
    }
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-4">Connect to Meta Ads</h2>
            <p className="text-gray-400 mb-6">Connect your Meta Ads account to view performance data</p>
            <button
              onClick={initializeMetaConnection}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                  Connecting...
                </>
              ) : (
                'Connect Meta Ads'
              )}
            </button>
            {error && <p className="mt-4 text-red-400">{error}</p>}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totals = calculateTotals();

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-white">Account Performance</h1>
            <p className="mt-2 text-sm text-gray-400">
              View performance data across campaigns, ad sets, and ads
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Business Manager
            </label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="">Select Business Manager</option>
              {businessManagers.map((business) => (
                <option 
                  key={business.id} 
                  value={business.id}
                  disabled={business.status === 'disabled'}
                >
                  {business.name} {business.status === 'disabled' ? '(Disabled)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Time Range
            </label>
            <div className="flex space-x-2">
              <select
                value={timeRange.id}
                onChange={async (e) => {
                  const selected = TIME_RANGES.find(r => r.id === e.target.value);
                  if (selected) {
                    await handleTimeRangeChange(selected);
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
                title="Choose custom date range"
              >
                <CalendarIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Ad Account
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            disabled={!selectedBusinessId}
          >
            <option value="">Select Ad Account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards with Buttons */}
        {!isLoading && selectedAccount && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400">Total Spend</h3>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatMetric(accountTotals.spend, 'currency')}
                </p>
              </div>
              <div className="relative">
                <select
                  onChange={async (e) => {
                    const template = [...DEFAULT_TEMPLATES, ...templates].find(t => t.id === e.target.value);
                    if (template) {
                      // Clear existing data first
                      setCampaigns([]);
                      setAdSets([]);
                      setAds([]);
                      
                      setMetrics(prev =>
                        prev.map(metric => ({
                          ...metric,
                          isSelected: template.metrics.includes(metric.id)
                        }))
                      );
                      setTimeRange(template.timeRange);
                      setSortConfig(template.sortConfig);
                      if (selectedAccount) {
                        await fetchAccountData();
                      }
                    }
                  }}
                  className="w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-white bg-gray-800 border-gray-700 focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select Report</option>
                  <optgroup label="Meta Templates">
                    {DEFAULT_TEMPLATES.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </optgroup>
                  {templates.length > 0 && (
                    <optgroup label="Saved Templates">
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400">Total Impressions</h3>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatMetric(accountTotals.impressions)}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400">CTR</h3>
              <p className="mt-2 text-2xl font-semibold text-white">
                {formatMetric(accountTotals.ctr, 'percentage')}
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400">CPC</h3>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {formatMetric(accountTotals.cpc, 'currency')}
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-400">Loading account data...</p>
          </div>
        ) : (
          <div className="mt-8 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      {selectedMetrics.map(metric => (
                        <th
                          key={metric.id}
                          scope="col"
                          className={`py-3.5 ${
                            metric.id === 'name' ? 'pl-4 pr-3 text-left' : 'px-3 text-right'
                          } text-sm font-semibold text-white cursor-pointer hover:text-blue-400`}
                          onClick={() => handleSort(metric.id)}
                        >
                          <div className="flex items-center justify-end">
                            {metric.label}
                            {sortConfig.key === metric.id && (
                              <span className="ml-2">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sortData(campaigns).map((campaign) => (
                      <React.Fragment key={campaign.id}>
                        <tr className="hover:bg-gray-800/50 cursor-pointer" onClick={() => toggleCampaign(campaign.id)}>
                          {selectedMetrics.map(metric => (
                            <td
                              key={`${campaign.id}-${metric.id}`}
                              className={`whitespace-nowrap py-4 ${
                                metric.id === 'name'
                                  ? 'pl-4 pr-3 text-sm font-medium text-white'
                                  : 'px-3 text-sm text-right text-gray-300'
                              }`}
                            >
                              {metric.id === 'name' ? (
                                <div className="flex items-center">
                                  <ChevronDownIcon
                                    className={`h-4 w-4 mr-2 transition-transform ${
                                      expandedCampaigns.has(campaign.id) ? 'transform rotate-180' : ''
                                    }`}
                                  />
                                  {campaign.name}
                                </div>
                              ) : metric.id === 'status' ? (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                  {campaign.status}
                                </span>
                              ) : (
                                formatMetric(campaign[metric.id], metric.type)
                              )}
                            </td>
                          ))}
                        </tr>
                        {expandedCampaigns.has(campaign.id) && adSets
                          .filter(adSet => adSet.campaignId === campaign.id)
                          .map(adSet => (
                            <React.Fragment key={adSet.id}>
                              <tr className="hover:bg-gray-800/50 cursor-pointer bg-gray-800/25" onClick={() => toggleAdSet(adSet.id)}>
                                {selectedMetrics.map(metric => (
                                  <td
                                    key={`${adSet.id}-${metric.id}`}
                                    className={`whitespace-nowrap py-4 ${
                                      metric.id === 'name'
                                        ? 'pl-4 pr-3 text-sm font-medium text-white'
                                        : 'px-3 text-sm text-right text-gray-300'
                                    }`}
                                  >
                                    {metric.id === 'name' ? (
                                      <div className="flex items-center pl-8">
                                        <ChevronDownIcon
                                          className={`h-4 w-4 mr-2 transition-transform ${
                                            expandedAdSets.has(adSet.id) ? 'transform rotate-180' : ''
                                          }`}
                                        />
                                        {adSet.name}
                                      </div>
                                    ) : metric.id === 'status' ? (
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(adSet.status)}`}>
                                        {adSet.status}
                                      </span>
                                    ) : (
                                      formatMetric(adSet[metric.id], metric.type)
                                    )}
                                  </td>
                                ))}
                              </tr>
                              {expandedAdSets.has(adSet.id) && ads
                                .filter(ad => ad.adsetId === adSet.id)
                                .map(ad => (
                                  <tr key={ad.id} className="hover:bg-gray-800/50 bg-gray-800/40">
                                    {selectedMetrics.map(metric => (
                                      <td
                                        key={`${ad.id}-${metric.id}`}
                                        className={`whitespace-nowrap py-4 ${
                                          metric.id === 'name'
                                            ? 'pl-4 pr-3 text-sm font-medium text-white'
                                            : 'px-3 text-sm text-right text-gray-300'
                                        }`}
                                      >
                                        {metric.id === 'name' ? (
                                          <div className="flex items-center pl-16">
                                            {ad.name}
                                          </div>
                                        ) : metric.id === 'status' ? (
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                                            {ad.status}
                                          </span>
                                        ) : (
                                          formatMetric(ad[metric.id], metric.type)
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                            </React.Fragment>
                          ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Custom Date Range Modal */}
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

        {/* Save Template Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Save Template</h3>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div className="text-sm text-gray-400">
                  This template will save:
                  <ul className="list-disc list-inside mt-2">
                    <li>Selected metrics ({metrics.filter(m => m.isSelected).length} columns)</li>
                    <li>Time range ({timeRange.label})</li>
                    <li>Sort settings ({sortConfig.key} - {sortConfig.direction})</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!newTemplateName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Template Modal */}
        {showLoadTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Load Template</h3>
                <button
                  onClick={() => setShowLoadTemplateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {templates.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No saved templates</p>
                ) : (
                  templates.map(template => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="text-white font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-400">
                          {template.metrics.length} metrics • {template.timeRange.label}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadTemplate(template)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowLoadTemplateModal(false)}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Selection Modal */}
        {showMetricsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Customize Columns</h3>
                <button
                  onClick={() => setShowMetricsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
                {METRIC_CATEGORIES.map(category => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-medium text-blue-400">{category}</h4>
                    <div className="space-y-2">
                      {metrics
                        .filter(metric => metric.category === category)
                        .map(metric => (
                          <div key={metric.id} className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                id={metric.id}
                                checked={metric.isSelected}
                                onChange={() => toggleMetric(metric.id)}
                                className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                              />
                            </div>
                            <div className="ml-3">
                              <label htmlFor={metric.id} className="text-sm text-white">
                                {metric.label}
                              </label>
                              {metric.description && (
                                <p className="text-xs text-gray-400">{metric.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end mb-4">
                <button
                  onClick={() => setMetrics(prev =>
                    prev.map(metric => ({ ...metric, isSelected: true }))
                  )}
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Select All
                </button>
                <button
                  onClick={() => setShowMetricsModal(false)}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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