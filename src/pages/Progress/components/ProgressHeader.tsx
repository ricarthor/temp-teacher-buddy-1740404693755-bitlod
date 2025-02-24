import React from 'react';

interface ProgressHeaderProps {
  title: string;
  description: string;
}

export function ProgressHeader({ title, description }: ProgressHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1e293b] mb-2">{title}</h1>
      <p className="text-[#64748b]">{description}</p>
    </div>
  );
}
