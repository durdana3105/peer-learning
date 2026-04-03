import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { messages } from "@/data/mockData";

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const selectedPeer = messages.find((m) => m.peerId === selectedChat);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-extrabold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-primary" />
            Messages
          </h1>
        </motion.div>

        <div className="mt-6 grid gap-6 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]">
          {/* Chat list */}
          <div className="space-y-2 rounded-2xl border border-border bg-card p-3 shadow-card">
            {messages.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedChat(m.peerId)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                  selectedChat === m.peerId
                    ? "bg-primary/10"
                    : "hover:bg-muted"
                }`}
              >
                <div className="relative">
                  <img
                    src={m.peerAvatar}
                    alt={m.peerName}
                    className="h-10 w-10 rounded-lg bg-muted"
                  />
                  {m.unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {m.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{m.peerName}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{m.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{m.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Chat area */}
          <div className="flex flex-col rounded-2xl border border-border bg-card shadow-card">
            {selectedPeer ? (
              <>
                <div className="flex items-center gap-3 border-b border-border p-4">
                  <img
                    src={selectedPeer.peerAvatar}
                    alt={selectedPeer.peerName}
                    className="h-9 w-9 rounded-lg bg-muted"
                  />
                  <h3 className="font-heading font-bold">{selectedPeer.peerName}</h3>
                </div>
                <div className="flex flex-1 flex-col justify-end p-4" style={{ minHeight: 400 }}>
                  <div className="mb-4 space-y-3">
                    <div className="flex justify-start">
                      <div className="max-w-xs rounded-2xl rounded-tl-sm bg-muted px-4 py-2 text-sm">
                        {selectedPeer.lastMessage}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="max-w-xs rounded-2xl rounded-tr-sm bg-gradient-hero px-4 py-2 text-sm text-primary-foreground">
                        Sounds great! Can't wait 🙌
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button size="icon" className="bg-gradient-hero text-primary-foreground hover:opacity-90">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-[500px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-12 w-12 opacity-30" />
                  <p className="mt-3 text-sm">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
