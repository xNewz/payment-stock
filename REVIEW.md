# 📋 รีวิวเว็บ `payment-stock` — สรุปครบทุก Bug + Flow + ข้อเสนอ

> **โปรเจกต์:** Payment Portal (Next.js 16.2.7 + Prisma + MySQL + JWT cookie + PromptPay QR + Manual slip verification)
> **วันที่รีวิว:** 7 มิ.ย. 2026
> **ขอบเขต:** อ่านทุกไฟล์ใน source (ไม่รวม node_modules / .next) — ครอบคลุม Security, Bug, Flow UX, Architecture
> **สถานะ:** ยังไม่ได้แก้ไข code — ไฟล์นี้คือ audit report

---

## 📑 สารบัญ

1. [สรุปภาพรวม](#-สรุปภาพรวม)
2. [Top Priority ต้องแก้ก่อน Production](#-top-priority-ต้องแก้ก่อน-production)
3. [🔴 CRITICAL Bugs (9 รายการ)](#-critical-bugs-9-รายการ)
4. [🟠 HIGH Bugs (9 รายการ)](#-high-bugs-9-รายการ)
5. [🟡 MEDIUM Bugs (14 รายการ)](#-medium-bugs-14-รายการ)
6. [🟢 LOW / Code Quality (11 รายการ)](#-low--code-quality-11-รายการ)
7. [⚠️ ข้อสังเกต Next.js 16](#️-ข้อสังเกต-nextjs-16)
8. [🔄 Flow Review: USER](#-flow-review-user-ลูกค้า)
9. [🔄 Flow Review: ADMIN](#-flow-review-admin)
10. [🚫 Flow ที่ขาด (ฟีเจอร์ที่ payment portal ต้องมี)](#-flow-ที่ขาด-ฟีเจอร์ที่-payment-portal-ปกติต้องมี)
11. [📊 ตารางสรุป Priority](#-ตารางสรุป-priority)
12. [🛠️ Roadmap แนะนำ](#-roadmap-แนะนำ)

---

## 🎯 สรุปภาพรวม

**จุดแข็ง:**
- โครงสร้าง Next.js App Router ใช้ถูก convention (Next.js 16: `await cookies()`, `await params` ✓)
- มี Tab-based admin UI ครบ 5 module (slip, transaction, user, account, api)
- มี API Token system สำหรับ external dashboard access
- มี WebView Detector (LINE auto-redirect)
- มี Theme toggle, dark mode รองรับ
- มี PM2 + deploy.sh + setup.sh + Cloudflare tunnel pattern

**จุดอ่อนหลัก:**
- **Security**: 9 Critical bugs — JWT fallback hardcoded, USER ไม่ต้องใช้รหัสผ่าน, slip ทุกใบ public, API token plain text, ไม่มี rate limit
- **Data integrity**: ไม่ validate `bankAccountId` vs `assignedAccountId`, deploy ใช้ `db push` เสี่ยง data loss
- **UX gaps**: USER ไม่เห็นประวัติการจ่าย, ไม่มี notification, double-submit ได้, สลิปลบแล้วไฟล์ค้าง
- **Missing features**: ไม่มี forgot password / notification / receipt / search / export / pagination / audit log

---

## 🚨 Top Priority ต้องแก้ก่อน Production

| # | ปัญหา | ความรุนแรง | ไฟล์ |
|---|-------|------------|------|
| 1 | USER login ไม่ต้องใช้รหัสผ่าน — รู้เบอร์ = เข้าได้ | 🔴 Critical | `app/api/auth/login/route.js` |
| 2 | สลิปทุกใบเปิด public ตามเดา URL (`/uploads/...`) | 🔴 Critical | `public/uploads/`, `app/uploads/[filename]/route.js` |
| 3 | JWT fallback secret hardcoded ใน code | 🔴 Critical | `lib/auth.js`, `app/page.js` |
| 4 | API Token เก็บ plain text ใน DB | 🔴 Critical | `app/api/admin/api-tokens/route.js` |
| 5 | ไม่ verify `bankAccountId` ตรงกับที่ assign ให้ user | 🔴 Critical | `app/api/payments/route.js` |
| 6 | File upload ไม่มี size/type validation | 🔴 Critical | `app/api/payments/route.js` |
| 7 | ไม่มี rate limit + user enumeration | 🔴 Critical | `app/api/auth/login/route.js` |
| 8 | Admin ลด role/ลบ admin หมดได้ → lockout | 🟠 High | `app/api/admin/users/route.js` |
| 9 | `prisma db push` ใน deploy = data loss risk | 🟠 High | `deploy.sh` |
| 10 | bcrypt sync block event loop | 🟠 High | ทุก auth route |
| 11 | USER ไม่เห็นประวัติการจ่าย (fetch แล้วไม่ render) | 🔴 Critical UX | `app/payment/page.js` |
| 12 | ลบ payment แล้วไฟล์สลิปไม่ถูกลบ | 🔴 Critical UX | `app/api/admin/payments/route.js` |

---

# 🔴 CRITICAL Bugs (9 รายการ)

## C1. JWT Secret มี fallback ที่เดาได้ใน source code

**ไฟล์:** `lib/auth.js:4`, `app/page.js:15`

```js
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
```

**ความเสี่ยง:** ถ้า env var ไม่โหลด (เช่นลืม `.env`, PM2 ไม่ inherit env, build cache) → ระบบใช้ secret ที่อยู่ใน repo
ใครเห็น code นี้ → mint JWT ปลอม `role=ADMIN` เข้าระบบได้ทันที

**วิธีแก้:**
```js
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is required');
```

---

## C2. USER role ล็อกอินด้วยเบอร์โทรอย่างเดียว ไม่ต้องใช้รหัสผ่าน

**ไฟล์:** `app/api/auth/login/route.js:65-72`

```js
} else {
  // Regular USER: phone-only login — no password needed
  if (!lookupByPhone) {
    return NextResponse.json({ error: '...' }, { status: 401 });
  }
  // No password check for USER role  ⚠️
}
```

**ความเสี่ยง:** ใครก็ตามที่รู้เบอร์โทรของลูกค้า → เข้าระบบเป็นคนนั้นได้
- เบอร์โทรไม่ใช่ความลับ (leak ทั่วไป, ส่ง SMS scam มาก)
- ดู payment history คนอื่น, อัปโหลดสลิปปลอมในนามเขา

**วิธีแก้:**
- ส่ง OTP ทาง SMS ก่อนออก JWT, **หรือ**
- บังคับให้ USER มีรหัสผ่านด้วย (เหมือน ADMIN)

---

## C3. ไฟล์สลิปเปิด public ทั้งหมด — ไม่มี auth

**ไฟล์:** `app/uploads/[filename]/route.js` + `public/uploads/`

**ปัญหา 1:** ไฟล์ถูกเก็บใน `public/uploads/` ซึ่ง Next.js serve เป็น static **ตัดหน้า** custom route handler → custom auth check ไม่มีทางทำงาน

**ปัญหา 2:** filename pattern `{userId}_{timestamp}_{originalName}` เดาง่าย
- `userId` = auto-increment เริ่ม 1
- `timestamp` = `Date.now()` (epoch ms)
- → bruteforce URL ได้

**ความเสี่ยง:** ใครก็ตามเดา URL `/uploads/3_1717xxxxxxxxx_slip.jpg` ได้ → ดูสลิปคนอื่น
สลิปมี PII: เลขบัญชี, ชื่อ-นามสกุล, ยอดเงิน, วันเวลา

**วิธีแก้:**
1. ย้ายไฟล์ออกจาก `public/` ไปไว้นอก web root (เช่น `./storage/uploads/`)
2. สร้าง API route `/api/uploads/[id]` ที่:
   - ตรวจ JWT cookie
   - เช็คว่า user เป็นเจ้าของ payment หรือเป็น ADMIN
   - ใช้ UUID ไม่ใช่ predictable name
3. Stream file response

---

## C4. POST `/api/payments` ไม่ตรวจ `bankAccountId` vs `assignedAccountId`

**ไฟล์:** `app/api/payments/route.js:78-88`

User ส่ง `bankAccountId` อะไรก็ได้ใน formData → ระบบ create Payment ที่เชื่อมกับบัญชีอื่น
- ตัวเลขใน admin dashboard ถูกบิดเบือน
- รายงาน Bank A อาจมีรายการของลูกค้าที่ถูก assign Bank B

**วิธีแก้:**
```js
const user = await prisma.user.findUnique({ where: { id: payload.id }});
if (user.assignedAccountId && user.assignedAccountId !== bankAccountId) {
  return NextResponse.json({ error: 'Account mismatch' }, { status: 403 });
}
```

---

## C5. ไม่มี file size limit + ไม่ validate content-type ฝั่ง server

**ไฟล์:** `app/api/payments/route.js:90-94`

```js
const bytes = await file.arrayBuffer();   // โหลดทั้งไฟล์เข้า RAM
const buffer = Buffer.from(bytes);
```

**ความเสี่ยง:**
- อัปโหลดไฟล์ 1GB → RAM ระเบิด → process ตาย (DoS)
- ไม่ check `file.type` → upload `.exe`, `.svg` (XSS via SVG script), `.php` ก็ผ่าน
- หน้า `/uploads/[filename]/route.js` map content-type จาก extension แต่ไม่ตรวจตอน upload

**วิธีแก้:**
```js
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 413 });
if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 415 });

// ตรวจ magic bytes ด้วยเพื่อให้แน่ใจ (เช่น file-type library)
```

---

## C6. API Tokens เก็บแบบ plain text ใน DB

**ไฟล์:** `app/api/admin/api-tokens/route.js:63`, `lib/apiToken.js:18-20`

```js
const rawToken = 'stv_' + randomBytes(24).toString('hex');
await prisma.apiToken.create({ data: { token: rawToken, ... } });  // ⚠️ เก็บดิบ
```

```js
const tokenRecord = await prisma.apiToken.findUnique({
  where: { token: rawToken },  // ⚠️ lookup ด้วย raw
});
```

**ความเสี่ยง:** ถ้า DB หลุด (SQL injection, backup leak) → token ทุกตัวใช้งานได้ทันที เหมือนรหัสผ่าน plain text

**วิธีแก้:**
- เก็บ `sha256(token)` ลง DB
- lookup ด้วย hash
- show raw แค่ตอนสร้างครั้งเดียว (มี UX อยู่แล้ว ใช้ได้เลย)

---

## C7. ไม่มี Rate Limiting / Brute Force Protection

**ไฟล์:** ทุก endpoint โดยเฉพาะ `/api/auth/login`

ลองรหัสได้ไม่จำกัด → attacker enumerate phone numbers + brute force admin password

**วิธีแก้:**
- ใช้ Upstash Ratelimit (Redis) หรือ in-memory counter
- จำกัด `/api/auth/login` = 5 attempts / 15 min / IP
- ใส่ Cloudflare Rate Limit Rules (มี Cloudflare tunnel อยู่แล้ว ใช้ได้)

---

## C8. User Enumeration ผ่าน error messages

**ไฟล์:** `app/api/auth/login/route.js:40-72`

Error messages ต่างกันเปิดเผยว่า user มีอยู่จริงหรือไม่:
- `"ไม่พบผู้ใช้งานในระบบ"` → user ไม่มี
- `"ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"` → user มี รหัสผิด
- `"ผู้ใช้งานทั่วไปต้องเข้าสู่ระบบด้วยเบอร์โทรศัพท์"` → leak ว่า username นี้คือ USER role

→ Attacker enumerate ได้ทั้ง username list และ phone list

**วิธีแก้:** ใช้ error เดียวกันทุกกรณี เช่น `"ข้อมูลเข้าสู่ระบบไม่ถูกต้อง"` (status 401)

---

## C9. `.env` จริงหลุดออกจาก VM + DB password อ่อน

**ไฟล์:** `.env`

```
DATABASE_URL="mysql://root:12345678@localhost:3306/payment_stock"
```

- รหัส `12345678` อ่อนมาก
- ใช้ MySQL `root` (ไม่ควร)
- ไฟล์ถูก sync มาที่เครื่อง local แล้ว → ถ้า laptop หาย/โดน steal → DB ถูกเข้าได้

**วิธีแก้:**
1. เปลี่ยน MySQL root password เป็น strong password
2. สร้าง user แยกสำหรับแอป: `payment_app` ที่มีสิทธิ์เฉพาะ DB `payment_stock`
3. อย่า sync `.env` มา dev — ใช้ `.env.local` แยกสำหรับ dev
4. เพิ่ม `.env` ใน gitignore ✓ (มีแล้ว) แต่อย่า scp มาในเครื่องที่ไม่จำเป็น

---

# 🟠 HIGH Bugs (9 รายการ)

## H1. Admin ดาวน์เกรด role ตัวเองได้ + ลบ admin หมดได้

**ไฟล์:** `app/api/admin/users/route.js:115-235`

- `PUT` ไม่ห้าม admin เปลี่ยน role ตัวเอง `ADMIN → USER` → logout ครั้งถัดไปเข้าไม่ได้
- `DELETE` ห้ามแค่ลบตัวเอง แต่ลบ admin คนอื่นจนหมดได้

**วิธีแก้:**
```js
// ก่อน update/delete
const adminCount = await prisma.user.count({ where: { role: 'ADMIN' }});
if (adminCount <= 1 && targetIsAdmin) {
  return NextResponse.json({ error: 'ต้องมี admin อย่างน้อย 1 คน' }, { status: 400 });
}
```

---

## H2. bcrypt `compareSync` / `hashSync` block event loop

**ไฟล์:** `login/route.js:52`, `password/route.js:41`, `users/route.js:88,168`

ที่ `rounds=10` ใช้เวลา ~100ms/call → block ทุก request ใน Node process เดียว
- 10 user login พร้อมกัน → server ค้าง 1 วินาที
- ในช่วง spike (เปิดเทอม / promo) ระบบล่ม

**วิธีแก้:** ใช้ async version ทุกที่
```js
const match = await bcrypt.compare(password, user.password);
const hash = await bcrypt.hash(password, 10);
```

---

## H3. ไม่มี CSRF Protection

Cookie `sameSite: 'lax'` ช่วยเฉพาะ cross-site navigation, แต่ POST state-changing requests (เช่น `/api/payments` POST, `/api/admin/*` PUT/DELETE) ยังเสี่ยง CSRF

**วิธีแก้:**
- ใส่ CSRF token (double-submit cookie pattern), หรือ
- เช็ค `Origin/Referer` header สำหรับ state-changing requests
- ใช้ `sameSite: 'strict'` ถ้าไม่ต้องการ external link เข้า

---

## H4. `deploy.sh` ใช้ `prisma db push` ใน production

**ไฟล์:** `deploy.sh:42`

`db push` คือ dev tool — sync schema → DB ทันทีโดยไม่มี migration history
- เปลี่ยน column name → drop ข้อมูล
- ไม่มี rollback path
- เปลี่ยน type → silent data conversion

**วิธีแก้:**
```bash
# แทน db push:
npx prisma migrate deploy
```
และ commit `prisma/migrations/` เข้า git

---

## H5. `prisma.js` ไม่ reuse client ใน production

**ไฟล์:** `lib/prisma.js:1-14`

```js
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();   // ⚠️ ไม่มี global cache
}
```

ใน Next.js server build อาจสร้าง multiple connections (ขึ้นกับ runtime)

**วิธีแก้:** ใช้ global pattern ทั้ง dev และ prod
```js
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
```

---

## H6. Memory leak — `URL.createObjectURL` ไม่ revoke

**ไฟล์:** `app/payment/page.js:126`

```js
setPreviewUrl(URL.createObjectURL(selectedFile));
```

ทุกครั้งเปลี่ยนไฟล์ → object URL ใหม่ แต่ของเก่าไม่ revoke → memory leak ใน browser
ผ่าน 50 ครั้ง = หลายร้อย MB ค้างใน RAM

**วิธีแก้:**
```js
useEffect(() => {
  return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
}, [previewUrl]);
```

---

## H7. ไฟล์สลิป filename collision

**ไฟล์:** `app/api/payments/route.js:98`

```js
`${payload.id}_${Date.now()}_${file.name.replace(...)}`
```

User เดียวกัน upload 2 ไฟล์ในมิลลิวินาทีเดียวกัน + ชื่อเดียวกัน → **เขียนทับไฟล์เก่า**

**วิธีแก้:**
```js
import { randomUUID } from 'crypto';
const ext = path.extname(file.name).toLowerCase();
const filename = `${payload.id}_${randomUUID()}${ext}`;
```

---

## H8. `/api/dashboard/[accountId]` Stats ดึงทุกแถวเข้า RAM

**ไฟล์:** `app/api/dashboard/[accountId]/route.js:96-100`

```js
const allForStats = await prisma.payment.findMany({ where, select: {...}});
// reduce ใน JS
```

ที่ 10k+ rows → ช้า, memory บวม, query timeout

**วิธีแก้:**
```js
const stats = await prisma.payment.groupBy({
  by: ['status'],
  where,
  _count: { _all: true },
  _sum: { amount: true },
});
```

---

## H9. ไม่มี middleware กลางสำหรับ auth

ทุก route reimplement `checkAdmin()`, `verifyAuth()` ซ้ำ
ถ้าเพิ่ม route ใหม่แล้วลืม → ช่องโหว่ทันที

**วิธีแก้:** สร้าง `middleware.js` ที่ root
```js
export const config = { matcher: ['/api/admin/:path*', '/admin/:path*'] };
export async function middleware(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return NextResponse.redirect('/login');
  // verify + check role
}
```

---

# 🟡 MEDIUM Bugs (14 รายการ)

## M1. Log ชื่อผู้ใช้ใน console
**ไฟล์:** `app/api/auth/login/route.js:29`
`console.log` ใส่ username/phone → PII ไหลเข้า `logs/pm2-out.log`
**แก้:** hash หรือลบออก, ใช้ structured logging (เช่น pino) ที่ filter PII

## M2. JWT 7-day expiry + ไม่มี revocation
ลบ user → JWT ยังใช้ได้, เปลี่ยน password → session อื่นไม่ถูก kick
**แก้:** เก็บ `tokenVersion` ใน user, bump เมื่อ password change/revoke

## M3. Cookie `secure` ขึ้นกับ `NODE_ENV`
**ไฟล์:** `login/route.js:82`
ถ้า env ผิด → cookie ส่งผ่าน HTTP ได้
**แก้:** บังคับ `secure: true` ใน production, ตรวจ HTTPS via `x-forwarded-proto`

## M4. `force-dynamic` ใส่แค่ `/api/auth/me`
Admin routes อื่นอาจถูก Next.js cache → ข้อมูลค้าง
**แก้:** ใส่ `export const dynamic = 'force-dynamic'` ทุก auth-required route

## M5. ไม่มี validation `phone` format ใน admin user CRUD
**ไฟล์:** `app/api/admin/users/route.js:62`
เก็บ phone อะไรก็ได้ แต่ login ต้อง `/^0\d{9}$/` → user จะ login ไม่ได้
**แก้:** validate ฝั่ง server, normalize ก่อนเก็บ (strip dash/space)

## M6. Race condition + stale state ใน `fetchData`
**ไฟล์:** `app/payment/page.js:36-57`
ไม่มี `AbortController` → setState บน unmounted component
**แก้:** ใช้ `AbortController` + cleanup

## M7. Admin boot — 5 sequential awaits
**ไฟล์:** `app/admin/page.js:189-196`
หน้า admin ค้าง 1-3 วินาที
**แก้:** `await Promise.all([fetchProfile(), fetchPayments(), ...])`

## M8. `confirm()` / `alert()` dialog
**ไฟล์:** `app/admin/page.js:368, 391, 422`
UX แตกบนมือถือ, ไม่ตรง design system
**แก้:** ใช้ Dialog component ที่มีอยู่แล้ว

## M9. ไม่มี max amount + edge case
amount = `parseFloat()` → ส่ง `Infinity`, `1e100`, `-0.0001` ผ่านได้
MySQL `Float` truncate precision
**แก้:** `amount > 0 && amount <= 1_000_000 && Number.isFinite(amount)` + เปลี่ยน schema เป็น `Decimal`

## M10. PromptPay payload edge case
**ไฟล์:** `lib/promptpay.js:17-26`
เงื่อนไข `length === 9 && !startsWith('0')` แปลก — `padStart(13, '0')` format ผิดสำหรับ mobile ไม่มี 0 นำหน้า
**แก้:** strict validate input ก่อนเรียก, throw error ถ้า invalid

## M11. ใช้ `<img>` ไม่ใช่ `next/image`
ทุกหน้าใช้ `<img>` → ไม่ optimize → bandwidth/CLS แย่
**แก้:** เปลี่ยนเป็น `next/image` (config `remotePatterns` ถ้าต้อง)

## M12. ไม่มี `loading.js` / `error.js` boundary
Handle loading state ใน component เอง → ไม่ใช้ Next.js convention
**แก้:** เพิ่ม `app/loading.js`, `app/error.js`, `app/admin/loading.js`, etc.

## M13. `Float` ใน Prisma สำหรับเงิน
**ไฟล์:** `prisma/schema.prisma:40`
`amount Float` มี precision loss
**แก้:** `amount Decimal @db.Decimal(12, 2)`

## M14. ไม่มี Index ที่จำเป็น
schema ไม่มี `@@index` ใน `Payment.createdAt`, `Payment.status`, `Payment.bankAccountId`
**แก้:** เพิ่ม `@@index([bankAccountId, status, createdAt])`, `@@index([userId, createdAt])`

---

# 🟢 LOW / Code Quality (11 รายการ)

## L1. ไม่มี test เลย
ไม่มี `__tests__`, ไม่มี test runner (vitest/jest)
**แก้:** เพิ่ม vitest + supertest สำหรับ API routes อย่างน้อย happy path

## L2. ไม่ใช้ TypeScript
มี `jsconfig.json` แต่ไม่ใช่ `tsconfig.json` → bug ที่ตรวจ compile-time หายไป
**แก้:** convert เป็น TS แบบค่อยเป็นค่อยไป (rename `.js` → `.ts` ทีละไฟล์)

## L3. `next.config.mjs` ว่าง
ไม่มี security headers (CSP, HSTS, X-Frame-Options)
**แก้:** เพิ่ม `headers()` config block สำหรับ security headers

## L4. Magic string roles
`"USER"|"ADMIN"` กระจายทั้ง codebase
**แก้:** สร้าง `lib/constants.js` export `ROLES = { USER, ADMIN }`

## L5. `successMsg` ไม่ auto-dismiss
**ไฟล์:** `app/payment/page.js`
ค้างจนกว่า user refresh
**แก้:** `setTimeout(() => setSuccessMsg(''), 5000)`

## L6. WebViewDetector UI flash
**ไฟล์:** `components/webview-detector.js`
ใน LINE: set `isWebview(true)` ก่อน redirect → user เห็น modal สั้น ๆ
**แก้:** redirect ก่อน setState, หรือเช็ค `openExternalBrowser=1` ก่อน

## L7. README.md เป็น template default
ยังเป็น `create-next-app` template — ไม่มี doc โปรเจกต์จริง
**แก้:** เขียน README ใหม่ — install, dev, deploy, env, schema

## L8. ไม่มี healthcheck endpoint
PM2/Cloudflare ไม่มีปลายทาง ping
**แก้:** `/api/health` → `{ status: 'ok', db: 'connected' }`

## L9. ไม่มี backup strategy
`public/uploads/` (สลิป) + MySQL DB ไม่มี backup
**แก้:** cron `mysqldump` + tar `uploads/` ส่งขึ้น S3/Backblaze

## L10. `deploy.sh` ไม่ backup ก่อน
**ไฟล์:** `deploy.sh:34`
`git reset --hard` ลบ uncommitted edits — ไม่มี backup `.env` หรือ DB
**แก้:** เพิ่ม snapshot step ก่อน reset

## L11. Logout return 200 แม้ไม่มี session
ไม่ใช่ปัญหาแต่ implicit
**แก้:** เช็คก่อน ส่ง 401 ถ้าไม่มี session (optional)

---

# ⚠️ ข้อสังเกต Next.js 16

[AGENTS.md](./AGENTS.md) เตือนว่านี่คือ Next.js เวอร์ชันที่มี breaking changes ใหม่

**ตรวจแล้ว ✓ ใช้ถูก:**
- `await cookies()` — ใช้ในทุก auth route ✓
- `await params` — ใช้ใน `[accountId]/route.js`, `[filename]/route.js` ✓

**ควรตรวจเพิ่ม:**
- Caching defaults ใน Next.js 16 (fetch caching เปลี่ยน?)
- Request memoization patterns
- Dynamic API access (`headers()`, `cookies()` ใน RSC)
- อ่าน `node_modules/next/dist/docs/` ตาม instruction ใน AGENTS.md ก่อนแก้ภาพรวม

---

# 🔄 Flow Review: USER (ลูกค้า)

```
[ เปิดเว็บ ] → [ /login ] → [ /payment ] → อัปโหลดสลิป → รอ admin approve
```

| Step | สิ่งที่ user เห็น | ปัญหา / ความสับสน |
|------|------------------|---------------------|
| 1. เปิดผ่าน LINE | "กรุณาเปิดในเบราว์เซอร์" → auto-redirect | ✅ LINE auto-kick ทำงาน<br>🟡 Facebook/IG/TikTok แค่แสดง modal **ไม่ kick** → drop-off สูง |
| 2. หน้า login | กรอกเบอร์โทร 10 หลัก | ✅ UX ดี: ปุ่มเปลี่ยนเป็น "เข้าสู่ระบบ" อัตโนมัติ |
| 3. กด Enter | login สำเร็จ → `/payment` | 🔴 **ไม่มี password** = รู้เบอร์เข้าได้<br>🟡 ถ้าเบอร์มี dash → DB อาจหาไม่เจอ |
| 4. หน้า /payment โหลด | "คุณยังไม่ได้รับมอบหมายบัญชี" ถ้าไม่ assign | ✅ handle ดี — แต่ไม่มีเบอร์ติดต่อ admin |
| 5. กรอกจำนวนเงิน | QR PromptPay re-render ทุก keystroke | 🟠 ไม่มี debounce → กระตุก, CPU มือถือเก่าหนัก |
| 6. ลากสลิปมา drop | preview รูปขึ้น | 🔴 **เปลี่ยนรูป → memory leak**<br>🟡 ไม่มี crop/resize → upload 12MP เต็มไฟล์ |
| 7. กดส่ง | success message | 🟠 **`successMsg` ไม่หายเอง**<br>🟡 เห็น amount/QR เดิม → สับสนว่าจ่ายซ้ำหรือยัง |
| 8. รออนุมัติ | **ไม่เห็นอะไรเลย** | 🔴 **ไม่แสดง payment history** (fetch มาแต่ไม่ render)<br>→ user ไม่รู้สถานะ → spam ส่งซ้ำ |
| 9. โดน reject | ไม่มี notification | 🔴 user ไม่รู้ ต้อง refresh เอง — ไม่มี email/SMS/in-app |
| 10. กดเปลี่ยนรหัสผ่าน | modal เปิด → ต้องใส่ current password | 🔴 **USER ไม่เคยตั้ง password เลย** (admin ตั้งให้ตอน create) → user ไม่รู้ค่า → กดไม่ได้ |
| 11. logout | redirect /login | ✅ |

## 🐞 บั๊ก Flow ใน USER

1. **ไม่แสดงประวัติการจ่าย** — `payments` state fetch มาแต่ไม่มี JSX render
2. **submit ซ้ำได้ไม่จำกัด** — ไม่ disable button → double-submit ได้
3. **เปลี่ยนรหัสผ่านใช้ไม่ได้** สำหรับ USER ที่ไม่รู้ password เริ่มต้น
4. **QR สลับ static/dynamic** ทุกครั้งที่พิมพ์ — user สแกนก่อนกรอกครบ → ได้ QR ไม่มียอด
5. **กรอกยอด `0`** — frontend ยอม backend reject → error ไม่ inline กับช่อง

---

# 🔄 Flow Review: ADMIN

```
[ login (username+password) ] → [ /admin ] → 5 tabs
```

## Tab 1: ตรวจสลิป (`payments`)

| Action | จุดสะดุด |
|--------|----------|
| โหลดหน้า | 🟠 5 API calls **เรียงกัน** → หน้าค้าง 1-3 วินาที |
| ดูรูปสลิป | ✅ modal เปิดได้<br>🟡 `max-h-[60vh]` แต่ไม่ zoom → อ่านเลขในสลิปไม่ชัดบนมือถือ |
| กดอนุมัติ | 🟠 ใช้ `window.confirm()` — UX แตกบนมือถือ |
| กดปฏิเสธ | ✅ modal สวย<br>🟡 `rejectedReason` required แต่ไม่ check length → "." ผ่านได้ |
| ลบรายการ | ✅ confirm modal สวย |
| **หลังลบ payment** | 🔴 ไฟล์สลิปใน `public/uploads/` **ไม่ถูกลบ** → orphan files สะสม → disk เต็ม |
| รายการพันแถว | 🔴 **ไม่มี pagination** — `findMany()` ดึงทุก row → browser ค้าง |

## Tab 2: ธุรกรรมทั้งหมด (`transactions`)

| Action | จุดสะดุด |
|--------|----------|
| filter | ✅ UX ดี, มี clear |
| dropdown user | 🟡 สร้างจาก `payments` — user ใหม่ที่ยังไม่จ่ายจะไม่ติด list |
| filter date | 🟡 client-side filter — 50k rows = หน้าค้าง |
| **export CSV/PDF** | 🔴 **ไม่มี** — admin ต้อง copy-paste |
| สรุปรายผู้ใช้ | ✅ ดี แต่ row click filter — ไม่มี hover indicator |

## Tab 3: จัดการผู้ใช้

| Action | จุดสะดุด |
|--------|----------|
| สร้าง user | ✅ form ครบ |
| **กรอก phone ผิด format** | 🔴 ไม่ validate → save ได้ แต่ login ไม่ได้ |
| ลืม assign บัญชี | ✅ filter "ยังไม่ได้กำหนดบัญชี" ช่วย |
| password ของ USER | 🟠 admin ต้อง set password แม้ user login phone-only — confusing |
| แก้ไข user | ✅ modal สวย |
| **เปลี่ยน role USER → ADMIN** | 🔴 ไม่มี confirm → กดพลาดเลื่อนเป็น admin ทันที |
| ลบ user | ✅ cascade ลบ payments — แต่สลิปไฟล์ค้าง |
| **search/filter ด้วยชื่อ** | 🔴 ไม่มี — มีแต่ filter ตามบัญชี → user 500 คน หาไม่เจอ |

## Tab 4: จัดการบัญชีธนาคาร

| Action | จุดสะดุด |
|--------|----------|
| เพิ่มบัญชี | ✅ |
| **PROMPTPAY format** | 🟠 ใส่เลขบัญชี 10 หลัก (ไม่ใช่ PromptPay) → QR ผิด → ลูกค้าโอนเงินผิดบัญชี! |
| แก้ไข | ✅ |
| ลบ | ✅ guard ดี: ห้ามลบถ้ามี user/payment ผูก |
| **message ดี แต่ไม่มี action ลัด** | 🟡 บอก "เปลี่ยนบัญชีให้ผู้ใช้ก่อน" — ไม่มีปุ่มลัดไปแก้ |

## Tab 5: จัดการ API

| Action | จุดสะดุด |
|--------|----------|
| สร้าง token | ✅ UX ดี, แสดงครั้งเดียว |
| **expired token ค้างในลิสต์** | 🟡 OK เพื่อ audit แต่ไม่มี batch cleanup |
| revoke token | 🟠 ใช้ `confirm()` — ไม่ consistent |
| **ปุ่ม "ทดสอบ"** | 🔴 เปิด `/api/dashboard/1` ใช้ admin cookie → admin copy URL ส่งคนอื่น → คนอื่นเปิดไม่ได้ → งง |
| **endpoint รับแค่ Bearer** | 🟡 ไม่มี curl example — non-dev admin ใช้ไม่เป็น |

---

# 🚫 Flow ที่ขาด (ฟีเจอร์ที่ payment portal ปกติต้องมี)

1. **Forgot password** — user/admin ลืมรหัส = ตายสนิท ต้องเข้า DB แก้เอง
2. **Email/SMS notification** — slip approved/rejected → user ไม่รู้
3. **Receipt/Tax invoice (PDF)** — หลัง approved ไม่มี receipt
4. **Duplicate slip detection** — ใช้รูปเดิมส่งซ้ำได้ → fraud risk
5. **OCR เช็คยอดในสลิป** — admin ต้องอ่าน amount จากรูปเทียบเอง
6. **Audit log** — ใคร approve/reject เมื่อไร — มี `updatedAt` แต่ไม่มี `approvedBy`
7. **Multi-admin assignment** — admin คนไหนรับผิดชอบ user/บัญชีไหน
8. **Bulk action** — approve/reject หลายรายการพร้อมกัน
9. **Search / Sort** ในตารางใหญ่
10. **Mobile responsive admin** — table scroll-x ได้แต่ใช้บนมือถือลำบาก
11. **Onboarding wizard** — admin เปิดครั้งแรกไม่มี wizard บอกขั้นตอน
12. **Session timeout warning** — JWT หมดเงียบ → user กำลังกรอก → submit fail → ข้อมูลหาย
13. **Payment retention policy** — ไม่ทราบเก็บสลิปนานแค่ไหน
14. **PromptPay validation** — เลขที่ใส่ถูกต้องเป็น PromptPay จริงหรือไม่
15. **Slip viewer zoom/rotate** — admin อ่านเลขในสลิปยาก
16. **Customer support contact** — user ติดปัญหาไม่มีช่องติดต่อ

---

# 📊 ตารางสรุป Priority

## 🔥 Must-fix ก่อนเปิด Production จริง

| # | ปัญหา | Type | ไฟล์หลัก |
|---|-------|------|----------|
| 1 | USER login phone-only ไม่มี password | Security | `api/auth/login/route.js` |
| 2 | Slip ทุกใบ public เดา URL ได้ | Security | `public/uploads/` |
| 3 | JWT fallback hardcoded | Security | `lib/auth.js` |
| 4 | API Token plain text ใน DB | Security | `api/admin/api-tokens/route.js` |
| 5 | ไม่ verify bankAccountId | Security | `api/payments/route.js` |
| 6 | File upload ไม่ limit size/type | Security | `api/payments/route.js` |
| 7 | ไม่มี rate limit | Security | ทุก endpoint |
| 8 | User enumeration error message | Security | `api/auth/login/route.js` |
| 9 | DB password อ่อน + .env หลุด | Security | `.env` |
| 10 | Admin lockout (ลบ admin หมดได้) | Security | `api/admin/users/route.js` |
| 11 | bcrypt sync block event loop | Performance | ทุก auth route |
| 12 | `db push` ใน deploy = data loss | Data | `deploy.sh` |
| 13 | USER ไม่เห็นประวัติการจ่าย | UX | `app/payment/page.js` |
| 14 | ลบ payment สลิปไฟล์ค้าง | Data | `api/admin/payments/route.js` |
| 15 | Double-submit ได้ | UX | `app/payment/page.js` |
| 16 | Phone format ไม่ validate | Data | `api/admin/users/route.js` |
| 17 | ไม่มี pagination admin payment | Performance | `api/admin/payments/route.js` |

## 🚀 Quick Wins (แก้ง่าย UX ดีทันที)

| # | ปัญหา | Type |
|---|-------|------|
| 18 | Debounce QR generation 300ms | UX |
| 19 | Auto-dismiss success message 3s | UX |
| 20 | แทน `confirm()/alert()` ด้วย Dialog | UX |
| 21 | Search ใน user/payment table | UX |
| 22 | Export CSV ใน transactions | UX |
| 23 | `Promise.all` initial fetch ใน admin | Performance |
| 24 | Revoke `URL.createObjectURL` | Performance |
| 25 | `force-dynamic` ทุก admin route | Bug |
| 26 | Random filename `crypto.randomUUID()` | Bug |
| 27 | Validate max amount + amount > 0 | Bug |
| 28 | Confirm step ตอนเปลี่ยน role | Safety |

## 🏗️ Architectural (ทำตอน v2)

| # | ปัญหา | Type |
|---|-------|------|
| 29 | Middleware กลางสำหรับ auth | Architecture |
| 30 | เปลี่ยน `Float` → `Decimal` | Data |
| 31 | เพิ่ม Index ใน Prisma schema | Performance |
| 32 | TypeScript migration | Quality |
| 33 | เพิ่ม test suite (vitest) | Quality |
| 34 | CSRF protection | Security |
| 35 | Session revocation list | Security |
| 36 | OTP / 2FA สำหรับ admin | Security |
| 37 | Notification system (email/SMS/push) | Feature |
| 38 | Forgot password flow | Feature |
| 39 | Receipt PDF generation | Feature |
| 40 | Duplicate slip detection (hash) | Feature |
| 41 | Audit log table | Feature |
| 42 | Healthcheck endpoint | Ops |
| 43 | Backup strategy + cron | Ops |
| 44 | Security headers ใน `next.config.mjs` | Security |
| 45 | `next/image` แทน `<img>` | Performance |

---

# 🛠️ Roadmap แนะนำ

## Sprint 1 (สัปดาห์ที่ 1) — Security ฉุกเฉิน
- รหัส MySQL ใหม่ + สร้าง app user แยก (#9)
- ลบ JWT fallback + บังคับ env var (#3)
- ลบ user enumeration error messages (#8)
- เพิ่ม rate limit `/api/auth/login` ผ่าน Cloudflare Rules (#7)
- Validate `bankAccountId` ตรง assignedAccountId (#5)
- File upload size/type/magic bytes validation (#6)
- Hash API tokens ใน DB (#6)
- ย้ายสลิปออก `public/`, สร้าง auth-protected route (#2)

## Sprint 2 (สัปดาห์ที่ 2) — Business Logic
- ตัดสินใจ: phone-only OTP vs password (#1)
- USER ดูประวัติการจ่าย + status (#13)
- Disable submit + loading state (#15)
- ลบสลิปไฟล์เมื่อลบ payment (#14)
- Validate phone format admin CRUD (#16)
- Pagination admin payment list (#17)
- Admin lockout protection (#10)

## Sprint 3 (สัปดาห์ที่ 3) — UX Polish
- Quick wins ทั้งหมด (#18-#28)
- Notification system (email/SMS) (#37)
- Search/Sort ในทุก table
- Mobile responsive admin
- Onboarding wizard

## Sprint 4 (สัปดาห์ที่ 4) — Architecture v2
- Middleware กลาง (#29)
- Migrate schema `Decimal` + Index (#30, #31)
- เริ่ม TypeScript migration (#32)
- Audit log + receipt PDF (#41, #39)
- CI/CD + test suite (#33)
- Replace `prisma db push` ด้วย `migrate deploy` (#12)

---

# 📌 Notes

- ไฟล์นี้สร้างจากการอ่าน source โดยไม่ได้รัน build/test จริง — แนะนำให้ลอง `npm install && npm run build` ในเครื่องเพื่อยืนยันว่า build ผ่าน (Next.js 16 อาจมี breaking change ที่ทำให้ build fail ได้)
- ตัวเลขใน `package.json` ใช้ Next.js 16.2.7 + React 19.2.4 ซึ่งเป็นเวอร์ชันใหม่มาก — ต้องอ่าน docs ใน `node_modules/next/dist/docs/` ตามคำเตือนใน [AGENTS.md](./AGENTS.md) ก่อนแก้ไขใหญ่
- `.env` ที่ sync มาจาก VM **มี credentials production** — ห้าม commit, แนะนำลบหรือเปลี่ยนเป็น dev DB

---

**สร้างโดย:** GitHub Copilot (Claude) review session — 7 มิ.ย. 2026
**ไฟล์อ้างอิงที่อ่าน:** ทุกไฟล์ใน `app/`, `components/`, `lib/`, `prisma/`, config files, deploy scripts
