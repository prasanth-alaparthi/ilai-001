// src/routes/fileRoutes.js
import { lazy } from "react";
import ProtectedRoute from "../routes/ProtectedRoute";

// Auto-import all ./pages/*.jsx or .tsx lazily (Vite import.meta.glob example)
const pageModules = import.meta.glob("../pages/**/*.{jsx,tsx}", {
  eager: false,
});

function normalizePathFromFile(filePath) {
  const withoutPrefix = filePath.replace("../pages/", "");
  const withoutExt = withoutPrefix.replace(/\.(jsx|tsx)$/i, "");
  const segments = withoutExt.split("/");

  if (segments.length === 1 && segments[0].toLowerCase() === "index") {
    return "/";
  }

  const normalized = segments.map((s) => s.toLowerCase()).join("/");
  return `/${normalized}`;
}

// Which paths need auth (make sure they match your App.jsx protected routes)
const protectedPaths = new Set([
  "/home",
  "/notes",
  "/notes/:id", // For viewing a specific note
  "/journal",
  "/flashcards", // New protected path for flashcards
  "/journal/review",
  "/journal/publications",
  "/admin/users",
  "/feed",
  "/library",
  "/profile/me",
  "/profile/:username",
  "/verify-email",
  "ResetPassword",
  "/chat",
]);

export const fileRoutes = Object.entries(pageModules).map(
  ([filePath, loader]) => {
    const path = normalizePathFromFile(filePath);
    const Component = lazy(loader);

    const element = protectedPaths.has(path) ? (
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    ) : (
      <Component />
    );

    return { path, element };
  }
);
