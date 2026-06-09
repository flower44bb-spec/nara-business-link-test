"use client";

import { LogIn, LogOut, Menu, Shield, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./auth-provider";

const links = [
  ["/businesses", "事業者検索"],
  ["/problems", "困りごと相談"],
  ["/collaborations", "コラボ募集"],
  ["/successes", "成功事例"],
  ["/marche", "マルシェ"],
  ["/members", "青年部員"],
  ["/messages", "DM"],
];

export function Header() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    setOpen(false);
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/" onClick={() => setOpen(false)}>
        <span className="brand-mark">N</span>
        <span>
          NARA BUSINESS LINK
          <small>奈良県商工会青年部</small>
        </span>
      </Link>
      <button
        className="menu-toggle"
        type="button"
        aria-label="メニューを開く"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav className={open ? "main-nav open" : "main-nav"}>
        {links.map(([href, label]) => (
          <Link href={href} key={href} onClick={() => setOpen(false)}>
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link className="admin-link" href="/admin" onClick={() => setOpen(false)}>
            <Shield size={15} /> 管理
          </Link>
        )}
        {user ? (
          <button className="nav-auth ghost" type="button" onClick={logout}>
            <LogOut size={17} /> ログアウト
          </button>
        ) : (
          <Link className="nav-auth" href="/auth" onClick={() => setOpen(false)}>
            <LogIn size={17} /> ログイン
          </Link>
        )}
      </nav>
    </header>
  );
}
