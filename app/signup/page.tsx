"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuthStore } from "@/store/auth-store";
import { talkoConfig } from "@/lib/config";
import { isAccountAuthConfigured, loginWithAccount, signupWithAccount } from "@/lib/auth-service";
import { fetchAuthContext } from "@/lib/services";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const loginWithToken = useAuthStore((s) => s.loginWithToken);
  const loginWithApiKey = useAuthStore((s) => s.loginWithApiKey);
  const setSuperadmin = useAuthStore((s) => s.setSuperadmin);
  const setRole = useAuthStore((s) => s.setRole);

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
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("Name, email, phone and password are required");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      // No partner asked: later accounts activate as pending; a superadmin
      // assigns role + partner (Partners → Users table).
      await signupWithAccount({
        name: name.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        password,
      });
      const cred = await loginWithAccount(email.trim(), password);
      if (cred.token) {
        loginWithToken(cred.token, {});
        try {
          const ctx = await fetchAuthContext();
          setSuperadmin(ctx.is_superadmin);
          setRole(ctx.role ?? null);
        } catch {
          setSuperadmin(null);
          setRole(null);
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
          The first account ever created becomes superadmin; everyone after that is scoped to their own partner.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3.5">
          <div>
            <Label>Full name</Label>
            <Input autoComplete="name" placeholder="Aarav Sharma" value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label>Email</Label>
              <Input autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
            </div>
            <div>
              <Label>Phone (+E.164)</Label>
              <Input autoComplete="tel" placeholder="+919889560593" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10" />
            </div>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label>Password</Label>
              <Input type="password" autoComplete="new-password" placeholder="8+ chars, upper/lower/digit/special" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10" />
            </div>
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
