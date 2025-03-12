import { useState } from 'react';
import type { AdAccount, BusinessManager } from '@/types/meta';

interface AdAccountSelectorProps {
  businessManagers: BusinessManager[];
  onSelect: (selectedAccounts: AdAccount[]) => void;
  onClose: () => void;
}

export default function AdAccountSelector({ businessManagers, onSelect, onClose }: AdAccountSelectorProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  const selectedBusiness = businessManagers.find(bm => bm.id === selectedBusinessId);

  const handleAccountToggle = (accountId: string) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedAccounts(newSelected);
  };

  const handleSubmit = () => {
    if (!selectedBusiness) return;
    
    const selectedAdAccounts = selectedBusiness.adAccounts.filter(
      account => selectedAccounts.has(account.id)
    );
    
    onSelect(selectedAdAccounts);
  };

  // Handle empty state
  if (!businessManagers || businessManagers.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface p-6 rounded-xl max-w-2xl w-full mx-4">
          <h2 className="text-xl font-semibold text-white mb-4">
            No Ad Accounts Available
          </h2>
          <p className="text-gray-400 mb-6">
            No ad accounts were found in your business managers. Please make sure you have access to ad accounts and try again.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface p-6 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-white mb-4">
          Select Ad Accounts
        </h2>

        {/* Business Manager Selection */}
        {!selectedBusinessId ? (
          <div className="space-y-4">
            <p className="text-gray-400 mb-4">
              Choose a Business Manager to view available ad accounts:
            </p>
            {businessManagers.map(bm => (
              <button
                key={bm.id}
                onClick={() => setSelectedBusinessId(bm.id)}
                className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <h3 className="text-white font-medium">{bm.name}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {bm.adAccounts?.length || 0} ad accounts available
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div>
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedBusinessId(null);
                setSelectedAccounts(new Set());
              }}
              className="text-sm text-blue-400 hover:underline mb-4 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Business Managers
            </button>

            {/* Ad Accounts List */}
            <div className="space-y-3 mb-6">
              {selectedBusiness?.adAccounts?.map(account => (
                <label
                  key={account.id}
                  className="flex items-start p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.has(account.id)}
                    onChange={() => handleAccountToggle(account.id)}
                    className="mt-1 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="text-white font-medium">{account.name}</p>
                    {account.businessName && (
                      <p className="text-sm text-gray-400">{account.businessName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{account.currency}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        account.status.toLowerCase() === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {account.status}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 border-t border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          {selectedBusinessId && (
            <button
              onClick={handleSubmit}
              disabled={selectedAccounts.size === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect {selectedAccounts.size} Account{selectedAccounts.size !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 