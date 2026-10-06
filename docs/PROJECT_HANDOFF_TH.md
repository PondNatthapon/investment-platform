# บันทึกส่งต่องาน: Investment Platform

อัปเดตล่าสุด: 5 ตุลาคม 2026

เอกสารนี้สรุปโครงสร้างปัจจุบัน ข้อตกลงด้านข้อมูลการเงิน และแผนงานที่ยังเหลือ เพื่อให้ผู้รับช่วงทำต่อได้โดยไม่ต้องไล่อ่านประวัติการสนทนาทั้งหมด

## สถานะตอนนี้

- โปรเจกต์ใช้ Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL และ `decimal.js`
- ระบบเป็นแพลตฟอร์มพอร์ตลงทุนที่กำลังรองรับ Webull Thailand และ Dime
- ทำ authorization สำหรับ account แล้ว และเพิ่ม currency/FX primitives กับการแปลง valuation เป็น account base currency แล้ว
- เพิ่ม schema และ migration สำหรับ Broker / Account / Wallet แล้ว แต่ **ยังไม่ได้รัน migration กับฐานข้อมูล**
- การเปลี่ยนแปลง Broker / Account / Wallet ยังเป็น uncommitted changes ใน working tree ณ วันที่เขียนเอกสารนี้ ตรวจ `git status` ก่อนเริ่มงานและอย่าทับการเปลี่ยนแปลงเหล่านั้น
- ข้อมูล VOO/OKLO demo ยังอยู่ ห้ามลบหรือถือว่าเป็นประวัติเงินจริง

## โครงสร้างโค้ดที่ควรรู้

- `app/` — Next.js pages, route handlers และ server actions
- `src/db/schema.ts` — schema ปัจจุบัน
- `src/db/seed.ts` — demo user, demo account และ VOO/OKLO transactions
- `src/lib/account/` — account lookup และ authorization
- `src/lib/transaction/` — validation, service และ repository ของรายการซื้อขาย
- `src/lib/portfolio/` — portfolio engine, valuation และ repository
- `src/lib/currency/` — ตรวจและ normalize currency code
- `src/lib/fx/` — FX pair/quote, provider และ Decimal conversion
- `drizzle/` — migrations และ schema snapshots
- `data/import_sources/` — ไฟล์ต้นทางจาก broker ซึ่งถูก ignore โดย Git; ห้ามนำ statement หรือ screenshot เข้า commit

คำสั่งหลักดูได้จาก `package.json`: `npm run dev`, `npm run build`, `npm test`, `npx tsc --noEmit`, `npm run db:generate`, `npm run db:migrate` และ `npm run db:check`

## โมเดลข้อมูลปัจจุบันและที่เพิ่งเพิ่ม

โครงสร้างที่อนุมัติคือ:

```text
User
└── Broker
    └── Account / Product
        ├── Wallet(s)
        └── Securities (ผ่านรายการใน account)
```

ตารางหลักใน schema ได้แก่ `users`, `brokers`, `accounts`, `account_wallets`, `securities`, `transactions`, `dividends`, `fx_transactions` และ `documents`.

- `brokers`: มี `code` ที่ไม่ซ้ำ, `displayName` และ JSON `metadata` สำหรับความสามารถ/adapter ในอนาคต
- `accounts`: ผูกกับ user หนึ่งคนและ broker หนึ่งราย เก็บ base/reporting currency, ชื่อ/product, `accountNumber`, active status และ `isDemo`
- `account_wallets`: ผูกกับ account มี `walletKey`, label จาก broker, currency, external reference และ active status
- wallet key และ external reference (ถ้ามี) ไม่ซ้ำกันภายใน account เดียวกัน แต่ **currency ไม่ unique** จึงมีหลาย wallet สกุลเดียวกันได้
- `transactions.settlementWalletId` เป็น nullable สำหรับเตรียมระบุ cash settlement wallet ในอนาคต
- `fx_transactions.fromWalletId` / `toWalletId` เป็น nullable สำหรับเตรียม source/destination wallet
- composite foreign keys บังคับว่า wallet ที่อ้างจาก trade หรือ FX ต้องอยู่ใน account เดียวกัน
- ฟิลด์ wallet ที่เพิ่มใหม่ยังว่างสำหรับข้อมูลเก่า ห้ามเติมจาก `transactions.currency` หรือ `fx_transactions.fromCurrency/toCurrency` โดยคาดเดา

