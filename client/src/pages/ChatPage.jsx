import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chatService';
import { ChatList } from '../components/chat/ChatList';
import { ChatWindow } from '../components/chat/ChatWindow';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const res = await chatService.getConversations();
      if (res.success && res.data) {
        setConversations(res.data.conversations || []);
        if (res.data.conversations?.length > 0 && !activeConversation) {
          // If desktop, select first conversation by default
          if (window.innerWidth >= 768) {
            setActiveConversation(res.data.conversations[0]);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden flex animate-fadeIn">
      {/* Sidebar List (hidden on mobile when chat is active) */}
      <div
        className={`w-full md:w-80 lg:w-96 h-full ${
          activeConversation ? 'hidden md:block' : 'block'
        }`}
      >
        <ChatList
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={(conv) => setActiveConversation(conv)}
          currentUserId={user?._id}
        />
      </div>

      {/* Main Chat Area */}
      <div
        className={`flex-1 h-full ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            currentUserId={user?._id}
            onBack={() => setActiveConversation(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="font-bold text-base text-slate-700 dark:text-slate-200">
              Direct Messages
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Select an organizer or volunteer from the left list to begin real-time messaging.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
