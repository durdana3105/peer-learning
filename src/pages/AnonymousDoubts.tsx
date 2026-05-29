import { useState } from "react";

const initialDoubts = [
  {
    id: 1,
    content: "How does React Context work?",
    subject: "React",
    anonymous: true,
    upvotes: 12,
    replies: ["Used for global state sharing"],
  },
  {
    id: 2,
    content: "Difference between SQL and NoSQL?",
    subject: "Database",
    anonymous: false,
    upvotes: 8,
    replies: ["SQL is relational"],
  },
];

export default function AnonymousDoubts() {
  const [doubts, setDoubts] = useState(initialDoubts);
  const [text, setText] = useState("");
  const [subject, setSubject] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const addDoubt = () => {
    if (!text || !subject) return;

    setDoubts([
      {
        id: Date.now(),
        content: text,
        subject,
        anonymous,
        upvotes: 0,
        replies: [],
      },
      ...doubts,
    ]);

    setText("");
    setSubject("");
    setAnonymous(false);
  };

  const upvote = (id: number) => {
    setDoubts(
      doubts.map((d) => (d.id === id ? { ...d, upvotes: d.upvotes + 1 } : d)),
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Anonymous Doubt Posting</h1>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Ask your doubt..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-2"
        placeholder="Subject Tag"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <label className="flex gap-2 mb-4">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={() => setAnonymous(!anonymous)}
        />
        Post Anonymously
      </label>

      <button
        onClick={addDoubt}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Post Doubt
      </button>

      <div className="mt-6 space-y-4">
        {doubts.map((d) => (
          <div key={d.id} className="border p-4 rounded">
            <h2 className="font-bold">{d.anonymous ? "Anonymous" : "User"}</h2>
            <p>{d.content}</p>
            <small>{d.subject}</small>

            <button onClick={() => upvote(d.id)} className="ml-4">
              👍 {d.upvotes}
            </button>

            <div className="mt-2">
              {d.replies.map((r, i) => (
                <p key={i}>↳ {r}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
