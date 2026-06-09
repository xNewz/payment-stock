'use client';

import { useEffect, useState } from 'react';
import { Compass, Copy, ExternalLink, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * In-app browser (LINE/Facebook/IG) detector + escape helper.
 *
 * Why this exists:
 *   In-app browsers don't persist cookies reliably between sessions.
 *   Users log in, close the chat, reopen → cookie gone → forced to login again.
 *
 * Strategy per OS (because no method works 100% on both):
 *   - Android LINE:  intent:// URL  → forces Chrome to take over (very reliable)
 *   - iOS LINE:      window.location += '?openExternalBrowser=1'  → works on LINE 12+
 *                    Otherwise show manual instructions (no JS escape exists on iOS)
 *   - Other webviews: show manual instructions
 *
 * Loop prevention: uses sessionStorage (URL stays clean for user).
 */

const ATTEMPT_KEY = '__sv_external_attempted';

function detectWebview(ua) {
  if (/Line\//i.test(ua)) return 'LINE';
  if (/FBAV|FBAN|FB_IAB|FBIOS/i.test(ua)) return 'Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/Twitter/i.test(ua)) return 'Twitter';
  if (/TikTok|musical_ly/i.test(ua)) return 'TikTok';
  if (/MicroMessenger/i.test(ua)) return 'WeChat';
  if (/KAKAOTALK/i.test(ua)) return 'KakaoTalk';
  return null;
}

function detectOS(ua) {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  return 'Other';
}

function stripExternalParam(href) {
  try {
    const u = new URL(href);
    u.searchParams.delete('openExternalBrowser');
    return u.toString();
  } catch {
    return href;
  }
}

function safeSessionGet(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function safeSessionSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch { /* private mode etc */ }
}
function safeSessionRemove(key) {
  try { sessionStorage.removeItem(key); } catch { /* */ }
}

export function WebviewDetector() {
  const [show, setShow] = useState(false);
  const [appType, setAppType] = useState('');
  const [os, setOs] = useState('');
  const [cleanUrl, setCleanUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [attempting, setAttempting] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || '';
    const app = detectWebview(ua);
    if (!app) return; // Normal browser — don't render anything

    const detectedOs = detectOS(ua);
    const url = stripExternalParam(window.location.href);

    setAppType(app);
    setOs(detectedOs);
    setCleanUrl(url);
    setShow(true);

    // Auto-attempt escape exactly once per session
    if (safeSessionGet(ATTEMPT_KEY) !== '1') {
      safeSessionSet(ATTEMPT_KEY, '1');
      // Small delay so the UI mounts first (user sees something happening)
      setTimeout(() => attemptOpenExternal(url, detectedOs, app), 250);
    }
  }, []);

  /**
   * Try every known method to escape the in-app browser.
   * Falls through to manual UI if all methods fail (page stays here).
   */
  const attemptOpenExternal = (url, currentOs, app) => {
    setAttempting(true);

    if (currentOs === 'Android') {
      // Method 1 (best for Android): intent:// — Android intercepts and opens Chrome
      const withoutScheme = url.replace(/^https?:\/\//, '');
      const intentUrl =
        `intent://${withoutScheme}` +
        `#Intent;scheme=https;package=com.android.chrome;` +
        `S.browser_fallback_url=${encodeURIComponent(url)};end;`;

      try { window.location.href = intentUrl; } catch { /* */ }

      // Method 2 (fallback after 1.2s if intent didn't fire): openExternalBrowser param
      setTimeout(() => {
        const sep = url.includes('?') ? '&' : '?';
        try { window.location.href = url + sep + 'openExternalBrowser=1'; } catch { /* */ }
        setAttempting(false);
      }, 1200);
      return;
    }

    if (currentOs === 'iOS') {
      // iOS LINE 12+: documented openExternalBrowser param works
      // (does nothing in older versions, but harmless)
      const sep = url.includes('?') ? '&' : '?';
      try { window.location.href = url + sep + 'openExternalBrowser=1'; } catch { /* */ }
      setTimeout(() => setAttempting(false), 1500);
      return;
    }

    // Unknown OS: best-effort
    const sep = url.includes('?') ? '&' : '?';
    try { window.location.href = url + sep + 'openExternalBrowser=1'; } catch { /* */ }
    setTimeout(() => setAttempting(false), 1500);
  };

  const handleRetry = () => {
    safeSessionRemove(ATTEMPT_KEY);
    attemptOpenExternal(cleanUrl, os, appType);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanUrl);
      setCopied(true);
    } catch {
      // Fallback for older webviews without Clipboard API
      const ta = document.createElement('textarea');
      ta.value = cleanUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* */ }
      document.body.removeChild(ta);
      setCopied(true);
    }
    setTimeout(() => setCopied(false), 2000);
  };

  if (!show) return null;

  const browserName = os === 'iOS' ? 'Safari' : os === 'Android' ? 'Chrome' : 'เบราว์เซอร์ของเครื่อง';
  const menuIcon = os === 'iOS' ? '⋯' : '⋮';
  const menuPosition = os === 'iOS' ? 'ขวาล่าง' : 'ขวาบน';

  return (
    <div className="fixed inset-0 z-[9999] bg-background/98 backdrop-blur-xl flex flex-col items-center justify-start sm:justify-center overflow-auto p-5 sm:p-6">
      <div className="max-w-sm w-full space-y-5 my-auto py-6 animate-in zoom-in-95 fade-in duration-300">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ExternalLink className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              เปิดในเบราว์เซอร์ภายนอก
            </h1>
            <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
              ระบบตรวจพบว่าคุณเปิดผ่าน <strong className="text-foreground">{appType}</strong><br/>
              การเข้าสู่ระบบจะไม่จดจำคุณ — โปรดเปิดด้วย <strong className="text-foreground">{browserName}</strong>
            </p>
          </div>
        </div>

        {/* Primary action */}
        <Button
          className="w-full h-12 text-sm font-bold rounded-xl"
          onClick={handleRetry}
          disabled={attempting}
        >
          <Compass className="w-4 h-4 mr-2" />
          {attempting ? 'กำลังเปิดเบราว์เซอร์...' : 'เปิดในเบราว์เซอร์ตอนนี้'}
        </Button>

        {/* OS-specific manual instructions */}
        <div className="bg-card border border-border/60 rounded-xl p-4 text-left space-y-3 shadow-sm">
          <p className="text-[11px] font-semibold text-center text-muted-foreground uppercase tracking-wider">
            ถ้าปุ่มด้านบนไม่ทำงาน
          </p>

          {appType === 'LINE' && os === 'iOS' && (
            <ol className="text-xs space-y-2.5 list-none">
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] mt-0.5">1</span>
                <span>กดไอคอน <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[11px]">{menuIcon}</kbd> ที่มุม{menuPosition}ของหน้าจอ LINE</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
                <span>เลือก <strong>"เปิดในเบราว์เซอร์เริ่มต้น"</strong> หรือ <strong>"Open in Safari"</strong></span>
              </li>
            </ol>
          )}

          {appType === 'LINE' && os === 'Android' && (
            <ol className="text-xs space-y-2.5 list-none">
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] mt-0.5">1</span>
                <span>กดไอคอน <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[11px]">{menuIcon}</kbd> ที่มุมขวาบน</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
                <span>เลือก <strong>"เปิดในเบราว์เซอร์อื่น"</strong> หรือ <strong>"Open in Chrome"</strong></span>
              </li>
            </ol>
          )}

          {appType !== 'LINE' && (
            <ol className="text-xs space-y-2.5 list-none">
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] mt-0.5">1</span>
                <span>กดไอคอน <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[11px]">⋯</kbd> หรือ <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[11px]">⋮</kbd> ของแอป</span>
              </li>
              <li className="flex gap-2.5 items-start">
                <span className="w-5 h-5 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-[10px] mt-0.5">2</span>
                <span>เลือก <strong>"เปิดในเบราว์เซอร์"</strong></span>
              </li>
            </ol>
          )}

          {/* Visual hint for where to look */}
          {os === 'iOS' && appType === 'LINE' && (
            <div className="flex items-center justify-center gap-2 text-amber-500 text-[11px] pt-1">
              <ArrowDownToLine className="w-3.5 h-3.5 animate-bounce" />
              <span>มองหาเมนูที่<strong>มุมขวาล่าง</strong>ของหน้าจอ</span>
            </div>
          )}
          {os === 'Android' && appType === 'LINE' && (
            <div className="flex items-center justify-center gap-2 text-amber-500 text-[11px] pt-1">
              <ArrowUpFromLine className="w-3.5 h-3.5 animate-bounce" />
              <span>มองหาเมนูที่<strong>มุมขวาบน</strong>ของหน้าจอ</span>
            </div>
          )}
        </div>

        {/* Copy URL fallback */}
        <div className="space-y-2 pt-3 border-t border-border/40">
          <p className="text-[11px] text-muted-foreground text-center">หรือคัดลอกลิงก์ไปวางใน {browserName} เอง</p>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={cleanUrl}
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-muted/30 text-[11px] font-mono truncate focus:outline-none"
              onFocus={(e) => e.target.select()}
            />
            <Button
              variant="outline"
              className="h-10 px-3 shrink-0"
              onClick={handleCopy}
              aria-label="คัดลอกลิงก์"
            >
              {copied ? (
                <span className="text-emerald-500 text-xs font-semibold">✓ คัดลอกแล้ว</span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
