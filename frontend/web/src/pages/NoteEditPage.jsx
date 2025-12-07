import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EditorModal from "../components/EditorModel"; // Note: This was EditorModal, changed to EditorModel as per actual file name

export default function NoteEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true); // Always open when this page is rendered

  function handleClose() {
    setOpen(false);
    navigate(`/notes/${id}/view`, { replace: true }); // Go back to note view after closing
  }

  function handleSaved(note) {
    navigate(`/notes/${note.id}/view`, { replace: true }); // Go to the saved note's view
  }

  return (
    <EditorModal
      open={open}
      onClose={handleClose}
      noteId={id}
      onSaved={handleSaved}
    />
  );
}