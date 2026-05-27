import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export default function CreateSession() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(10);
  const [category, setCategory] = useState("");

  const handleCreate = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("sessions").insert([
      {
        title,
        description,
        date,
        time,
        seats,
        category,
        mentor_id: user?.id,
      },
    ]);

    if (!error) {
      alert("Session created");
      navigate("/sessions");
    }

    console.log(error);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Create Session</h1>

      <input
        placeholder="Title"
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <textarea
        placeholder="Description"
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <input
        type="date"
        onChange={(e) => setDate(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <input
        type="time"
        onChange={(e) => setTime(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <input
        type="number"
        placeholder="Seats"
        onChange={(e) => setSeats(Number(e.target.value))}
        className="border p-2 w-full mb-4"
      />

      <input
        placeholder="Category"
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <button
        onClick={handleCreate}
        className="bg-blue-500 text-white px-6 py-2"
      >
        Create Session
      </button>
    </div>
  );
}
