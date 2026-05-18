import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';

export default function StudyRooms() {
  const { user } = useAuth(); // Gets the currently logged-in user
  const navigate = useNavigate(); // Added for routing
  const [rooms, setRooms] = useState<any[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch rooms when the page loads and listen for real-time updates
  useEffect(() => {
    fetchRooms();

    // Subscribe to real-time database changes
    const channel = supabase
      .channel('study-rooms-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_rooms' }, () => {
        fetchRooms(); // Refresh the list if anyone creates a new room
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Function to grab rooms from the database
  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('study_rooms' as any) // Added 'as any' to fix TypeScript error
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setRooms(data);
    }
  };

  // Function to save a new room to the database
  const handleCreateRoom = async () => {
    if (!newTopic.trim() || !user) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('study_rooms' as any) // Added 'as any' here too
      .insert([{ topic: newTopic, created_by: user.id }]);
      
    if (!error) {
      setNewTopic(''); // Clear the input field on success
    } else {
      console.error("Error creating room:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Rooms</h1>
          <p className="text-gray-400 mt-2">Create or join a topic-based room to learn with peers.</p>
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
            <button 
              onClick={handleCreateRoom}
              disabled={loading || !newTopic.trim()}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </div>

        {/* List Rooms Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {rooms.length === 0 ? (
              <p className="text-gray-500 col-span-2 bg-slate-900 p-8 rounded-xl text-center border border-slate-800 border-dashed">
                No rooms available right now. Be the first to create one!
              </p>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition group flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-lg text-white group-hover:text-blue-400 transition">{room.topic}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Created {new Date(room.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate(`/rooms/${room.id}`)} 
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-medium rounded-lg transition"
                  >
                    Join
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}