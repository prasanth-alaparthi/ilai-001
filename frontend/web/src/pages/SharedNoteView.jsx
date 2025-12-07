import React, { useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

export default function SharedNoteView() {
  // const { token } = useParams(); // unused in mock
  const [note] = useState({
    title: "Mock Note Title",
    content: "This is the content of the mock note. If you see this, the frontend component is working correctly. The problem is with the backend.",
  });
  const [loading] = useState(false);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!note) return <div className="p-6">Note not found or link expired.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold">{note.title}</h1>
      <div className="mt-4 prose" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(note.content || "")) }} />
    </div>
  );
}