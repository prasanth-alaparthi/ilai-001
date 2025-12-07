import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiClient from "../services/apiClient";

export default function SearchResultsPage() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [items, setItems] = useState([]);

  useEffect(()=> {
    async function run(){
      if (!q) return;
      try {
        const res = await apiClient.get("/search/notes", { params: { q, limit: 20 }});
        setItems(res.data.items || []);
      } catch (e) { console.error(e); }
    }
    run();
  }, [q]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-3">Search results for “{q}”</h2>
      {items.length === 0 ? <div className="text-slate-500">No results</div> : items.map(it => (
        <Link to={`/notes/${it.id}`} key={it.id} className="block p-3 border rounded mb-2">
          <div className="font-medium">{it.title}</div>
          <div className="text-xs text-slate-400 mt-1">{it.snippet}</div>
        </Link>
      ))}
    </div>
  );
}

