"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuthStore } from "@/store/auth-store";
import { talkoConfig } from "@/lib/config";
import { isAccountAuthConfigured, signupWithAccount } from "@/lib/auth-service";
import { fetchAuthContext } from "@/lib/services";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const loginWithToken = useAuthStore((s) => s.loginWithToken);
  const loginWithApiKey = useAuthStore((s) => s.loginWithApiKey);
  const setSuperadmin = useAuthStore((s) => s.setSuperadmin);

  if (!isAccountAuthConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist p-6">
        <Card className="w-full max-w-md p-7">
          <h2 className="text-xl font-extrabold text-navy">Signup unavailable</h2>
          <p className="mt-2 text-sm text-slate/70">
            Set <code className="font-mono">NEXT_PUBLIC_AUTH_LOGIN_URL</code> to enable
            account signup.
          </p>
          <a href="/login" className="mt-4 inline-block text-sm font-semibold text-navy underline">
            Back to sign in
          </a>
        </Card>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Username and password are required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const cred = await signupWithAccount(username.trim(), password);
      if (cred.token) {
        loginWithToken(cred.token, {});
        try {
          const ctx = await fetchAuthContext();
          setSuperadmin(ctx.is_superadmin);
        } catch {
          setSuperadmin(null);
        }
      } else if (cred.apiKey) {
        loginWithApiKey(cred.apiKey, {});
      }
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist p-6">
      <Card className="w-full max-w-md p-7 shadow-pop">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember font-bold text-white">T</div>
          <p className="font-extrabold text-navy">{talkoConfig.appName}</p>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-navy">Create account</h2>
        <p className="mt-1 text-[13px] text-slate/70">
          Superadmin access is granted to ADMIN-role console users; everyone else is scoped to their own partner.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3.5">
          <div>
            <Label>Username</Label>
            <Input autoComplete="username" placeholder="you@company.com" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10" />
          </div>
          {error && <p className="text-xs font-medium text-brick">{error}</p>}
          <Button type="submit" size="lg" className="w-full font-bold" disabled={busy}>
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate/70">
          Already have an account?{" "}
          <a href="/login" className="font-semibold text-navy underline">Sign in</a>
        </p>
      </Card>
    </div>
  );
}