### Dime และ Webull

Dime เป็น broker เดียว ไม่ใช่สอง broker:

```text
DIME
└── Account / Product
    ├── Dime! Save — THB wallet
    └── Dime! USD  — USD wallet
```

ใน schema ให้สร้าง wallet สองแถวใต้ Dime account เดียว เช่น `walletKey=dime-save-thb`, `label=Dime! Save`, `currency=THB` และ `walletKey=dime-usd-usd`, `label=Dime! USD`, `currency=USD`. ยังไม่มี Dime account จริงใน seed จึงยังไม่ได้สร้างแถว account หรือ wallet ปลอม

Webull ใช้รูปแบบเดียวกัน: หนึ่ง Webull account มี wallet ตามสกุลเงินที่ statement/source ยืนยัน และสร้างหลาย wallet สกุลเดียวกันได้ถ้าหลักฐานรองรับ อย่าสร้าง broker หรือ account แยกตามสกุลเงิน

### Migration และ demo data

- `drizzle/0001_broker_account_wallet_foundation.sql` เพิ่ม brokers, ย้าย broker label เดิมไปเป็น broker row, เพิ่ม wallets และเพิ่ม nullable wallet references
- migration สร้าง `DIME` และ `WEBULL_TH` ใน broker catalog; broker label อื่นเดิมจะได้ `LEGACY_<hash>` เพื่อให้ backfill ทำซ้ำได้แน่นอน
- migration ทำเครื่องหมาย demo account เมื่อ account name, broker label และ demo user email ตรงกับ seed เดิม แล้ว seed script คง marker `isDemo=true`
- account number/base currency และ transaction/security history เดิมไม่ถูกแปลง
- migration ถูกสร้างและ `npm run db:check` ผ่าน แต่ยังไม่ได้ apply จริง ควรตรวจ migration อีกครั้งและตรวจ environment/backup ก่อน `npm run db:migrate`

## Authorization: ขอบเขตที่ต้องรักษา

`LOCAL_USER_EMAIL` ยังคงเป็น local-user authentication model. จุดตรวจกลางคือ `requireAccountAccess(userId, accountId)` ใน `src/lib/account/access.ts` ซึ่งปฏิเสธ UUID ที่ผิดรูป, account ที่ไม่มีอยู่, account ของ user อื่น และ account ที่ inactive ด้วย safe not-found error.

Portfolio และ transaction services เรียก `requireAccountAccess` ก่อนอ่านหรือเขียนข้อมูล. Account repository join `brokers` เพื่อคืน display name แต่ยังกรอง account ด้วย user ID และ active status. เมื่อต่อ wallet service, route หรือ action ใหม่ ให้ตรวจ account ผ่าน `requireAccountAccess` ก่อน query wallet เสมอ และตรวจว่า wallet เป็นของ account ที่ผ่านการ authorize แล้ว ห้ามใช้ repository ที่รับ account ID จาก request แล้วคืนข้อมูลโดยไม่ผ่าน service authorization

การตรวจผ่าน DB composite FK ช่วยกัน wallet ที่อยู่คนละ account แต่ไม่ได้แทน user authorization

## Currency, FX และกฎข้อมูลการเงินจริง

