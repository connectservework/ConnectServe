import React, { useState } from 'react';
import { Avatar } from '../common/Avatar';
import { VerifiedOrgBadge } from '../common/Badge';
import { formatTimeAgo } from '../../utils/dateUtils';
import { Search } from 'lucide-react';

export const ChatList = ({
  conversations,
  activeConversation,
  onSelectConversation,
  currentUserId,
}) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((conv) => {
    const other = conv.participants.find(p => p._id !== currentUserId);
    if (!other) return false;
    return other.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
          Messages
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 italic">
            No conversations found.
          </div>
        ) : (
          filtered.map((conv) => {
            const other = conv.participants.find(p => p._id !== currentUserId);
            const isActive = activeConversation?._id === conv._id;

            return (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors min-h-[64px] ${
                  isActive
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Avatar
                  src={other?.avatar}
                  size="md"
                  isOrg={other?.role === 'organization'}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {other?.name || 'User'}
                      </span>
                      {other?.role === 'organization' && (
                        <VerifiedOrgBadge isVerified={other?.orgDetails?.isVerified} />
                      )}
                    </div>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {formatTimeAgo(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {conv.lastMessageText || 'Started a conversation'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
