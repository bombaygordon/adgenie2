import { useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface MetaAccount {
  id: string;
  name: string;
  businessName?: string;
  status: string;
  currency: string;
}

interface MetaAccountSelectorProps {
  accounts: MetaAccount[];
  onSelect: (selectedAccounts: MetaAccount[]) => void;
  onClose: () => void;
}

export default function MetaAccountSelector({
  accounts,
  onSelect,
  onClose,
}: MetaAccountSelectorProps) {
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  const toggleAccount = (account: MetaAccount) => {
    const newSelected = new Set(selectedAccounts);
    if (newSelected.has(account.id)) {
      newSelected.delete(account.id);
    } else {
      newSelected.add(account.id);
    }
    setSelectedAccounts(newSelected);
  };

  const handleConfirm = () => {
    const selectedAccountsList = accounts.filter(account => 
      selectedAccounts.has(account.id)
    );
    onSelect(selectedAccountsList);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Select Ad Accounts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Account List */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => toggleAccount(account)}
              >
                <div className="flex-1">
                  <h3 className="text-white font-medium">{account.name}</h3>
                  {account.businessName && (
                    <p className="text-sm text-gray-400">{account.businessName}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      account.status === 'active'
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {account.status}
                    </span>
                    <span className="text-xs text-gray-400">{account.currency}</span>
                  </div>
                </div>
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                  selectedAccounts.has(account.id)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-600'
                }`}>
                  {selectedAccounts.has(account.id) && (
                    <CheckIcon className="h-4 w-4 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedAccounts.size === 0}
            className="px-4 py-2 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect {selectedAccounts.size} {selectedAccounts.size === 1 ? 'Account' : 'Accounts'}
          </button>
        </div>
      </div>
    </div>
  );
} 