// File: src/components/ui/UserAvatar.jsx
import React from 'react';

export default function UserAvatar({ src }) {
  return (
    <div className="flex items-center gap-2">
      <img src={src || 'https://via.placeholder.com/40'} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-gray-100" />
    </div>
  );
}