- ใช้ `Decimal` ต่อเนื่องใน money/FX calculations; แปลงเป็น string/number เฉพาะชั้นแสดงผล
- ทุก position มี native currency/value และ base-currency valuation; same-currency ไม่ต้องใช้ FX quote
- ถ้า quote ขาดหรือใช้ไม่ได้ ต้องคง native value และรายงาน conversion unavailable ห้ามใช้ `1.0` แทน rate
- actual FX transaction, market FX quote, historical FX snapshot และ regulatory/reference rate เป็นคนละข้อมูล ใช้แทนกันไม่ได้
- account base currency เป็นสกุลรายงาน ไม่ได้บอก currency ของ wallet, trade หรือ security
- THB และ USD wallet balances ต้องแสดงแยกกัน; รวมมูลค่าได้หลังแปลงอย่างชัดเจนด้วย valuation quote
- actual internal FX ในอนาคตจะ debit source wallet และ credit destination wallet เป็น movement ภายใน ไม่ใช่ deposit/withdrawal ภายนอก และห้ามนับ event ซ้ำกับ wallet balances
- เมื่อ source ไม่พิสูจน์จำนวนเงิน, currency, rate, timestamp, balance, cost หรือ quantity ให้เก็บเป็น UNKNOWN / UNAVAILABLE / NEEDS_RECONCILIATION ห้ามประมาณหรือสร้างข้อมูล
- Portfolio/cash snapshots เป็นหลักฐาน reconciliation ไม่ใช่ transaction อัตโนมัติ

ข้อจำกัดที่ยังมี: dashboard summary ยังรวมค่าตัวเลขและแสดง `$` โดยไม่รองรับ currency mixing อย่างถูกต้อง; portfolio engine ปัจจุบันยังคำนวณ position จาก trades เป็นหลัก ไม่มี cash wallet ledger หรือ cash balances

## สถานะ Step ที่ทำแล้ว

1. **Account authorization:** มี `requireAccountAccess` กลาง ใช้ใน portfolio และ transaction service พร้อม tests ของ own/foreign/missing/invalid/inactive account
2. **Currency + timezone design:** อนุมัติหลักการแล้ว แต่ timezone behavior ยังไม่เปลี่ยน; transaction action ยังประกอบเวลาโดยใช้ `+07:00` คงที่ ต้องทำเป็นงานแยกโดยใช้ timezone ที่กำหนด
3. **FX primitives (Step 2A):** currency normalize/validation, Decimal conversion, pair/quote types, provider interface และ development provider
4. **Valuation FX (Step 2B):** native + base valuation DTO, ใช้ FX provider และรายงาน missing/invalid quote โดยไม่แทน rate ด้วย 1
5. **Broker / Account / Wallet foundation (Checkpoint 2):** schema และ migration ทำแล้ว; ยังไม่มี wallet CRUD, wallet ledger, broker importer หรือ UI

การทดสอบล่าสุดของ foundation: `npx tsc --noEmit`, `npm run db:check`, `git diff --check` และ test files ทั้ง 6 ผ่าน. ใน environment นี้ `npm test` wrapper เคยเจอ `EPERM` ตอน tsx เปิด IPC pipe; รันชุดเดียวกันได้ผ่าน `node --import tsx --test ...` แทน

## แหล่งข้อมูล broker ที่สำรวจแล้ว

ไฟล์ส่วนตัวอยู่ใน `data/import_sources/` และไม่ควร commit. ชุดที่ตรวจพบ:

- **Webull:** monthly statement PDFs และ CSV ตั้งแต่ Dec 2025 ถึง Aug 2026, 2025 annual summary และ withholding-tax PDF หนึ่งชุด. Statement มี trades, holdings/cash snapshots และมี deposit/refund บางรายการ; June 2026 มี FX entries สองรายการ. หลักฐานยังไม่ยืนยันว่ามี deposit/withdrawal/FX history ครบทั้งหมดหรือ dividend history ครบ จึงถือประวัติเหล่านี้ว่า partial ไม่ใช่ complete
- **Dime:** trade-confirmation PDFs 5 ชุดและ screenshots 4 ภาพ. Screenshots แสดง cash activity, currency exchange, FX detail พร้อม order reference หนึ่งรายการ และ VOO order detail. แหล่ง screenshot อาจให้ actual FX amounts/rates/order ID; ยังต้องให้ user review/confirm ก่อน finalizing
- Dime trade confirmation มี THB equivalent ที่คำนวณด้วย BOT reference rate; มันไม่ใช่ actual customer FX transaction. Dime app FX screen เป็นหลักฐาน actual exchange แยกกัน
- Statement, CSV และ screenshot ที่ซ้ำกันต้อง dedupe ไม่สร้าง transaction ซ้ำ; PDF กับ CSV ของ Webull อาจมี period label ไม่ตรง filename ให้ยึดข้อมูลใน statement/event และรักษา source provenance

