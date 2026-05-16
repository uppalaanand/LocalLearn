import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { messageService } from '../services/dataServices';
import { socketService } from '../services/socketService';
import { Search, Send, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Conversation {
  user: {
    _id: string;
    name: string;
    avatar: string;
    role: string;
  };
  lastMessage: {
    text: string;
    createdAt: string;
    isRead: boolean;
    sender: string;
  };
  unreadCount: number;
}

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export default function Messages() {
  const { user } = useAuth();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation['user'] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    
    // Check if we navigated here with a specific user to chat with
    const queryParams = new URLSearchParams(location.search);
    const targetUserId = queryParams.get('userId');
    const targetUserName = queryParams.get('name');
    
    if (targetUserId) {
      setActiveChat({
        _id: targetUserId,
        name: targetUserName || 'User',
        avatar: '',
        role: ''
      });
      fetchMessages(targetUserId);
    }
  }, [location.search]);

  useEffect(() => {
    if (!user) return;
    
    const token = localStorage.getItem('accessToken');
    if (token) {
      socketService.connect(token);
      const socket = socketService.getSocket();
      
      if (socket) {
        socket.on('newDirectMessage', (message: Message) => {
          // If the message is for the active chat, append it
          if (activeChat && (message.sender === activeChat._id || message.receiver === activeChat._id)) {
            setMessages(prev => [...prev, message]);
            if (message.sender === activeChat._id) {
               messageService.markAsRead(activeChat._id);
            }
          }
          // Always refresh conversations to update last message and unread count
          fetchConversations();
        });
      }
    }
    
    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('newDirectMessage');
      }
    };
  }, [user, activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await messageService.getConversations();
      setConversations(res.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const res = await messageService.getDirectMessages(userId);
      setMessages(res.data);
      await messageService.markAsRead(userId);
      fetchConversations(); // refresh unread count
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectChat = (chatUser: Conversation['user']) => {
    setActiveChat(chatUser);
    fetchMessages(chatUser._id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('sendDirectMessage', {
        receiverId: activeChat._id,
        text: newMessage
      });
      setNewMessage('');
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading messages...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex h-[calc(100vh-120px)] min-h-[600px]">
      {/* Sidebar */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No conversations yet</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.user._id}
                onClick={() => handleSelectChat(conv.user)}
                className={`w-full p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors border-b border-gray-50 ${activeChat?._id === conv.user._id ? 'bg-indigo-50' : ''}`}
              >
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {conv.user.avatar ? (
                      <img src={conv.user.avatar} alt={conv.user.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-indigo-600" />
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{conv.user.name}</h3>
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                    {conv.lastMessage.sender === user?._id ? 'You: ' : ''}{conv.lastMessage.text}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`w-full md:w-2/3 flex flex-col bg-gray-50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-4">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-900"
              >
                ← Back
              </button>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                {activeChat.avatar ? (
                  <img src={activeChat.avatar} alt={activeChat.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-indigo-600" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{activeChat.name}</h3>
                <p className="text-xs text-gray-500 capitalize">{activeChat.role || 'User'}</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => {
                const isMine = msg.sender === user?._id;
                return (
                  <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none shadow-sm border border-gray-100'}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Send className="h-10 w-10 text-indigo-300" />
            </div>
            <p>Select a conversation or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
