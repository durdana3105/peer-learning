import { Search, Plus } from "lucide-react";
import { CreateSessionDialog } from "@/components/CreateSessionDialog";
import { useRole } from "@/contexts/RoleContext";

type SessionFiltersProps = {
  tabs: string[];
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  search: string;
  setSearch: (search: string) => void;
  onSessionCreated: () => void;
};

export function SessionFilters({
  tabs,
  selectedTab,
  setSelectedTab,
  search,
  setSearch,
  onSessionCreated,
}: SessionFiltersProps) {
  const { isMentor } = useRole();

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-5 top-4 text-gray-400" size={20} />

        <input
          type="text"
          placeholder="Search sessions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl py-4 pl-14 pr-4 outline-none focus:border-cyan-400 transition text-white"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
        <div className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
                selectedTab === tab
                  ? "bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-bold shadow-lg shadow-cyan-500/20"
                  : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isMentor && (
          <CreateSessionDialog onSessionCreated={onSessionCreated}>
            <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-purple-500 text-black px-6 py-3 rounded-2xl font-bold hover:opacity-90 transition">
              <Plus size={20} />
              Create Session
            </button>
          </CreateSessionDialog>
        )}
      </div>
    </>
  );
}
