import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth(); 

  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !user) return;

    fetchRoomDetails();
    fetchMessages();

    let roomChannel: any;

    // 🚀 UPDATED: We made this an async function so we can fetch the user's real name first
    const initializeChat = async () => {
      // 1. Fetch this specific user's profile name
      
      const { data } = await supabase.from('profiles' as any).select('name').eq('id', user.id).single() as any;
      const displayName = data?.name || user.email?.split('@')[0] || 'Student';

      // 2. Connect to the room
      roomChannel = supabase.channel(`room_${id}`, {
        config: { presence: { key: user.id } },
      });

      roomChannel
        .on('presence', { event: 'sync' }, () => {
          const newState = roomChannel.presenceState();
          const onlineUsers = Object.values(newState).map((p: any) => p[0]);
          setParticipants(onlineUsers);
        })
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'study_room_messages',
          filter: `room_id=eq.${id}`
        }, () => {
          fetchMessages(); 
        })
        .subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            // 3. Broadcast the REAL name to everyone in the room!
            await roomChannel.track({
              user_id: user.id,
              name: displayName 
            });
          }
        });
    };

    initializeChat();

    return () => {
      if (roomChannel) supabase.removeChannel(roomChannel);
    };
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRoomDetails = async () => {
    const { data, error } = await supabase.from('study_rooms' as any).select('*').eq('id', id).single();
    if (error) console.error("Error fetching room:", error);
    if (data) setRoom(data);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('study_room_messages' as any)
      .select('*, profiles(name, avatar_url)')
      .eq('room_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Database fetch error:", error.message, error.details);
    } else if (data) {
      setMessages(data);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage;
    setNewMessage(''); 

    const { error } = await supabase.from('study_room_messages' as any).insert([
      { room_id: id, profile_id: user.id, content: messageText }
    ]);
    
    if (error) {
      console.error("Database insert error:", error);
      alert("Failed to send message. Check console for details.");
    }
  };

  if (!room) return <div className="min-h-screen bg-[#0B1120] text-white p-12 text-center">Loading Room...</div>;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col h-[85vh]">
        
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-400">{room.topic}</h1>
            <p className="text-sm text-slate-400 mt-1">Live Study Session</p>
          </div>
          <button 
            onClick={() => navigate('/rooms')}
            className="text-sm bg-red-600/10 text-red-500 font-medium hover:bg-red-600/20 px-5 py-2.5 rounded-lg transition"
          >
            Leave Room
          </button>
        </div>

        <div className="flex-1 flex gap-6 overflow-hidden">
          
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80">
              <h2 className="font-semibold text-slate-200">Room Discussion</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
              {messages.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">Say hi to start the conversation!</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.profile_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-slate-400 mb-1 ml-1 mr-1">
                        {isMe ? 'You' : (msg.profiles?.name || 'Student')}
                      </span>
                      <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm md:text-base ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-3">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..." 
                className="flex-1 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Send
              </button>
            </form>
          </div>

          <div className="w-64 bg-slate-900 border border-slate-800 rounded-xl flex-col hidden lg:flex overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80">
              <h2 className="font-semibold text-slate-200">Online ({participants.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {participants.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  {/* 🚀 UPDATED: Now displaying the name we passed to the tracker */}
                  <span className="text-slate-300 text-sm font-medium truncate">
                    {p.name || 'Anonymous Student'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}