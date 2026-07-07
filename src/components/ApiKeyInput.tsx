"use client";

import { useState } from "react";

interface ApiKeyInputProps {
  apiKey: string;
  onChange: (key: string) => void;
}

export function ApiKeyInput({ apiKey, onChange }: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex items-center gap-2 font-body text-sm">
      <label className="text-foreground/60 whitespace-nowrap">
        OpenAI API Key
      </label>
      <div className="relative flex-1 min-w-0">
        <input
          type={visible ? "text" : "password"}
          value={apiKey}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-1.5 border border-line bg-card text-foreground text-sm rounded-2xl outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 transition-colors placeholder:text-faint"
        />
      </div>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-foreground/40 hover:text-foreground/70 transition-colors shrink-0 cursor-pointer"
        title={visible ? "숨기기" : "보기"}
      >
        {visible ? "숨기기" : "보기"}
      </button>
      {apiKey && (
        <span className="text-green-600 shrink-0" title="키 입력됨">
          OK
        </span>
      )}
    </div>
  );
}
