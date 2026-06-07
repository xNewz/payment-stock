'use client';

import { useEffect, useState } from 'react';
import { Compass, Copy, ExternalLink, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WebviewDetector() {
  const [isWebview, setIsWebview] = useState(false);
  const [appType, setAppType] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const url = window.location.href;
    setCurrentUrl(url);

    let detectedApp = '';

    if (/Line/i.test(ua)) detectedApp = 'LINE';
    else if (/FBAV|FBAN/i.test(ua)) detectedApp = 'Facebook';
    else if (/Instagram/i.test(ua)) detectedApp = 'Instagram';
    else if (/Twitter/i.test(ua)) detectedApp = 'Twitter';
    else if (/TikTok/i.test(ua)) detectedApp = 'TikTok';

    if (detectedApp) {
      setAppType(detectedApp);
      setIsWebview(true);
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isWebview) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-8 animate-in zoom-in-95 duration-300">
        
        {/* Icon & App Name */}
        <div className="space-y-4">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-2xl shadow-primary/20">
            <Smartphone className="w-10 h-10 absolute opacity-50" />
            <Compass className="w-12 h-12 relative z-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            กรุณาเปิดในเบราว์เซอร์
          </h1>
          <p className="text-muted-foreground text-sm">
            คุณกำลังเปิดผ่านแอป <strong className="text-foreground">{appType}</strong> ซึ่งอาจทำให้ระบบล็อกอินมีปัญหา <br/>
            โปรดเปิดผ่าน Safari หรือ Chrome เพื่อการใช้งานที่สมบูรณ์
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold flex items-center justify-center gap-2">
            <ExternalLink className="w-4 h-4 text-amber-500" />
            วิธีเปิดในเบราว์เซอร์
          </h2>
          
          <div className="space-y-3 text-sm text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-muted flex items-center justify-center font-bold text-xs mt-0.5">1</div>
              <p>กดที่ไอคอน <strong className="bg-muted px-1.5 py-0.5 rounded">•••</strong> หรือ <strong className="bg-muted px-1.5 py-0.5 rounded">⋮</strong> มุมขวาบนของหน้าจอ</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 shrink-0 rounded-full bg-muted flex items-center justify-center font-bold text-xs mt-0.5">2</div>
              <p>เลือก <strong>"เปิดในเบราว์เซอร์"</strong> (Open in Browser) หรือ <strong>"เปิดใน Safari/Chrome"</strong></p>
            </div>
          </div>
        </div>

        {/* Copy Link Alternative */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">หรือคัดลอกลิงก์ไปเปิดในแอปเบราว์เซอร์โดยตรง</p>
          <Button 
            variant="outline" 
            className="w-full h-12 text-sm font-semibold rounded-xl"
            onClick={copyToClipboard}
          >
            {copied ? (
              <span className="text-emerald-500 flex items-center gap-2">✓ คัดลอกลิงก์เรียบร้อย</span>
            ) : (
              <span className="flex items-center gap-2"><Copy className="w-4 h-4" /> คัดลอกลิงก์เว็บไซต์</span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}
