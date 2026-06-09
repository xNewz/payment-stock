'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';
import { saveAuth, tryRestoreSession } from '@/lib/authClient';

function isPhoneNumber(value) {
  return /^0\d{9}$/.test(value.replace(/[-\s]/g, ''));
}

export default function LoginPage() {
  const router = useRouter();

  // 'identifier' → user types phone or username
  // 'password'   → admin confirmed identifier, now types password
  const [step, setStep] = useState('identifier');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);

  const identifierRef = useRef(null);
  const passwordRef = useRef(null);

  const isPhone = isPhoneNumber(identifier);

  // ── On mount: try to restore session from localStorage ──
  // This rescues users coming back into an in-app browser (LINE/Facebook)
  // whose cookie was dropped by the webview. If a valid token is in
  // localStorage, the server re-issues the cookie and we redirect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await tryRestoreSession();
      if (cancelled) return;
      if (user) {
        window.location.replace(user.role === 'ADMIN' ? '/admin' : '/payment');
        return;
      }
      setRestoring(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Focus password field when we switch to password step
  useEffect(() => {
    if (step === 'password') {
      passwordRef.current?.focus();
    }
  }, [step]);

  // ── Step 1: user pressed Enter / Next on identifier field ──
  const handleIdentifierNext = () => {
    setError('');
    if (!identifier.trim()) return;

    if (isPhone) {
      // Phone → login immediately, no password step
      submitLogin();
    } else {
      // Username → advance to password step
      setStep('password');
    }
  };

  // ── Final submit ──
  const submitLogin = async (pwd = password) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier.trim(),
          password: isPhone ? undefined : pwd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');

      // Persist token in localStorage as a cookie fallback for in-app
      // browsers (LINE/Facebook) that drop httpOnly cookies. Saved BEFORE
      // navigation so the next page boot can use it.
      if (data.token) saveAuth(data.token);

      // Use hard redirect (window.location.href) instead of router.push
      // This is crucial for WebViews (LINE, Facebook) to properly sync the cookie jar
      window.location.href = data.user.role === 'ADMIN' ? '/admin' : '/payment';
    } catch (err) {
      setError(err.message);
      // On error, go back to identifier step so user can re-type
      setStep('identifier');
      setPassword('');
      setTimeout(() => identifierRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    submitLogin(password);
  };

  // ────────────────────────────────────────────────────────────
  // Derived display state
  const isAdminStep = step === 'password';
  const identifierConfirmed = isAdminStep; // greyed out / locked when on password step

  // While we're checking localStorage for a saved token, show a tiny spinner
  // so the form doesn't flash visible before an auto-redirect.
  if (restoring) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden p-4">
      {/* Aurora background is provided globally by app/layout.js */}

      <Card className="relative w-full max-w-sm overflow-hidden glass-card shadow-2xl shadow-black/40">
        {/* Brand accent top line */}
        <div className="absolute inset-x-0 top-0 brand-line" />

        <CardHeader className="space-y-2 px-8 pb-4 pt-10 text-center">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isAdminStep ? 'เข้าสู่ระบบผู้ดูแล' : 'ตรวจสอบบัญชีเพื่อชำระเงิน'}
            </CardTitle>
            <CardDescription className="text-sm">
              {isAdminStep
                ? 'กรุณากรอกรหัสผ่านผู้ดูแลระบบ'
                : 'กรอกเบอร์โทรหรือชื่อผู้ใช้งาน'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* ── STEP 1: Identifier ── */}
          {!isAdminStep && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-sm font-medium">
                  เบอร์โทรศัพท์ หรือ ชื่อผู้ใช้
                </Label>
                <Input
                  ref={identifierRef}
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleIdentifierNext(); } }}
                  placeholder="0xx-xxx-xxxx หรือ username"
                  disabled={loading}
                  className="h-10 bg-muted/40"
                  autoFocus
                  autoComplete="username"
                  inputMode="text"
                />
                <p className="text-[11px] text-muted-foreground">
                  {isPhone
                    ? '✓ เบอร์โทรถูกต้อง — กด Enter หรือปุ่มด้านล่างเพื่อเข้าสู่ระบบ'
                    : 'ผู้ใช้ทั่วไปใช้เบอร์โทร 10 หลัก · Admin ใช้ username'}
                </p>
              </div>

              {isPhone ? (
                <Button
                  type="button"
                  onClick={handleIdentifierNext}
                  className="h-11 w-full btn-premium rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังเข้าสู่ระบบ...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      เข้าสู่ระบบ
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleIdentifierNext}
                  className="h-10 w-full font-semibold"
                  variant="outline"
                  disabled={!identifier.trim() || loading}
                >
                  <span className="flex items-center gap-2">
                    ถัดไป
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              )}
            </div>
          )}

          {/* ── STEP 2: Admin Password ── */}
          {isAdminStep && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5 animate-in fade-in slide-in-from-top-3 duration-200">
              {/* Show locked identifier */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-medium">{identifier}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep('identifier'); setPassword(''); setError(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  แก้ไข
                </button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">รหัสผ่าน</Label>
                <Input
                  ref={passwordRef}
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="h-10 bg-muted/40"
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full btn-premium rounded-xl"
                disabled={loading || !password}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังยืนยัน...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    เข้าสู่ระบบ Admin
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          )}
        </CardContent>

      </Card>
    </div>
  );
}
