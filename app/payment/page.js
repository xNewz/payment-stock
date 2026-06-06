'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { generatePromptPayPayload } from '@/lib/promptpay';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  UploadCloud, 
  Coins, 
  Wallet,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function PaymentPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Fetch user profile and payments history
  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const payRes = await fetch('/api/payments');
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.payments);
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update QR code when amount or user bank account changes
  useEffect(() => {
    if (!user || !user.assignedAccount) return;
    
    const target = user.assignedAccount.accountNumber;
    const payload = generatePromptPayPayload(target, amount);
    
    QRCode.toDataURL(payload, {
      width: 250,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
      .then(url => setQrUrl(url))
      .catch(err => console.error('QR code generation error:', err));
  }, [user, amount]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleFileChange = (selectedFile) => {
    setError('');
    if (!selectedFile.type.startsWith('image/')) {
      setError('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น');
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    if (!file) {
      setError('กรุณาอัปโหลดสลิปการโอนเงิน');
      return;
    }
    if (!user || !user.assignedAccount) {
      setError('ไม่พบข้อมูลบัญชีธนาคารสำหรับโอนเงิน');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('amount', amount);
    formData.append('bankAccountId', user.assignedAccount.id);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'การส่งสลิปชำระเงินล้มเหลว');
      }

      setSuccessMsg('อัปโหลดสลิปเรียบร้อยแล้ว รอผู้ดูแลระบบตรวจสอบข้อมูล');
      setAmount('');
      setFile(null);
      setPreviewUrl('');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm font-medium text-muted-foreground">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navigation Bar */}
      <header className="border-b bg-card/90 backdrop-blur-md sticky top-0 z-50">
        {/* Brand accent top line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
        <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Coins className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">StockVision</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-semibold text-sm leading-none">{user?.name}</span>
              <span className="text-xs text-muted-foreground mt-0.5">ผู้ใช้งานทั่วไป</span>
            </div>
            <div className="h-7 w-px bg-border hidden sm:block" />
            <ThemeToggle />
            <div className="h-7 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Page Header Area */}
      <div className="border-b bg-card/30">
        <div className="px-6 py-6 max-w-7xl mx-auto w-full">
          <h1 className="text-xl font-semibold tracking-tight">Payment Portal</h1>
          <p className="text-muted-foreground mt-1 text-sm">อัปโหลดสลิปการโอนเงิน และติดตามสถานะการตรวจสอบ</p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-2xl w-full mx-auto">
        <div className="flex flex-col gap-6">
          
          {/* Payment Card Column */}
          <Card className="shadow-md border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">ชำระเงินค่าบริการ</CardTitle>
                  <CardDescription className="text-xs">โอนเข้าบัญชีด้านล่างและอัปโหลดสลิปเป็นหลักฐาน</CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {user?.assignedAccount ? (
                <div className="flex flex-col gap-5">
                  
                  {/* Bank details panel - premium gradient */}
                  <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-5">
                    <div className="absolute right-4 top-4 opacity-10">
                      <Wallet className="h-16 w-16" />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">บัญชีรับโอนเงิน</p>
                    <p className="mt-1.5 text-lg font-bold text-primary">{user.assignedAccount.bankName}</p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-foreground">
                      {user.assignedAccount.accountNumber}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      ชื่อบัญชี — <span className="font-semibold text-foreground">{user.assignedAccount.accountName}</span>
                    </p>
                  </div>

                  {/* Form to enter amount & generate QR */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">จำนวนเงินที่ต้องการชำระ (บาท)</Label>
                      <Input
                        type="number"
                        id="amount"
                        min="1"
                        step="any"
                        placeholder="ระบุจำนวนเงินที่ต้องการโอน เช่น 500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        disabled={submitting}
                      />
                    </div>

                    {/* Dynamic QR Code display */}
                    <div className="flex flex-col items-center py-2">
                      {qrUrl ? (
                        <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col items-center justify-center">
                          {/* PromptPay banner logo */}
                          <div className="w-full bg-[#0c3b60] text-white py-1 px-4 rounded-md mb-2 text-center text-[10px] font-bold tracking-wider">
                            PROMPT PAY พร้อมเพย์
                          </div>
                          <img src={qrUrl} alt="PromptPay QR Code" className="w-[180px] h-[180px]" />
                          <div className="text-[9px] text-gray-500 mt-1.5 text-center flex items-center gap-1">
                            <QrCode className="h-3 w-3 text-gray-400" />
                            สแกนด้วยแอปธนาคารใดก็ได้
                          </div>
                        </div>
                      ) : (
                        <div className="h-[210px] flex items-center justify-center text-muted-foreground text-sm">
                          กำลังเตรียม QR Code...
                        </div>
                      )}
                    </div>

                    {/* Slip upload drag and drop area */}
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">รูปภาพหลักฐานการโอนเงิน (สลิป)</Label>
                      <div
                        className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                          dragActive
                            ? 'border-primary bg-primary/8 scale-[1.01]'
                            : 'border-border hover:border-primary/60 hover:bg-muted/40'
                        }`}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('slip-input').click()}
                      >
                        <input 
                          type="file" 
                          id="slip-input" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileInputChange}
                          disabled={submitting}
                        />
                        
                        {previewUrl ? (
                          <div className="flex flex-col items-center gap-2">
                            <img 
                              src={previewUrl} 
                              alt="Slip preview" 
                              className="max-w-full max-h-[160px] rounded-md shadow-sm border" 
                            />
                            <p className="text-xs text-primary font-semibold mt-1">เปลี่ยนรูปภาพสลิป</p>
                          </div>
                        ) : (
                          <div className="space-y-2 flex flex-col items-center">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-semibold text-sm text-foreground">
                                ลากสลิปมาวางที่นี่ หรือ คลิกเพื่ออัปโหลด
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                รองรับไฟล์รูปภาพ PNG, JPG, JPEG
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feedback Messages */}
                    {error && (
                      <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm font-medium text-center flex items-center justify-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                    {successMsg && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-md text-sm font-medium text-center">
                        {successMsg}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? 'กำลังส่งข้อมูล...' : 'ส่งสลิปเพื่อตรวจสอบ'}
                    </Button>
                  </form>

                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center border border-dashed rounded-lg bg-muted/50">
                  <AlertTriangle className="h-10 w-10 text-yellow-500 mb-3" />
                  <p className="font-semibold text-foreground">คุณยังไม่ได้รับมอบหมายบัญชีธนาคารสำหรับโอนเงิน</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                    กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดบัญชีธนาคารรับชำระเงินที่ต้องการให้คุณโอน
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
