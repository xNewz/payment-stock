'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { 
  ShieldAlert, 
  Users, 
  CreditCard, 
  Check, 
  X, 
  UserPlus, 
  PlusCircle, 
  LogOut, 
  Edit3, 
  Eye,
  AlertTriangle,
  FolderOpen,
  Trash2,
  BarChart3,
  Search,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  RotateCcw,
  Code2,
  Copy,
  CheckCheck,
  Zap,
  Link2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

import { ChangePasswordModal } from '@/components/change-password-modal';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'users' | 'accounts' | 'transactions'
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  
  // Data lists
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Forms states
  // User creation form
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('USER');
  const [assignedAccountId, setAssignedAccountId] = useState('');
  const [userFormError, setUserFormError] = useState('');
  const [userFormSuccess, setUserFormSuccess] = useState('');
  const [userSubmitting, setUserSubmitting] = useState(false);

  // User editing form states
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editAssignedAccountId, setEditAssignedAccountId] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [editFormSuccess, setEditFormSuccess] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Bank account creation form
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [qrType, setQrType] = useState('PROMPTPAY');
  const [accountFormError, setAccountFormError] = useState('');
  const [accountFormSuccess, setAccountFormSuccess] = useState('');
  const [accountSubmitting, setAccountSubmitting] = useState(false);

  // Bank account editing form states
  const [editingAccount, setEditingAccount] = useState(null);
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editAccountName, setEditAccountName] = useState('');
  const [editQrType, setEditQrType] = useState('PROMPTPAY');
  const [editAccountFormError, setEditAccountFormError] = useState('');
  const [editAccountFormSuccess, setEditAccountFormSuccess] = useState('');
  const [editAccountSubmitting, setEditAccountSubmitting] = useState(false);

  // Slip Rejection modal state
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectedReason, setRejectedReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [slipModalOpen, setSlipModalOpen] = useState(false);
  const [viewingSlipUrl, setViewingSlipUrl] = useState('');

  // Transaction tab filter state
  const [txFilterUser, setTxFilterUser] = useState('ALL');
  const [txFilterStatus, setTxFilterStatus] = useState('ALL');
  const [txFilterAccount, setTxFilterAccount] = useState('ALL');
  const [txFilterDateFrom, setTxFilterDateFrom] = useState('');
  const [txFilterDateTo, setTxFilterDateTo] = useState('');
  const [txSearch, setTxSearch] = useState('');

  // API tab state
  const [copiedKey, setCopiedKey] = useState('');
  const [expandedAccount, setExpandedAccount] = useState(null);
  // Token management
  const [apiTokens, setApiTokens] = useState([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenExpiry, setNewTokenExpiry] = useState('');
  const [tokenSubmitting, setTokenSubmitting] = useState(false);
  const [justCreatedToken, setJustCreatedToken] = useState(null); // full token shown once
  const [tokenError, setTokenError] = useState('');

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'payment'|'user'|'account', id, label }
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Fetch initial profile
  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/auth/me?t=${Date.now()}`);
      if (!res.ok) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (data.user.role !== 'ADMIN') {
        router.push('/payment');
        return;
      }
      setAdminUser(data.user);
    } catch (err) {
      console.error(err);
      router.push('/login');
    }
  };

  // Fetch lists
  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/admin/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApiTokens = async () => {
    try {
      const res = await fetch('/api/admin/api-tokens');
      if (res.ok) {
        const data = await res.json();
        setApiTokens(data.tokens);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProfile();
      await fetchPayments();
      await fetchUsers();
      await fetchAccounts();
      await fetchApiTokens();
      setLoading(false);
    };
    init();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormSuccess('');
    setUserSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          phone: role === 'USER' ? phone : null,
          password,
          name,
          role,
          assignedAccountId: assignedAccountId ? parseInt(assignedAccountId, 10) : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'สร้างผู้ใช้ใหม่ไม่สำเร็จ');
      }

      setUserFormSuccess(`สร้างผู้ใช้ "${name}" สำเร็จแล้ว!`);
      setUsername('');
      setPhone('');
      setPassword('');
      setName('');
      setRole('USER');
      setAssignedAccountId('');
      
      // Refresh list
      fetchUsers();
    } catch (err) {
      setUserFormError(err.message);
    } finally {
      setUserSubmitting(false);
    }
  };

  const startEditingUser = (u) => {
    setEditingUser(u);
    setEditUsername(u.username);
    setEditPhone(u.phone || '');
    setEditPassword('');
    setEditName(u.name);
    setEditRole(u.role);
    setEditAssignedAccountId(u.assignedAccountId ? String(u.assignedAccountId) : '');
    setEditFormError('');
    setEditFormSuccess('');
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');
    setEditFormSuccess('');
    setEditSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          username: editUsername,
          phone: editRole === 'USER' ? editPhone : null,
          password: editPassword,
          name: editName,
          role: editRole,
          assignedAccountId: editRole === 'USER' && editAssignedAccountId ? parseInt(editAssignedAccountId, 10) : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'แก้ไขข้อมูลผู้ใช้ไม่สำเร็จ');
      }

      setEditFormSuccess('แก้ไขข้อมูลผู้ใช้สำเร็จแล้ว!');
      fetchUsers();
      fetchPayments();
      
      setTimeout(() => {
        setEditingUser(null);
        setEditFormSuccess('');
      }, 1000);
    } catch (err) {
      setEditFormError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // Create bank account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAccountFormError('');
    setAccountFormSuccess('');
    setAccountSubmitting(true);

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName,
          accountNumber,
          accountName,
          qrType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'สร้างบัญชีไม่สำเร็จ');
      }

      setAccountFormSuccess(`เพิ่มบัญชี "${bankName} (${accountName})" สำเร็จแล้ว!`);
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      setQrType('PROMPTPAY');
      
      fetchAccounts();
    } catch (err) {
      setAccountFormError(err.message);
    } finally {
      setAccountSubmitting(false);
    }
  };

  const startEditingAccount = (acc) => {
    setEditingAccount(acc);
    setEditBankName(acc.bankName);
    setEditAccountNumber(acc.accountNumber);
    setEditAccountName(acc.accountName);
    setEditQrType(acc.qrType || 'PROMPTPAY');
    setEditAccountFormError('');
    setEditAccountFormSuccess('');
  };

  const handleEditAccountSubmit = async (e) => {
    e.preventDefault();
    setEditAccountFormError('');
    setEditAccountFormSuccess('');
    setEditAccountSubmitting(true);

    try {
      const res = await fetch('/api/admin/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAccount.id,
          bankName: editBankName,
          accountNumber: editAccountNumber,
          accountName: editAccountName,
          qrType: editQrType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'แก้ไขข้อมูลบัญชีธนาคารไม่สำเร็จ');
      }

      setEditAccountFormSuccess('แก้ไขข้อมูลบัญชีธนาคารสำเร็จแล้ว!');
      fetchAccounts();
      fetchUsers();
      
      setTimeout(() => {
        setEditingAccount(null);
        setEditAccountFormSuccess('');
      }, 1000);
    } catch (err) {
      setEditAccountFormError(err.message);
    } finally {
      setEditAccountSubmitting(false);
    }
  };

  // Delete handlers
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);

    const endpointMap = {
      payment: '/api/admin/payments',
      user:    '/api/admin/users',
      account: '/api/admin/accounts',
    };

    try {
      const res = await fetch(endpointMap[deleteTarget.type], {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบข้อมูลไม่สำเร็จ');

      if (deleteTarget.type === 'payment') fetchPayments();
      else if (deleteTarget.type === 'user') { fetchUsers(); fetchPayments(); }
      else if (deleteTarget.type === 'account') { fetchAccounts(); fetchUsers(); }

      setDeleteTarget(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // API Token handlers
  const handleCreateToken = async (e) => {
    e.preventDefault();
    setTokenError('');
    setJustCreatedToken(null);
    setTokenSubmitting(true);
    try {
      const res = await fetch('/api/admin/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTokenName,
          expiresInDays: newTokenExpiry ? parseInt(newTokenExpiry, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'สร้าง token ไม่สำเร็จ');
      setJustCreatedToken(data);
      setNewTokenName('');
      setNewTokenExpiry('');
      fetchApiTokens();
    } catch (err) {
      setTokenError(err.message);
    } finally {
      setTokenSubmitting(false);
    }
  };

  const handleRevokeToken = async (id, name) => {
    if (!confirm(`ยืนยันยกเลิก token "${name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch('/api/admin/api-tokens', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('ยกเลิกไม่สำเร็จ');
      fetchApiTokens();
    } catch (err) {
      alert(err.message);
    }
  };

  // Approve payment
  const handleApprovePayment = async (id) => {
    if (!confirm('คุณต้องการอนุมัติการชำระเงินนี้ใช่หรือไม่?')) return;
    setStatusSubmitting(true);

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'APPROVED' })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'การดำเนินการล้มเหลว');
      }

      fetchPayments();
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Reject payment action from modal
  const handleRejectPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setStatusSubmitting(true);

    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPayment.id,
          status: 'REJECTED',
          rejectedReason
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'การดำเนินการล้มเหลว');
      }

      setSelectedPayment(null);
      setRejectedReason('');
      fetchPayments();
    } catch (err) {
      alert(err.message);
    } finally {
      setStatusSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
          กำลังโหลดข้อมูลแผงควบคุมผู้ดูแลระบบ...
        </h2>
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
              <ShieldAlert className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">StockVision</span>
            <span className="hidden sm:inline-flex ml-1 items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-semibold text-sm leading-none">{adminUser?.name}</span>
              <span className="text-xs text-muted-foreground mt-0.5">ผู้ดูแลระบบ</span>
            </div>
            <div className="h-7 w-px bg-border hidden sm:block" />
            <ThemeToggle />
            <div className="h-7 w-px bg-border" />
            <Button variant="ghost" size="sm" onClick={() => setIsPasswordModalOpen(true)} className="gap-2 text-muted-foreground hover:text-foreground">
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">เปลี่ยนรหัสผ่าน</span>
            </Button>
            <div className="h-7 w-px bg-border hidden sm:block" />
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
          <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">จัดการระบบผู้ใช้งาน บัญชีธนาคาร และตรวจสอบสลิปการโอนเงิน</p>
        </div>
      </div>

      {/* Admin Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <TabsList className="bg-muted/50 p-1 border rounded-lg inline-flex max-w-fit w-full sm:w-auto h-auto flex-wrap">
              <TabsTrigger value="payments" className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                รายการตรวจสลิป ({payments.filter(p => p.status === 'PENDING').length})
              </TabsTrigger>
              <TabsTrigger value="transactions" className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                ธุรกรรมทั้งหมด ({payments.length})
              </TabsTrigger>
              <TabsTrigger value="users" className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                จัดการผู้ใช้งาน
              </TabsTrigger>
              <TabsTrigger value="accounts" className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                จัดการบัญชีธนาคาร
              </TabsTrigger>
              <TabsTrigger value="apimanage" className="rounded-md px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                จัดการ API
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Payments Slip Verification */}
          <TabsContent value="payments">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  รายการตรวจสอบสลิปชำระเงิน
                </CardTitle>
                <CardDescription>
                  ตรวจสอบความถูกต้องของสลิปชำระเงินและอนุมัติการแจ้งโอน
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-border rounded-xl bg-secondary/5 text-muted-foreground">
                    ไม่มีรายการแจ้งชำระเงินในขณะนี้
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-bold text-xs">วัน-เวลา</TableHead>
                          <TableHead className="font-bold text-xs">ผู้ใช้งาน</TableHead>
                          <TableHead className="font-bold text-xs">บัญชีรับเงิน</TableHead>
                          <TableHead className="font-bold text-xs">จำนวนเงิน</TableHead>
                          <TableHead className="font-bold text-xs">สลิปหลักฐาน</TableHead>
                          <TableHead className="font-bold text-xs">สถานะ</TableHead>
                          <TableHead className="font-bold text-xs text-right">การจัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((p) => (
                          <TableRow key={p.id} className="hover:bg-muted/10">
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(p.createdAt).toLocaleString('th-TH', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="font-bold text-sm">{p.user.name}</div>
                              <div className="text-[10px] text-muted-foreground">@{p.user.username}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-semibold">{p.bankAccount.bankName}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{p.bankAccount.accountNumber}</div>
                            </TableCell>
                            <TableCell className="font-bold text-sm text-foreground">
                              {p.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-8"
                                onClick={() => {
                                  setViewingSlipUrl(p.slipUrl);
                                  setSlipModalOpen(true);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                ดูรูปสลิป
                              </Button>
                            </TableCell>
                            <TableCell>
                              {p.status === 'PENDING' && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                                  รอดำเนินการ
                                </Badge>
                              )}
                              {p.status === 'APPROVED' && (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                  อนุมัติสำเร็จ
                                </Badge>
                              )}
                              {p.status === 'REJECTED' && (
                                <div className="flex flex-col items-start gap-0.5">
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                                    ปฏิเสธ
                                  </Badge>
                                  {p.rejectedReason && (
                                    <span className="text-[9px] text-destructive truncate max-w-[100px]" title={p.rejectedReason}>
                                      {p.rejectedReason}
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1.5 justify-end">
                                {p.status === 'PENDING' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-8 px-2.5"
                                      onClick={() => handleApprovePayment(p.id)}
                                      disabled={statusSubmitting}
                                    >
                                      <Check className="h-3.5 w-3.5 mr-1" />
                                      อนุมัติ
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      className="font-semibold text-xs h-8 px-2.5"
                                      onClick={() => setSelectedPayment(p)}
                                      disabled={statusSubmitting}
                                    >
                                      <X className="h-3.5 w-3.5 mr-1" />
                                      ปฏิเสธ
                                    </Button>
                                  </>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => setDeleteTarget({ type: 'payment', id: p.id, label: `รายการของ ${p.user.name} จำนวน ${p.amount.toLocaleString('th-TH')} บาท` })}
                                  disabled={statusSubmitting}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: User Management */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Create User Form */}
              <Card className="lg:col-span-5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    สร้างผู้ใช้งานใหม่
                  </CardTitle>
                  <CardDescription>
                    กรอกข้อมูลบัญชีเพื่อเปิดสิทธิ์และมอบหมายช่องทางจ่ายเงิน
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userFormError && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-xs font-semibold text-center mb-4">
                      {userFormError}
                    </div>
                  )}
                  {userFormSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center mb-4">
                      {userFormSuccess}
                    </div>
                  )}

                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-username">ชื่อผู้ใช้ (Username)</Label>
                      <Input
                        id="new-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="เช่น user_test"
                        required
                        disabled={userSubmitting}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-phone">เบอร์โทรศัพท์ (Phone) {role === 'USER' && <span className="text-destructive">*</span>}</Label>
                      <Input
                        id="new-phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="เช่น 0812345678"
                        required={role === 'USER'}
                        disabled={userSubmitting}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">รหัสผ่าน (Password)</Label>
                      <Input
                        type="password"
                        id="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="รหัสผ่านผู้ใช้"
                        required
                        disabled={userSubmitting}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-name">ชื่อ-นามสกุล (Name)</Label>
                      <Input
                        id="new-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="เช่น สมเกียรติ ยั่งยืน"
                        required
                        disabled={userSubmitting}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-role">บทบาท (Role)</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        id="new-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={userSubmitting}
                      >
                        <option value="USER" className="bg-card">ผู้ใช้งานทั่วไป (USER)</option>
                        <option value="ADMIN" className="bg-card">ผู้ดูแลระบบ (ADMIN)</option>
                      </select>
                    </div>

                    {role === 'USER' && (
                      <div className="space-y-2">
                        <Label htmlFor="assign-account">มอบหมายบัญชีธนาคารรับเงิน</Label>
                        <select 
                          className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          id="assign-account"
                          value={assignedAccountId}
                          onChange={(e) => setAssignedAccountId(e.target.value)}
                          disabled={userSubmitting}
                        >
                          <option value="" className="bg-card">-- ไม่ระบุ (โอนบัญชีใดก็ได้) --</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id} className="bg-card">
                              {acc.bankName} - {acc.accountNumber} ({acc.accountName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={userSubmitting}
                    >
                      {userSubmitting ? 'กำลังบันทึก...' : 'สร้างสมาชิกใหม่'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* List users */}
              <Card className="lg:col-span-7 shadow-sm min-h-[500px]">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    รายชื่อผู้ใช้งานทั่วไปในระบบ
                  </CardTitle>
                  <CardDescription>
                    รายชื่อผู้ใช้ที่ลงทะเบียนแล้ว (ไม่รวมแอดมิน) และบัญชีธนาคารรับเงินที่ถูกเลือกให้
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-bold text-xs">ชื่อ / รายละเอียด</TableHead>
                          <TableHead className="font-bold text-xs">บทบาท</TableHead>
                          <TableHead className="font-bold text-xs">บัญชีรับเงิน</TableHead>
                          <TableHead className="font-bold text-xs text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter(u => u.role !== 'ADMIN').length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                              ยังไม่พบข้อมูลผู้ใช้งานทั่วไปในระบบ
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.filter(u => u.role !== 'ADMIN').map((u) => (
                            <TableRow key={u.id} className="hover:bg-muted/10">
                              <TableCell>
                                <div className="font-bold text-sm">{u.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  @{u.username} {u.phone ? `| 📞 ${u.phone}` : ''}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-indigo-500/5 text-indigo-300 border-indigo-500/10 text-[10px] uppercase font-bold">
                                  {u.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {u.assignedAccount ? (
                                  <div className="text-xs">
                                    <div className="font-semibold text-indigo-400">{u.assignedAccount.bankName}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{u.assignedAccount.accountNumber}</div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-destructive font-semibold">
                                    ยังไม่ได้กำหนดบัญชี
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1.5 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 px-2.5"
                                    onClick={() => startEditingUser(u)}
                                  >
                                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                                    แก้ไข
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteTarget({ type: 'user', id: u.id, label: `${u.name} (@${u.username})` })}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Tab 3: Bank Accounts Management */}
          <TabsContent value="accounts">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Create Account Form */}
              <Card className="lg:col-span-5 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PlusCircle className="h-5 w-5 text-primary" />
                    เพิ่มบัญชีรับเงินใหม่
                  </CardTitle>
                  <CardDescription>
                    เพิ่มข้อมูลบัญชีธนาคารปลายทางสำหรับการรับชำระเงิน
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {accountFormError && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-xs font-semibold text-center mb-4">
                      {accountFormError}
                    </div>
                  )}
                  {accountFormSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center mb-4">
                      {accountFormSuccess}
                    </div>
                  )}

                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bank-name">ชื่อธนาคาร / บริการ</Label>
                      <Input
                        id="bank-name"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="เช่น ธนาคารกสิกรไทย (KBANK) หรือ พร้อมเพย์"
                        required
                        disabled={accountSubmitting}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-number">เลขที่บัญชี / เบอร์พร้อมเพย์</Label>
                      <Input
                        id="account-number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="เช่น 123-4-56789-0 หรือ 0812345678"
                        required
                        disabled={accountSubmitting}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="account-name">ชื่อเจ้าของบัญชี</Label>
                      <Input
                        id="account-name"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="เช่น บจก. สต็อกวิชั่น คอร์ป"
                        required
                        disabled={accountSubmitting}
                        className="bg-background/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qr-type">ประเภท QR Code สำหรับจ่ายเงิน</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        id="qr-type"
                        value={qrType}
                        onChange={(e) => setQrType(e.target.value)}
                        disabled={accountSubmitting}
                      >
                        <option value="PROMPTPAY" className="bg-card">สร้าง QR PromptPay อัตโนมัติ (Dynamic/Static)</option>
                        <option value="BANK_TRANSFER" className="bg-card">โอนเข้าเลขบัญชีธนาคาร (ไม่ใช้ QR)</option>
                      </select>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={accountSubmitting}
                    >
                      {accountSubmitting ? 'กำลังบันทึก...' : 'เพิ่มบัญชีธนาคาร'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* List Bank Accounts */}
              <Card className="lg:col-span-7 shadow-sm min-h-[500px]">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    บัญชีธนาคารทั้งหมดในระบบ
                  </CardTitle>
                  <CardDescription>
                    รายการบัญชีรับโอนเงินที่จะใช้สร้างคิวอาร์โค้ดชำระเงินให้กับสมาชิก
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="font-bold text-xs">ธนาคาร</TableHead>
                          <TableHead className="font-bold text-xs">เลขบัญชี / เบอร์</TableHead>
                          <TableHead className="font-bold text-xs">ชื่อบัญชี</TableHead>
                          <TableHead className="font-bold text-xs text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                              ยังไม่พบข้อมูลบัญชีธนาคารในระบบ
                            </TableCell>
                          </TableRow>
                        ) : (
                          accounts.map((acc) => (
                            <TableRow key={acc.id} className="hover:bg-muted/10">
                              <TableCell className="font-bold text-sm text-indigo-400">{acc.bankName}</TableCell>
                              <TableCell className="font-mono text-sm font-semibold">{acc.accountNumber}</TableCell>
                              <TableCell className="text-sm">{acc.accountName}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1.5 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 px-2.5"
                                    onClick={() => startEditingAccount(acc)}
                                  >
                                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                                    แก้ไข
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteTarget({ type: 'account', id: acc.id, label: `${acc.bankName} - ${acc.accountNumber}` })}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Tab 4: Transaction History */}
          <TabsContent value="transactions">
            {(() => {
              // Compute filtered transactions
              const filteredTx = payments.filter(p => {
                if (txFilterUser !== 'ALL' && String(p.userId || p.user?.id) !== txFilterUser && p.user?.username !== txFilterUser) return false;
                if (txFilterStatus !== 'ALL' && p.status !== txFilterStatus) return false;
                if (txFilterAccount !== 'ALL' && String(p.bankAccount?.accountNumber) !== txFilterAccount) return false;
                if (txFilterDateFrom) {
                  const from = new Date(txFilterDateFrom);
                  from.setHours(0, 0, 0, 0);
                  if (new Date(p.createdAt) < from) return false;
                }
                if (txFilterDateTo) {
                  const to = new Date(txFilterDateTo);
                  to.setHours(23, 59, 59, 999);
                  if (new Date(p.createdAt) > to) return false;
                }
                if (txSearch) {
                  const q = txSearch.toLowerCase();
                  const match =
                    p.user?.name?.toLowerCase().includes(q) ||
                    p.user?.username?.toLowerCase().includes(q) ||
                    p.bankAccount?.bankName?.toLowerCase().includes(q) ||
                    p.bankAccount?.accountNumber?.includes(q) ||
                    String(p.amount).includes(q);
                  if (!match) return false;
                }
                return true;
              });

              const totalAmount = filteredTx.reduce((sum, p) => sum + (p.amount || 0), 0);
              const approvedAmount = filteredTx.filter(p => p.status === 'APPROVED').reduce((sum, p) => sum + (p.amount || 0), 0);
              const pendingCount = filteredTx.filter(p => p.status === 'PENDING').length;
              const rejectedCount = filteredTx.filter(p => p.status === 'REJECTED').length;

              // unique users for filter dropdown
              const uniqueUsers = Array.from(new Map(payments.map(p => [p.user?.username, p.user])).values()).filter(Boolean);
              const uniqueAccounts = Array.from(new Map(payments.map(p => [p.bankAccount?.accountNumber, p.bankAccount])).values()).filter(Boolean);

              const hasFilters = txFilterUser !== 'ALL' || txFilterStatus !== 'ALL' || txFilterAccount !== 'ALL' || txFilterDateFrom || txFilterDateTo || txSearch;

              return (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card border rounded-xl p-4 flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">รายการทั้งหมด</span>
                      <span className="text-2xl font-bold">{filteredTx.length}</span>
                      <span className="text-[10px] text-muted-foreground">รายการ</span>
                    </div>
                    <div className="bg-card border rounded-xl p-4 flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">ยอดรวมที่อนุมัติ</span>
                      <span className="text-2xl font-bold text-emerald-400">{approvedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-muted-foreground">บาท</span>
                    </div>
                    <div className="bg-card border rounded-xl p-4 flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">รอดำเนินการ</span>
                      <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
                      <span className="text-[10px] text-muted-foreground">รายการ</span>
                    </div>
                    <div className="bg-card border rounded-xl p-4 flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">ถูกปฏิเสธ</span>
                      <span className="text-2xl font-bold text-destructive">{rejectedCount}</span>
                      <span className="text-[10px] text-muted-foreground">รายการ</span>
                    </div>
                  </div>

                  {/* Filters */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        กรองข้อมูลธุรกรรม
                        {hasFilters && (
                          <button
                            onClick={() => { setTxFilterUser('ALL'); setTxFilterStatus('ALL'); setTxFilterAccount('ALL'); setTxFilterDateFrom(''); setTxFilterDateTo(''); setTxSearch(''); }}
                            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <RotateCcw className="h-3 w-3" />
                            ล้างตัวกรอง
                          </button>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="ค้นหาชื่อ, username, ธนาคาร..."
                            value={txSearch}
                            onChange={e => setTxSearch(e.target.value)}
                            className="w-full pl-8 pr-3 h-9 rounded-md border border-input bg-background/50 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </div>

                        {/* User filter */}
                        <select
                          value={txFilterUser}
                          onChange={e => setTxFilterUser(e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="ALL">👤 ผู้ใช้ทั้งหมด</option>
                          {uniqueUsers.map(u => (
                            <option key={u.username} value={u.username}>{u.name} (@{u.username})</option>
                          ))}
                        </select>

                        {/* Status filter */}
                        <select
                          value={txFilterStatus}
                          onChange={e => setTxFilterStatus(e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="ALL">🗂 ทุกสถานะ</option>
                          <option value="PENDING">⏳ รอดำเนินการ</option>
                          <option value="APPROVED">✅ อนุมัติแล้ว</option>
                          <option value="REJECTED">❌ ถูกปฏิเสธ</option>
                        </select>

                        {/* Date range */}
                        <div className="flex gap-2 items-center">
                          <input
                            type="date"
                            value={txFilterDateFrom}
                            onChange={e => setTxFilterDateFrom(e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            title="จากวันที่"
                          />
                          <span className="text-muted-foreground text-xs shrink-0">ถึง</span>
                          <input
                            type="date"
                            value={txFilterDateTo}
                            onChange={e => setTxFilterDateTo(e.target.value)}
                            className="h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            title="ถึงวันที่"
                          />
                        </div>

                        {/* Account filter */}
                        <select
                          value={txFilterAccount}
                          onChange={e => setTxFilterAccount(e.target.value)}
                          className="h-9 w-full rounded-md border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="ALL">🏦 บัญชีทั้งหมด</option>
                          {uniqueAccounts.map(acc => (
                            <option key={acc.accountNumber} value={acc.accountNumber}>
                              {acc.bankName} – {acc.accountNumber}
                            </option>
                          ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transaction Table */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          รายการธุรกรรม
                        </CardTitle>
                        <span className="text-xs text-muted-foreground">
                          แสดง <strong>{filteredTx.length}</strong> / {payments.length} รายการ
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {filteredTx.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                          <Filter className="h-8 w-8 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                        </div>
                      ) : (
                        <div className="overflow-auto">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="font-bold text-xs pl-4">วัน-เวลา</TableHead>
                                <TableHead className="font-bold text-xs">ผู้ใช้งาน</TableHead>
                                <TableHead className="font-bold text-xs">บัญชีรับเงิน</TableHead>
                                <TableHead className="font-bold text-xs text-right">จำนวนเงิน</TableHead>
                                <TableHead className="font-bold text-xs">สถานะ</TableHead>
                                <TableHead className="font-bold text-xs">สลิป</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTx.map(p => (
                                <TableRow key={p.id} className="hover:bg-muted/10">
                                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap pl-4">
                                    {new Date(p.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-bold text-sm">{p.user.name}</div>
                                    <div className="text-[10px] text-muted-foreground">@{p.user.username}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-xs font-semibold">{p.bankAccount.bankName}</div>
                                    <div className="text-[10px] text-muted-foreground font-mono">{p.bankAccount.accountNumber}</div>
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-sm">
                                    {p.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                                  </TableCell>
                                  <TableCell>
                                    {p.status === 'PENDING' && (
                                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">รอดำเนินการ</Badge>
                                    )}
                                    {p.status === 'APPROVED' && (
                                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">อนุมัติสำเร็จ</Badge>
                                    )}
                                    {p.status === 'REJECTED' && (
                                      <div className="flex flex-col gap-0.5">
                                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">ปฏิเสธ</Badge>
                                        {p.rejectedReason && (
                                          <span className="text-[9px] text-destructive max-w-[100px] truncate" title={p.rejectedReason}>{p.rejectedReason}</span>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7 px-2"
                                      onClick={() => { setViewingSlipUrl(p.slipUrl); setSlipModalOpen(true); }}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Per-user summary */}
                  {txFilterUser === 'ALL' && (
                    <Card className="shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          สรุปรายการแยกตามผู้ใช้
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="font-bold text-xs pl-4">ผู้ใช้งาน</TableHead>
                              <TableHead className="font-bold text-xs text-center">รวมรายการ</TableHead>
                              <TableHead className="font-bold text-xs text-center">รอ</TableHead>
                              <TableHead className="font-bold text-xs text-center">อนุมัติ</TableHead>
                              <TableHead className="font-bold text-xs text-center">ปฏิเสธ</TableHead>
                              <TableHead className="font-bold text-xs text-right pr-4">ยอดรวมที่อนุมัติ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uniqueUsers.map(u => {
                              const uPayments = filteredTx.filter(p => p.user?.username === u.username);
                              if (uPayments.length === 0) return null;
                              const uApproved = uPayments.filter(p => p.status === 'APPROVED');
                              const uPending = uPayments.filter(p => p.status === 'PENDING');
                              const uRejected = uPayments.filter(p => p.status === 'REJECTED');
                              const uTotal = uApproved.reduce((s, p) => s + (p.amount || 0), 0);
                              return (
                                <TableRow
                                  key={u.username}
                                  className="hover:bg-muted/10 cursor-pointer"
                                  onClick={() => setTxFilterUser(u.username)}
                                  title="คลิกเพื่อกรองรายการของผู้ใช้นี้"
                                >
                                  <TableCell className="pl-4">
                                    <div className="font-bold text-sm">{u.name}</div>
                                    <div className="text-[10px] text-muted-foreground">@{u.username}</div>
                                  </TableCell>
                                  <TableCell className="text-center font-semibold text-sm">{uPayments.length}</TableCell>
                                  <TableCell className="text-center">
                                    {uPending.length > 0 ? (
                                      <span className="text-amber-400 font-bold text-sm">{uPending.length}</span>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-emerald-400 font-bold text-sm">{uApproved.length}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {uRejected.length > 0 ? (
                                      <span className="text-destructive font-bold text-sm">{uRejected.length}</span>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right pr-4 font-bold text-sm text-emerald-400">
                                    {uTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })()}
          </TabsContent>

          {/* Tab 5: API Management */}
          <TabsContent value="apimanage">
            {(() => {
              const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

              const copyToClipboard = (text, key) => {
                navigator.clipboard.writeText(text).then(() => {
                  setCopiedKey(key);
                  setTimeout(() => setCopiedKey(''), 2000);
                });
              };

              const CopyBtn = ({ text, id }) => (
                <button
                  onClick={() => copyToClipboard(text, id)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted/50 transition-colors shrink-0"
                  title="คัดลอก URL"
                >
                  {copiedKey === id
                    ? <><CheckCheck className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">คัดลอกแล้ว</span></>
                    : <><Copy className="h-3 w-3" /><span>คัดลอก</span></>}
                </button>
              );

              const queryParams = [
                { name: 'status',   example: 'APPROVED', desc: 'กรองสถานะ: PENDING | APPROVED | REJECTED' },
                { name: 'dateFrom', example: '2025-01-01', desc: 'ตั้งแต่วันที่ (YYYY-MM-DD)' },
                { name: 'dateTo',   example: '2025-12-31', desc: 'ถึงวันที่ (YYYY-MM-DD)' },
                { name: 'username', example: 'user01',     desc: 'กรองตาม username ของผู้ใช้' },
                { name: 'page',     example: '1',          desc: 'หน้าที่ (pagination, เริ่มที่ 1)' },
                { name: 'limit',    example: '50',         desc: 'จำนวนต่อหน้า (1-200, ค่าเริ่มต้น: 50)' },
              ];

              return (
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-indigo-500/5 to-purple-500/5 p-5 flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">จัดการ Dashboard API</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        เรียก API จาก web ภายนอกโดยใส่ <code className="bg-muted px-1 py-0.5 rounded text-xs">Authorization: Bearer &lt;token&gt;</code> ใน header — สร้าง token ได้ด้านล่าง
                      </p>
                    </div>
                  </div>

                  {/* Token Management Card */}
                  <Card className="shadow-sm border-primary/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        API Tokens
                        <span className="ml-auto text-[10px] font-normal text-muted-foreground">{apiTokens.length} tokenในระบบ</span>
                      </CardTitle>
                      <CardDescription>สร้าง token เพื่อให้ web หรือแอปภายนอกเรียก Dashboard API ได้</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">

                      {/* Create form */}
                      <form onSubmit={handleCreateToken} className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          placeholder="ชื่อ token เช่น Dashboard App, Analytics Site"
                          value={newTokenName}
                          onChange={e => setNewTokenName(e.target.value)}
                          required
                          className="flex-1 h-9 rounded-md border border-input bg-background/50 px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <select
                          value={newTokenExpiry}
                          onChange={e => setNewTokenExpiry(e.target.value)}
                          className="h-9 rounded-md border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">ไม่มีวันหมดอายุ</option>
                          <option value="30">30 วัน</option>
                          <option value="90">90 วัน</option>
                          <option value="180">180 วัน</option>
                          <option value="365">1 ปี</option>
                        </select>
                        <Button type="submit" disabled={tokenSubmitting} className="h-9 gap-1.5 shrink-0">
                          <Zap className="h-3.5 w-3.5" />
                          {tokenSubmitting ? 'กำลังสร้าง...' : 'สร้าง Token'}
                        </Button>
                      </form>

                      {tokenError && (
                        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">{tokenError}</div>
                      )}

                      {/* Newly created token — show once */}
                      {justCreatedToken && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCheck className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-bold text-emerald-400">สร้าง Token สำเร็จ — คัดลอกเก็บไว้ Token จะไม่ถูกแสดงอีก</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-md bg-background border border-border px-3 py-2">
                            <code className="font-mono text-xs text-amber-400 flex-1 break-all">{justCreatedToken.token}</code>
                            <CopyBtn text={justCreatedToken.token} id="new-token" />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            วิธีใช้: <code className="bg-muted px-1 rounded">Authorization: Bearer {justCreatedToken.token}</code>
                          </p>
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setJustCreatedToken(null)}>ปิดการแสดง</Button>
                        </div>
                      )}

                      {/* Token list */}
                      {apiTokens.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                          ยังไม่มี API Token — สร้างด้านบน
                        </div>
                      ) : (
                        <div className="rounded-md border border-border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left px-3 py-2 font-bold">ชื่อ</th>
                                <th className="text-left px-3 py-2 font-bold">Token</th>
                                <th className="text-left px-3 py-2 font-bold">สร้างเมื่อ</th>
                                <th className="text-left px-3 py-2 font-bold">ใช้ล่าสุด</th>
                                <th className="text-left px-3 py-2 font-bold">วันหมด</th>
                                <th className="px-3 py-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {apiTokens.map((t, i) => (
                                <tr key={t.id} className={`${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'} ${t.isExpired ? 'opacity-50' : ''}`}>
                                  <td className="px-3 py-2 font-semibold">
                                    {t.name}
                                    {t.isExpired && <span className="ml-1.5 text-[10px] text-destructive font-bold">(EXPIRED)</span>}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-muted-foreground">{t.tokenMask}</td>
                                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString('th-TH')}</td>
                                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{t.lastUsedAt ? new Date(t.lastUsedAt).toLocaleDateString('th-TH') : 'ยังไม่เคยใช้'}</td>
                                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{t.expiresAt ? new Date(t.expiresAt).toLocaleDateString('th-TH') : 'ไม่หมดอายุ'}</td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      onClick={() => handleRevokeToken(t.id, t.name)}
                                      className="text-destructive hover:text-destructive/80 transition-colors"
                                      title="ยกเลิก Token"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Endpoint 1: Summary */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">GET</span>
                          <CardTitle className="text-sm font-mono">/api/dashboard</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <CopyBtn text={`${baseUrl}/api/dashboard`} id="idx" />
                          <a
                            href="/api/dashboard"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted/50 transition-colors"
                          >
                            <Zap className="h-3 w-3" />
                            <span>ทดสอบ</span>
                          </a>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">สรุปภาพรวมทุกบัญชีธนาคาร พร้อม stats และ link ไปยัง endpoint แต่ละบัญชี</p>
                      <div className="rounded-md bg-muted/30 border border-border p-3 font-mono text-xs text-muted-foreground break-all">
                        {baseUrl}/api/dashboard
                      </div>
                    </CardContent>
                  </Card>

                  {/* Endpoint 2: Per-account (dynamic) */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">GET</span>
                        <CardTitle className="text-sm font-mono">/api/dashboard/<span className="text-primary">[accountId]</span></CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        รายการธุรกรรมละเอียดของแต่ละบัญชี — <strong>Dynamic:</strong> เมื่อเพิ่มบัญชีใหม่ endpoint ใหม่จะถูกสร้างอัตโนมัติเลย
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">

                      {/* Query params table */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Query Parameters</p>
                        <div className="rounded-md border border-border overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left px-3 py-2 font-bold">Param</th>
                                <th className="text-left px-3 py-2 font-bold">ตัวอย่าง</th>
                                <th className="text-left px-3 py-2 font-bold">คำอธิบาย</th>
                              </tr>
                            </thead>
                            <tbody>
                              {queryParams.map((p, i) => (
                                <tr key={p.name} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                  <td className="px-3 py-2 font-mono text-primary font-semibold">{p.name}</td>
                                  <td className="px-3 py-2 font-mono text-amber-400">{p.example}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{p.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Per-account endpoint list */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Endpoints ที่ใช้ได้ไนศนี้ ({accounts.length} บัญชี)
                        </p>
                        {accounts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg">
                            ยังไม่มีบัญชีธนาคาร — เพิ่มบัญชีในแท็บ จัดการบัญชีธนาคาร
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {accounts.map((acc) => {
                              const url = `${baseUrl}/api/dashboard/${acc.id}`;
                              const isExpanded = expandedAccount === acc.id;
                              return (
                                <div key={acc.id} className="rounded-lg border border-border overflow-hidden">
                                  {/* Account header row */}
                                  <div className="flex items-center gap-3 px-4 py-3 bg-muted/20">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">GET</span>
                                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <code className="font-mono text-xs text-foreground flex-1 min-w-0 truncate">
                                      /api/dashboard/<span className="text-primary font-bold">{acc.id}</span>
                                    </code>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="hidden sm:block text-[10px] text-muted-foreground">{acc.bankName} – {acc.accountNumber}</span>
                                      <CopyBtn text={url} id={`acc-${acc.id}`} />
                                      <a
                                        href={`/api/dashboard/${acc.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted/50 transition-colors"
                                      >
                                        <Zap className="h-3 w-3" />
                                        <span className="hidden sm:inline">ทดสอบ</span>
                                      </a>
                                      <button
                                        onClick={() => setExpandedAccount(isExpanded ? null : acc.id)}
                                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-border hover:bg-muted/50 transition-colors"
                                      >
                                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expanded: URL builder */}
                                  {isExpanded && (
                                    <div className="px-4 py-3 border-t border-border space-y-3 bg-background/50">
                                      <p className="text-xs text-muted-foreground font-semibold">ตัวอย่าง URL พร้อม Query Params:</p>
                                      <div className="space-y-1.5">
                                        {[
                                          { label: 'เฉพาะอนุมัติ', q: '?status=APPROVED' },
                                          { label: 'รอดำเนินการ', q: '?status=PENDING' },
                                          { label: 'ช่วงวันที่', q: '?dateFrom=2025-01-01&dateTo=2025-12-31' },
                                          { label: 'หน้า 2', q: '?page=2&limit=20' },
                                        ].map(({ label, q }) => {
                                          const fullUrl = `${baseUrl}/api/dashboard/${acc.id}${q}`;
                                          return (
                                            <div key={q} className="flex items-center gap-2 rounded-md bg-muted/30 border border-border px-3 py-1.5">
                                              <span className="text-[10px] text-muted-foreground shrink-0 w-28">{label}</span>
                                              <code className="font-mono text-[11px] text-amber-400 flex-1 min-w-0 truncate">{q}</code>
                                              <CopyBtn text={fullUrl} id={`acc-${acc.id}-${q}`} />
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div className="flex items-center gap-2 pt-1">
                                        <span className="text-xs text-muted-foreground">บัญชี:</span>
                                        <span className="text-xs font-semibold">{acc.bankName} – {acc.accountNumber}</span>
                                        <span className="text-xs text-muted-foreground">({acc.accountName})</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Response structure */}
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-primary" />
                        โครงสร้าง Response
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="rounded-md bg-muted/30 border border-border p-4 text-xs font-mono overflow-x-auto text-muted-foreground leading-relaxed">{`{
  "generatedAt": "2025-06-07T12:00:00.000Z",
  "account": { "id": 1, "bankName": "...", "accountNumber": "..." },
  "filters":   { "status": "APPROVED", "dateFrom": null, ... },
  "stats": {
    "totalCount":          50,
    "approvedCount":       40,
    "pendingCount":         5,
    "rejectedCount":        5,
    "totalApprovedAmount": 85000
  },
  "pagination": { "page": 1, "limit": 50, "totalPages": 1, "hasNextPage": false },
  "transactions": [
    {
      "id": 99, "amount": 1500, "status": "APPROVED",
      "slipUrl": "https://...", "createdAt": "...",
      "user": { "id": 3, "username": "user01", "name": "..." }
    }
  ]
}`}</pre>
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>

        </Tabs>
      </main>

      {/* Rejection Overlay Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg w-full max-w-md p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl" onClick={() => setSelectedPayment(null)}>×</button>
            <h3 className="text-lg font-bold text-destructive flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5" />
              ปฏิเสธรายการแจ้งชำระเงิน
            </h3>
            
            <div className="mb-4 text-sm bg-secondary/20 p-3 rounded-lg border border-border">
              <p className="mb-1">ผู้ทำรายการ: <strong>{selectedPayment.user.name}</strong></p>
              <p>จำนวนเงิน: <strong>{selectedPayment.amount.toLocaleString('th-TH')} บาท</strong></p>
            </div>

            <form onSubmit={handleRejectPaymentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reject-reason">ระบุเหตุผลในการปฏิเสธการโอนเงิน</Label>
                <Textarea
                  id="reject-reason"
                  rows={3}
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                  placeholder="เช่น สลิปซ้ำ, ยอดเงินไม่ตรง, วันเวลาไม่ถูกต้อง"
                  required
                  className="bg-background/50 border-input"
                />
              </div>

              <div className="flex gap-2.5 justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSelectedPayment(null)}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  variant="destructive"
                  disabled={statusSubmitting}
                >
                  ยืนยันการปฏิเสธ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Viewer Modal */}
      {slipModalOpen && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSlipModalOpen(false)}>
          <div className="bg-card border rounded-lg w-full max-w-sm p-5 shadow-lg relative animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl" onClick={() => setSlipModalOpen(false)}>×</button>
            <h3 className="text-sm font-bold mb-4 text-center">
              รูปภาพสลิปหลักฐานโอนเงิน
            </h3>
            <div className="w-full flex justify-center bg-black/10 p-2 rounded-lg border border-border">
              <img 
                src={viewingSlipUrl} 
                alt="Uploaded Payment Slip" 
                className="max-w-full max-h-[60vh] rounded-md object-contain shadow-lg" 
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSlipModalOpen(false)}
              className="mt-4 w-full"
            >
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg w-full max-w-md p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl" onClick={() => setEditingUser(null)}>×</button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-1.5">
              <Edit3 className="h-5 w-5 text-primary" />
              แก้ไขข้อมูลผู้ใช้งาน
            </h3>
            
            {editFormError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-xs font-semibold text-center mb-4">
                {editFormError}
              </div>
            )}
            {editFormSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center mb-4">
                {editFormSuccess}
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">ชื่อผู้ใช้ (Username)</Label>
                <Input
                  id="edit-username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  disabled={editSubmitting}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">เบอร์โทรศัพท์ (Phone) {editRole === 'USER' && <span className="text-destructive">*</span>}</Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  required={editRole === 'USER'}
                  disabled={editSubmitting}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">รหัสผ่านใหม่ (Password)</Label>
                <Input
                  type="password"
                  id="edit-password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="เว้นว่างไว้เพื่อใช้รหัสผ่านเดิม"
                  disabled={editSubmitting}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">ชื่อ-นามสกุล (Name)</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  disabled={editSubmitting}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">บทบาท (Role)</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  id="edit-role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={editSubmitting}
                >
                  <option value="USER" className="bg-card">ผู้ใช้งานทั่วไป (USER)</option>
                  <option value="ADMIN" className="bg-card">ผู้ดูแลระบบ (ADMIN)</option>
                </select>
              </div>

              {editRole === 'USER' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-assign-account">มอบหมายบัญชีธนาคารรับเงิน</Label>
                  <select 
                    className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    id="edit-assign-account"
                    value={editAssignedAccountId}
                    onChange={(e) => setEditAssignedAccountId(e.target.value)}
                    disabled={editSubmitting}
                  >
                    <option value="" className="bg-card">-- ไม่ระบุ (โอนบัญชีใดก็ได้) --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-card">
                        {acc.bankName} - {acc.accountNumber} ({acc.accountName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  disabled={editSubmitting}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  disabled={editSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {editSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bank Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg w-full max-w-md p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl" onClick={() => setEditingAccount(null)}>×</button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-1.5">
              <Edit3 className="h-5 w-5 text-primary" />
              แก้ไขข้อมูลบัญชีรับเงิน
            </h3>
            
            {editAccountFormError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-lg text-xs font-semibold text-center mb-4">
                {editAccountFormError}
              </div>
            )}
            {editAccountFormSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center mb-4">
                {editAccountFormSuccess}
              </div>
            )}

            <form onSubmit={handleEditAccountSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bank-name">ชื่อธนาคาร / บริการ</Label>
                <Input
                  id="edit-bank-name"
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  required
                  disabled={editAccountSubmitting}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-account-number">เลขที่บัญชี / เบอร์พร้อมเพย์</Label>
                <Input
                  id="edit-account-number"
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value)}
                  required
                  disabled={editAccountSubmitting}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-account-name">ชื่อเจ้าของบัญชี</Label>
                <Input
                  id="edit-account-name"
                  value={editAccountName}
                  onChange={(e) => setEditAccountName(e.target.value)}
                  required
                  disabled={editAccountSubmitting}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-qr-type">ประเภทการจ่ายเงิน</Label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  id="edit-qr-type"
                  value={editQrType}
                  onChange={(e) => setEditQrType(e.target.value)}
                  disabled={editAccountSubmitting}
                >
                  <option value="PROMPTPAY" className="bg-card">สร้าง QR PromptPay อัตโนมัติ (Dynamic/Static)</option>
                  <option value="BANK_TRANSFER" className="bg-card">โอนเข้าเลขบัญชีธนาคาร (ไม่ใช้ QR)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditingAccount(null)}
                  disabled={editAccountSubmitting}
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="submit" 
                  disabled={editAccountSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {editAccountSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-lg w-full max-w-sm p-6 shadow-lg relative animate-in fade-in zoom-in-95 duration-200">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteSubmitting}
            >×</button>

            <div className="flex flex-col items-center text-center gap-3 mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">ยืนยันการลบข้อมูล</h3>
                <p className="text-sm text-muted-foreground mt-1">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3 mb-5">
              <p className="text-xs text-center text-destructive font-semibold break-words">
                {deleteTarget.label}
              </p>
            </div>

            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteSubmitting}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 font-semibold"
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

    </div>
  );
}
