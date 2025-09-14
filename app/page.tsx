"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    setResponse(data.answer);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>학교 봇 PoC</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="질문을 입력하세요"
          style={{ padding: 8, width: "300px", marginRight: "10px" }}
        />
        <button type="submit">확인</button>
      </form>
      <p style={{ marginTop: 20 }}>{response}</p>
    </main>
  );
}
