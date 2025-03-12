import { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface Account {
  id: string;
  name: string;
  status: 'active' | 'disconnected';
}

interface AccountFilterProps {
  accounts: Account[];
  selectedAccounts: string[];
  onChange: (accountIds: string[]) => void;
  isDisabled?: boolean;
}

export default function AccountFilter({ accounts, selectedAccounts, onChange, isDisabled = false }: AccountFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleAccount = (accountId: string) => {
    if (isDisabled) return;
    const newSelected = selectedAccounts.includes(accountId)
      ? selectedAccounts.filter(id => id !== accountId)
      : [...selectedAccounts, accountId];
    onChange(newSelected);
  };

  const handleSelectAll = () => {
    if (isDisabled) return;
    onChange(accounts.map(account => account.id));
  };

  const handleClearAll = () => {
    if (isDisabled) return;
    onChange([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white flex items-center justify-between ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        disabled={isDisabled}
      >
        <span>
          {selectedAccounts.length === 0
            ? 'All Accounts'
            : `${selectedAccounts.length} Account${selectedAccounts.length !== 1 ? 's' : ''} Selected`}
        </span>
        <ChevronDownIcon className="w-5 h-5" />
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          <div className="p-2 border-b border-gray-700 flex justify-between">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Clear
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {accounts.map(account => (
              <label
                key={account.id}
                className="flex items-center p-2 hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedAccounts.includes(account.id)}
                  onChange={() => handleToggleAccount(account.id)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <p className="text-white text-sm">{account.name}</p>
                  <p className="text-xs text-gray-400">ID: {account.id}</p>
                </div>
                <span
                  className={`ml-auto text-xs px-2 py-1 rounded-full ${
                    account.status === 'active'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {account.status}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 