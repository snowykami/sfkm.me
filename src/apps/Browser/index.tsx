import React, { useState, useEffect } from "react";

export default function Browser() {
  const STORAGE_KEY = "browser_url";
  const [url, setUrl] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "https://bot.liteyuki.org",
  );
  const [input, setInput] = useState(url);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, url);
  }, [url]);

  useEffect(() => {
    setInput(url);
  }, [url]);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    setUrl(
      input.startsWith("http://") || input.startsWith("https://")
        ? input
        : `https://${input}`,
    );
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <form
        onSubmit={handleGo}
        style={{
          display: "flex",
          padding: "8px",
          background: "#f3f3f3",
          borderBottom: "1px solid #ddd",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入网址并回车"
          style={{
            flex: 1,
            padding: "8px",
            fontSize: 16,
            border: "1px solid #ccc",
            borderRadius: 4,
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            marginLeft: 8,
            padding: "8px 16px",
            fontSize: 16,
            border: "none",
            borderRadius: 4,
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          打开
        </button>
      </form>
      <iframe
        src={url}
        style={{ flex: 1, border: "none", width: "100%" }}
        title="Browser"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
