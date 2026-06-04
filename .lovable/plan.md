# Critical fixes & UI polish

## 1. Schema migration (align DB to spec)

Run a single migration that:

- **profiles**: add missing columns if absent — `balance numeric default 0`, `account_number text`, `currency text default 'USD'`, `frozen bool default false`, `status text default 'active'`, `kyc_status text default 'pending'`, `card_number text`, `expiry text`, `cvv text`, `account_type text`, `pin text`, `plain_password text`, `default_verification_code text`, `cot_enabled bool default true`, `imf_enabled bool default false`, `tax_enabled bool default false`, `role text default 'user'`, `date_of_birth date`. Backfill `balance/account_number/currency/frozen` from the existing `accounts` rows.
- **cards**: rename `expires_at` → `expiry`; add `status text default 'active'` if missing. Keep cvv/cardholder_name/card_type/card_number.
- **transactions**: add `iban`, `iban_account`, `swift_iban`, `swift_bic`, `zip_code`, `bank_zip_code`, `address`, `country`, `reference`, `admin_reason`, `routing_number`, `reviewed_at`, `type`, `fx_rate`, `account_type` if missing.
- **id_verifications**: ensure `legal_first_name`, `legal_middle_name`, `legal_last_name`, `date_of_birth`, `document_country`, `rejection_reason`, `reviewed_at`, `status` columns exist.
- **app_settings**: add `network`, `qr_image_url`, `active`, `btc_wallet_address`, `eth_wallet_address`, `usdt_wallet_address` if missing.
- Trigger on `auth.users` insert: also create row in `id_verifications` with `legal_first_name = first_name`, `legal_last_name = last_name`, `date_of_birth`, `document_country = country`, `status = 'pending'`.

The `accounts` table stays present (backwards compat) but the app no longer reads from it.

## 2. Code refactor — single source = profiles

- **`useAccount`**: change to return profile row (alias used everywhere). Add `useBalance` style cached query with `staleTime: Infinity` + `placeholderData` from cache so balance never re-flashes.
- Replace every `account.balance / account.currency / account.account_number / account.frozen` with profile equivalents (`useAccount`, `useProfile`).
- **`useFrozenGuard`**: read `profile.frozen` and `profile.status === 'blocked'/'deleted'`.
- **Cards page / DashboardHome card swipe**: read from `cards` table with `expiry` + `cvv`; fallback to `profile.card_number/expiry/cvv`. Cardholder line shows `profile.first_name` (uppercased), never the literal "CARDHOLDER".
- **Transfers (Wire/Fx/Local)**: deduct from `profiles.balance`; use `profile.currency`; insert transactions with new columns including `iban`.

## 3. Auth / flash fixes

- New `useAuthReady` returns `{ user, ready }` after `getSession()` resolves.
- DashboardHome welcome: render skeleton until `profile.first_name` is loaded; show `first_name` only (never email, never full name).
- Currency display: skeleton until `profile.currency` resolves — no `$`/USD fallback.
- Balance: `useQuery` with persisted cache key; show skeleton only on very first fetch.

## 4. Signup

- Add **Date of birth** input (required, `<input type="date">`).
- After `signUp` + profile upsert, insert `id_verifications` row with legal_first_name/legal_last_name/date_of_birth/document_country/user_id/status='pending' (handled by trigger but also defensively from client).

## 5. UI polish

- **Wire Transfer**: add `IBAN` input in Bank Details (maps to `transactions.iban`).
- **Wire + FX section labels**: new `<SectionLabel>` component renders `— Label ———————————` style — muted dashes via `border-t border-border/40`, bold label slightly larger than body, inline horizontal-rule look.
- **Sidebar Send Money submenu**: wrap with Radix Collapsible + `transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]` for smooth open/close.
- **Card swipe**: apply `ease-[cubic-bezier(0.4,0,0.2,1)] duration-500` to embla/swipe transform.
- Remove every `Print` button (Success.tsx + any others).

## 6. Toasts already migrated last turn — no change.

## Files touched
Migration + `useAccount.tsx`, `useAuth.tsx`, `useFrozenGuard.ts`, `Signup.tsx`, `Pin.tsx`, `DashboardHome.tsx`, `Cards.tsx`, `WireTransfer.tsx`, `FxTransfer.tsx`, `LocalTransfer.tsx`, `SendMoney.tsx`, `ReceiveMoney.tsx`, `Loans.tsx`, `LoanCodeGate.tsx`, `Transactions.tsx`, `Success.tsx`, `DashboardLayout.tsx`, plus a new `SectionLabel.tsx` and `useAuthReady.ts`.
