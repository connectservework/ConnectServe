import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import { PostCard } from '../components/posts/PostCard';
import { Avatar } from '../components/common/Avatar';
import { VerifiedOrgBadge, RoleBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Search, Compass, Tag, Users, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTag = searchParams.get('tag') || '';
  const initialSearch = searchParams.get('search') || '';

  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [loading, setLoading] = useState(true);

  const POPULAR_TAGS = [
    'greenearth',
    'treeplanting',
    'zerohunger',
    'communityfirst',
    'education',
    'volunteering',
    'ecowarrior',
    'youthmentorship',
  ];

  const fetchExploreData = async () => {
    setLoading(true);
    try {
      const [postsRes, usersRes] = await Promise.all([
        postService.getExplore({ tag: selectedTag, search: searchQuery }),
        userService.searchUsers({ limit: 5 }),
      ]);
      if (postsRes.success) setPosts(postsRes.data?.posts || []);
      if (usersRes.success) setSuggestedUsers(usersRes.data?.users || []);
    } catch (err) {
      toast.error('Failed to load explore content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExploreData();
  }, [selectedTag, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchQuery, ...(selectedTag && { tag: selectedTag }) });
    fetchExploreData();
  };

  const handleTagClick = (tag) => {
    if (selectedTag === tag) {
      setSelectedTag('');
      setSearchParams(searchQuery ? { search: searchQuery } : {});
    } else {
      setSelectedTag(tag);
      setSearchParams({ tag, ...(searchQuery && { search: searchQuery }) });
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Compass className="w-4 h-4" /> Discover Community
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Explore Social Causes & Stories
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Search volunteering updates, find inspiring community leaders, and follow cause hashtags.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
          <input
            type="text"
            placeholder="Search keywords, stories, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        </form>

        {/* Popular Hashtags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Tag className="w-3.5 h-3.5" /> Trending Tags:
          </span>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors min-h-[38px] flex items-center ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested People & NGOs Bar */}
      {suggestedUsers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-card space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" /> Suggested Changemakers & NGOs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestedUsers.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u.username || u._id}`}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={u.avatar} size="sm" isOrg={u.role === 'organization'} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {u.name}
                      </span>
                      {u.role === 'organization' && (
                        <VerifiedOrgBadge isVerified={u.orgDetails?.isVerified} />
                      )}
                    </div>
                    <RoleBadge role={u.role} />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 hover:underline">
                  View
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Explore Posts Stream */}
      <div className="max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading explore stream...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 space-y-2">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-base text-slate-700 dark:text-slate-200">No posts found</h4>
            <p className="text-xs text-slate-400">Try clearing filters or searching for different topics.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};
