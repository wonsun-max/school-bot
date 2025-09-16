"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

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
    <div className="user-info flex items-center gap-2">
      {session.user?.image && (
        <Image
          src={session.user.image}
          alt="avatar"
          width={40}
          height={40}
          className="user-avatar rounded-full"
        />
      )}
      <span className="user-name">{session.user?.name}</span>
      <button className="signout-btn" onClick={() => signOut()}>
        로그아웃
      </button>
    </div>
  );
}
