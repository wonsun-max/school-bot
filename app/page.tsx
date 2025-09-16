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
  const [isGuest, setIsGuest] = useState(false); // NEW: Guest mode state
  const endRef = useRef<HTMLDivElement | null>(null);

  // Load chat history for logged-in users
  useEffect(() => {
    if (!session || isGuest) return;
    
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
  }, [session, isGuest]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function makeId() {
    return String(Date.now()) + "-" + Math.random().toString(36).slice(2, 9);
  }

  // Typing animation
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
    if (!q.trim() || (!session && !isGuest)) return;
    
    const userMsg: Msg = { id: makeId(), role: "user", text: q, ts: Date.now(), status: "done" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    const botId = makeId();
    const botPlaceholder: Msg = { id: botId, role: "bot", text: "", ts: Date.now(), status: "sending" };
    setMessages((prev) => [...prev, botPlaceholder]);

    try {
      // Choose the right endpoint based on mode
      const endpoint = isGuest ? "/api/guest/chat" : "/api/chat";
      
      const res = await fetch(endpoint, {
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

  // NEW: Enter as guest function
  function enterAsGuest() {
    setIsGuest(true);
    setMessages([]); // Clear any existing messages
  }

  // NEW: Exit guest mode
  function exitGuestMode() {
    setIsGuest(false);
    setMessages([]);
  }

  // If not logged in and not guest, show login screen
  if (!session && !isGuest) {
    return (
      <div className="welcome-container">
        <div className="welcome-card">
          <div className="welcome-logo">
            <img src="/mha-logo.png" alt="MHA Logo" />
          </div>
          <h1 className="welcome-title">마한아 학교 챗봇</h1>
          <p className="welcome-subtitle">급식, 시간표, 행사 정보를 물어보세요</p>
          
          <div className="auth-options">
            <div className="auth-option">
              <h3>회원으로 시작하기</h3>
              <p>대화 내용이 자동으로 저장됩니다</p>
              <AuthButtons />
            </div>
            
            <div className="divider">
              <span>또는</span>
            </div>
            
            <div className="auth-option">
              <h3>게스트로 시작하기</h3>
              <p>대화 내용이 저장되지 않습니다</p>
              <button className="guest-btn" onClick={enterAsGuest}>
                게스트로 입장
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main chat interface
  return (
    <div className="chat-outer">
      <div className="chat-card">
        <div className="chat-toolbar">
          <div className="toolbar-left">
            {isGuest ? (
              <>
                <span className="guest-badge">게스트 모드</span>
                <button className="btn exit-guest" onClick={exitGuestMode}>나가기</button>
              </>
            ) : (
              <AuthButtons />
            )}
            <button className="btn" onClick={() => sendQuery("오늘 급식")}>오늘 급식</button>
            <button className="btn" onClick={() => sendQuery("내일 시간표")}>내일 시간표</button>
            <button className="btn ghost" onClick={() => sendQuery("다음 행사")}>다음 행사</button>
          </div>
          <div className="toolbar-right">
            {!isGuest && (
              <span className="save-indicator">💾 대화 저장됨</span>
            )}
            <button className="btn small" onClick={exportChat}>내보내기</button>
            <button className="btn small danger" onClick={clearChat}>초기화</button>
          </div>
        </div>

        <div className="chat-log" role="log" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-empty">
              <p>
                {isGuest 
                  ? "🔓 게스트 모드입니다. 대화가 저장되지 않습니다."
                  : "✅ 로그인 완료! 대화가 자동 저장됩니다."}
              </p>
              <p>질문을 입력하거나 위 버튼을 눌러 시작하세요.</p>
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

function TypingDots() {
  return <span className="typing"><span>.</span><span>.</span><span>.</span></span>;
}