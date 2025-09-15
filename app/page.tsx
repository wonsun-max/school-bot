// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import AuthButtons from "./components/AuthButtons";

type Msg = {
  id: string;
  role: "user" | "bot";
  text: string;
  ts: number;
  status?: "sending" | "done" | "error";
};

export default function Page() {
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // 로그인하면 DB에서 채팅 기록 불러오기
  useEffect(() => {
    if (!session) return;
    
    fetch("/api/chat/history")
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map(msg => ({
            id: msg.id || makeId(),
            role: msg.role as "user" | "bot",
            text: msg.text,
            ts: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),
            status: "done" as const
          }));
          setMessages(formatted);
        }
      })
      .catch(console.error);
  }, [session]);

  // 스크롤
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function makeId() {
    return String(Date.now()) + "-" + Math.random().toString(36).slice(2, 9);
  }

  // 메시지 텍스트 일부씩 노출(typing simulation)
  function revealBotText(id: string, fullText: string) {
    let i = 0;
    const step = () => {
      i += Math.ceil(fullText.length > 300 ? 6 : 2);
      if (i >= fullText.length) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, text: fullText, status: "done" } : m))
        );
      } else {
        const part = fullText.slice(0, i);
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text: part } : m)));
        setTimeout(step, 20);
      }
    };
    step();
  }

  async function sendQuery(q: string) {
    if (!q.trim() || !session) return;
    const userMsg: Msg = { id: makeId(), role: "user", text: q, ts: Date.now(), status: "done" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // add placeholder bot message (for typing)
    const botId = makeId();
    const botPlaceholder: Msg = { id: botId, role: "bot", text: "", ts: Date.now(), status: "sending" };
    setMessages((prev) => [...prev, botPlaceholder]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const errText = await res.text();
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, text: `오류: ${errText}`, status: "error" } : m))
        );
        setSending(false);
        return;
      }

      const data = await res.json();
      const answer = typeof data.answer === "string" ? data.answer : JSON.stringify(data);

      // reveal animation
      revealBotText(botId, answer);
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) => (m.id === botId ? { ...m, text: "오류가 발생했습니다.", status: "error" } : m))
      );
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || sending) return;
    sendQuery(input.trim());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function clearChat() {
    if (!confirm("대화를 정말로 삭제할까요?")) return;
    setMessages([]);
  }

  function exportChat() {
    const txt = messages
      .map((m) => {
        const time = new Date(m.ts).toLocaleString();
        const who = m.role === "user" ? "사용자" : "챗봇";
        return `[${time}] ${who}:\n${m.text}\n\n`;
      })
      .join("");
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mha-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyMessageText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("복사되었습니다.");
    } catch {
      alert("복사 실패");
    }
  }

  // 로그인 안 되어있으면
  if (!session) {
    return (
      <div className="chat-outer">
        <div className="chat-card" style={{ textAlign: "center", padding: "40px" }}>
          <h1>학교 챗봇</h1>
          <p>Google 계정으로 로그인해주세요</p>
          <AuthButtons />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-outer">
      <div className="chat-card">
        <div className="chat-toolbar">
          <div className="toolbar-left">
            <AuthButtons />
            <button className="btn" onClick={() => sendQuery("오늘 급식")}>오늘 급식</button>
            <button className="btn" onClick={() => sendQuery("내일 시간표")}>내일 시간표</button>
            <button className="btn ghost" onClick={() => sendQuery("다음 행사")}>다음 행사</button>
          </div>
          <div className="toolbar-right">
            <button className="btn small" onClick={exportChat}>내보내기</button>
            <button className="btn small danger" onClick={clearChat}>초기화</button>
          </div>
        </div>

        <div className="chat-log" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>안내: 질문을 입력하거나 위 버튼을 눌러 시작하세요. (Enter: 전송 / Shift+Enter: 줄바꿈)</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`chat-row ${m.role === "user" ? "user" : "bot"}`}>
              <div className="chat-bubble">
                <div className="chat-text">{m.text || (m.status === "sending" ? <TypingDots /> : "")}</div>
                <div className="chat-meta">
                  <span className="chat-time">{new Date(m.ts).toLocaleTimeString()}</span>
                  <button className="meta-btn" onClick={() => copyMessageText(m.text)}>복사</button>
                </div>
              </div>
            </div>
          ))}

          <div ref={endRef} />
        </div>

        <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="메시지를 입력하세요. (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
          />
          <button type="submit" className="send-btn" disabled={sending || !input.trim()}>
            {sending ? "전송중..." : "전송"}
          </button>
        </form>
      </div>
    </div>
  );
}

// typing 애니메이션 (간단한 도트)
function TypingDots() {
  return <span className="typing"><span>.</span><span>.</span><span>.</span></span>;
}