 
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { toast } from 'sonner';

export default function StudyRooms() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<any[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel('study-rooms-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_rooms' },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('study_rooms' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRooms(data);
    }
  };

  const handleCreateRoom = async () => {
    if (!newTopic.trim() || !user) return;

    setLoading(true);

    const { error } = await supabase
      .from('study_rooms' as any)
      .insert([
        {
          topic: newTopic,
          created_by: user.id,
          is_private: isPrivate,
        },
      ]);

    if (!error) {
      setNewTopic('');
      setIsPrivate(false);
    } else {
      console.error('Error creating room:', error);
      toast.error('Failed to create room.');
    }

    setLoading(false);
  };

  /**
   * Join a public room using the RPC.
   * Private rooms are accessible only to their creator
   * or users explicitly invited.
   */
  const handleJoinRoom = async (room: any) => {
    if (!user) return;

    setJoiningRoomId(room.id);

    const { error } = await supabase.rpc('join_public_study_room', {
      p_room_id: room.id,
    });

    if (error) {
      console.error('Error joining room:', error);
      toast.error(error.message || 'Failed to join room.');
      setJoiningRoomId(null);
      return;
    }

    navigate(`/rooms/${room.id}`);
    setJoiningRoomId(null);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Rooms</h1>
          <p className="text-gray-400 mt-2">
            Create or join a topic-based room to learn with peers.
          </p>
        </div>

        {/* Create Room Section */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Create a New Room</h2>

          <div className="flex gap-3">
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Enter room topic (e.g., Data Structures, React.js)"
              className="flex-1 bg-slate-950 border border-slate-800 text-white p-3 rounded-lg focus:outline-none focus:border-blue-500 transition"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
            />

            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
              />
              Private Room
            </label>

            <button
              onClick={handleCreateRoom}
              disabled={loading || !newTopic.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </div>

        {/* Rooms List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {rooms.length === 0 ? (
              <p className="text-gray-500 col-span-2 bg-slate-900 p-8 rounded-xl text-center border border-slate-800 border-dashed">
                No rooms available right now. Be the first to create one!
              </p>
            ) : (
              rooms.map((room) => {
                const isJoining = joiningRoomId === room.id;
                const isOwner = user?.id === room.created_by;
                const canJoin = !room.is_private || isOwner;

                return (
                  <div
                    key={room.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition group flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-lg text-white group-hover:text-blue-400 transition">
                          {room.topic}
                        </h3>

                        {room.is_private && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            Private
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-500 mt-1">
                        Created{' '}
                        {new Date(room.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {canJoin ? (
                      <button
                        onClick={() => handleJoinRoom(room)}
                        disabled={isJoining}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isJoining ? 'Joining...' : 'Join'}
                      </button>
                    ) : (
                      <span className="px-4 py-2 text-sm text-slate-500 rounded-lg border border-slate-700 cursor-not-allowed select-none">
                        🔒 Invite only
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}