## แผนทำต่อแบบ checkpoint

### Checkpoint A — ปิดงาน schema foundation ให้พร้อมใช้

1. ตรวจ `git status` และรักษา uncommitted changes ปัจจุบัน
2. ตรวจ migration กับฐานข้อมูล dev ที่ถูกต้อง และยืนยัน backfill ก่อน apply; อย่า run migration โดยไม่รู้ `DATABASE_URL`
3. ตรวจว่า account authorization tests ยังผ่านหลัง migration
4. เพิ่ม account-authorized wallet query/service เฉพาะเมื่อเริ่มมี caller; เรียก `requireAccountAccess` ทุกครั้ง

### Checkpoint B — normalized import และ provenance

1. ออกแบบ common import draft รองรับ Trade, Deposit, Withdrawal, FX, Dividend, Portfolio Snapshot และ Cash Snapshot
2. เก็บ broker, account, source type/document, external order/record ID, import time, original/raw values, normalized values และ review status
3. รองรับ PDF, CSV, Screenshot และ Manual entry ผ่าน broker-specific adapters ไม่ผูก schema กับ file format
4. Idempotency ใช้ account + source document/hash + external record/order ID; ถ้าไม่มี ID ใช้ deterministic content fingerprint และแจ้ง duplicate ที่กำกวมให้ review
5. ทุก screenshot/OCR/vision extraction เป็น `NEEDS_CONFIRMATION`; Confirm/Edit/Reject ก่อนสร้าง finalized record

### Checkpoint C — actual cash และ FX ledger

1. แยก cash movements, actual FX, trades/dividends และ market valuation data
2. FX ระบุ source wallet, destination wallet, source/destination amount และ currency, actual rate, timestamp, provenance
3. เชื่อม FX เป็น debit/credit คู่ภายใน wallet; ไม่แสดงเป็น external funding
4. ห้ามกำหนด wallet ให้รายการเก่าหากไม่มีหลักฐาน

### Checkpoint D — broker adapters และ reconciliation

1. ทำ Webull PDF/CSV parser โดยใช้ statement เป็น source หลักและ CSV เป็น cross-check พร้อม idempotency
2. ทำ Dime trade-confirmation import และ screenshot review flow
3. เก็บ cash/portfolio snapshots เป็น reconciliation evidence
4. เทียบ transaction-derived quantity/cost/cash/value กับ snapshots และรายงาน discrepancy; ห้ามปรับ transaction เงียบ ๆ

### Checkpoint E — portfolio และ UI

1. คำนวณ account → broker → combined portfolio จาก normalized data ไม่ฝัง broker logic ใน portfolio engine
2. แสดง wallet balances แยก currency และรวมด้วย valid market FX quote เท่านั้น
3. ทำ unified dashboard พร้อม broker-specific views, transaction/history pages และ import flows
4. แก้ dashboard currency display/mixing หลัง data flow และ valuation model รองรับแล้ว

### งานที่แยกจากนี้

กำหนด timezone rule จาก user/account timezone และเปลี่ยน transaction date parsing/display โดยไม่สมมติ `+07:00`; อย่าทำปะปนกับ wallet/import migration

## ข้อควรระวังสำหรับผู้รับช่วง

- กฎใน `AGENTS.md` ระบุว่า Next.js รุ่นนี้มี breaking changes; ก่อนแก้โค้ด Next ให้เปิด guide ที่เกี่ยวข้องใน `node_modules/next/dist/docs/`
- อย่าลบหรือแก้ VOO/OKLO demo เพื่อให้ดูเหมือนข้อมูลจริง; ใช้ `accounts.isDemo` แยกข้อมูล
- อย่าเติมเงินจริงจากยอด snapshot, FX quote ปัจจุบัน, BOT/reference rate หรือการคำนวณส่วนต่างที่ไม่มีหลักฐาน
- รักษา account authorization boundary และ Decimal precision
- ก่อนสร้าง migration ใหม่ ให้ตรวจ snapshots/journal และอ่าน SQL ที่ generate เพราะ Drizzle อาจเสนอ rename/drop ที่ไม่รักษาข้อมูลเดิม
