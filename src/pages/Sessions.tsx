import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Send, Plus, Search } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";

const tabs = ["Upcoming", "Joined", "Completed"];

const Sessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("Upcoming");

  const [showCreate, setShowCreate] = useState(false);

  const messagesEndRef = useRef<any>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    timing: "",
    duration: "",
    seats: 20,
  });

  // ---------------- FETCH SESSIONS ----------------

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log(error);
      return;
    }

    setSessions(data || []);

    if (data?.length) {
      setSelectedSession(data[0]);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // ---------------- FILTER ----------------

  useEffect(() => {
    let filtered = sessions.filter(
      (s) => s.status?.toLowerCase() === selectedTab.toLowerCase(),
    );

    if (search) {
      filtered = filtered.filter((s) =>
        s.title?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    setFilteredSessions(filtered);
  }, [sessions, selectedTab, search]);

  // ---------------- CREATE SESSION ----------------

  const createSession = async () => {
    const { error } = await supabase.from("sessions").insert({
      ...form,
      mentor: user?.email,
      participants: 0,
      status: "Upcoming",
    });

    if (error) {
      console.log(error);
      return;
    }

    setShowCreate(false);
    fetchSessions();
  };

  // ---------------- JOIN SESSION ----------------

  const joinSession = async (session: any, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      alert("Login first");
      return;
    }

    if (session.participants >= session.seats) {
      alert("Session full");
      return;
    }

    const { error } = await supabase.from("session_participants").insert({
      session_id: session.id,
      user_id: user.id,
    });

    if (error) {
      alert("Already joined");
      return;
    }

    await supabase
      .from("sessions")
      .update({
        participants: session.participants + 1,
      })
      .eq("id", session.id);

    fetchSessions();

    alert("Joined 🚀");
  };

  // ---------------- CHAT ----------------

  useEffect(() => {
    if (!selectedSession) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", selectedSession.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    };

    fetchMessages();
  }, [selectedSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    await supabase.from("messages").insert({
      session_id: selectedSession.id,
      user_id: user?.id,
      username: user?.email,
      message,
    });

    setMessage("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* HEADER */}

      <div className="flex justify-between mb-8">
        <h1 className="text-4xl font-bold">Sessions</h1>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-cyan-500 p-3 rounded"
        >
          <Plus />
        </button>
      </div>

      {/* SEARCH */}

      <div className="relative mb-6">
        <Search className="absolute left-4 top-4" />

        <input
          placeholder="Search session..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-3 pl-12 bg-black rounded"
        />
      </div>

      {/* CREATE */}

      {showCreate && (
        <div className="bg-white/5 p-6 rounded mb-6">
          <input
            placeholder="Title"
            className="w-full p-3 mb-3 bg-black"
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
          />

          <textarea
            placeholder="Description"
            className="w-full p-3 mb-3 bg-black"
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
          />

          <input
            type="datetime-local"
            onChange={(e) =>
              setForm({
                ...form,
                timing: e.target.value,
              })
            }
          />

          <input
            placeholder="Duration"
            onChange={(e) =>
              setForm({
                ...form,
                duration: e.target.value,
              })
            }
          />

          <input
            type="number"
            placeholder="Seats"
            onChange={(e) =>
              setForm({
                ...form,
                seats: Number(e.target.value),
              })
            }
          />

          <button
            onClick={createSession}
            className="mt-4 bg-green-500 px-4 py-2 rounded"
          >
            Create Session
          </button>
        </div>
      )}

      {/* TABS */}

      <div className="flex gap-4 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className="bg-white/10 px-4 py-2 rounded"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* SESSION LIST */}

        <div className="lg:col-span-2">
          {filteredSessions.map((session) => (
            <motion.div
              key={session.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/sessions/${session.id}`)}
              className="bg-white/5 p-6 rounded mb-5 cursor-pointer"
            >
              <h2 className="text-2xl">{session.title}</h2>

              <p>{session.description}</p>

              <div className="flex gap-5 mt-4">
                <span className="flex gap-2">
                  <Calendar size={18} />
                  {session.timing}
                </span>

                <span className="flex gap-2">
                  <Clock size={18} />
                  {session.duration}
                </span>

                <span className="flex gap-2">
                  <Users size={18} />
                  {session.participants}/{session.seats}
                </span>
              </div>

              <button
                onClick={(e) => joinSession(session, e)}
                className="mt-4 bg-cyan-500 px-4 py-2 rounded"
              >
                Join Session
              </button>
            </motion.div>
          ))}
        </div>

        {/* CHAT */}

        <div className="bg-white/5 p-5 rounded">
          <h2 className="text-xl mb-5">Session Chat</h2>

          <div className="h-96 overflow-auto">
            {messages.map((m) => (
              <div key={m.id} className="mb-4">
                <b>{m.username}</b>

                <p>{m.message}</p>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex mt-4">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 bg-black p-3"
            />

            <button onClick={sendMessage} className="bg-cyan-500 px-4">
              <Send />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sessions;
