import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Notifications = () => {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data, error } = await (supabase as any)
        .from("sessions")
        .select("*")
        .eq("status", "upcoming");

      if (!error) setAlerts(data);
    };

    fetchAlerts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>

      {alerts.length > 0 ? (
        alerts.map((a) => (
          <div key={a.id} className="border p-3 mb-2 rounded">
            📢 New Session: <b>{a.title}</b>
          </div>
        ))
      ) : (
        <p>No alerts</p>
      )}
    </div>
  );
};

export default Notifications;