// app/components/AuthButtons.tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButtons() {
  const { data: session } = useSession();
  
  if (!session) {
    return (
      <button className="google-signin-btn" onClick={() => signIn("google")}>
        Google로 로그인
      </button>
    );
  }
  
  return (
    <div className="user-info">
      <img 
        src={session.user?.image ?? ""} 
        alt="avatar" 
        className="user-avatar"
      />
      <span className="user-name">{session.user?.name}</span>
      <button className="signout-btn" onClick={() => signOut()}>
        로그아웃
      </button>
    </div>
  );
}