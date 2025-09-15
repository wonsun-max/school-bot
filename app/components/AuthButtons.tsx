// app/components/AuthButtons.tsx
"use client";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButtons() {
  const { data: session } = useSession();
  
  if (!session) {
    return <button onClick={() => signIn("google")}>Sign in with Google</button>;
  }
  
  return (
    <div>
      <img 
        src={session.user?.image ?? ""} 
        alt="avatar" 
        style={{width:32, height:32, borderRadius:6}} 
      />
      <span>{session.user?.name}</span>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}