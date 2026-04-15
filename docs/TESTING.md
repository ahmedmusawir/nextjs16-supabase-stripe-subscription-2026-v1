# Testing

## Overview

This starter kit ships with a focused **Jest-based RBAC and security test suite**.

The goal is not shallow coverage for the sake of numbers. The goal is to prove the critical auth and authorization boundaries behave correctly under both valid and hostile conditions.

---

## Test Framework

This repository uses:

- **Jest**
- **ts-jest**
- Node test environment

### Relevant files

- `jest.config.js`
- `src/__tests__/jest.setup.ts`

---

## Jest Configuration

The Jest config supports:

- TypeScript execution through `ts-jest`
- `@/*` path alias resolution
- shared setup hooks for Next.js mocks
- isolated test discovery inside `src`

### Highlights

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],
}
```

---

## Shared Mocking Architecture

The test suite mocks infrastructure that should not execute real framework behavior during unit tests.

### Next.js mocks

`src/__tests__/jest.setup.ts` mocks:

- `next/navigation`
  - `redirect`
  - `useRouter`
  - `usePathname`
- `next/cache`
  - `revalidatePath`

### Supabase mocks

Individual tests mock the server/admin clients directly so they can intercept:

- `auth.getUser`
- `auth.signInWithPassword`
- `auth.signOut`
- `auth.admin.createUser`
- query chains like `from().select().eq().single()`
- update chains like `from().update().eq()`

This lets the tests assert security behavior without touching a real database.

---

## Main Test Suites

## 1. `get-user-role.test.ts`

File:

- `src/__tests__/get-user-role.test.ts`

### What it proves

- `getUserRole()` returns `AppRole.SUPERADMIN` when the DB row says `superadmin`
- `getUserRole()` returns `AppRole.ADMIN` when the DB row says `admin`
- `getUserRole()` returns `AppRole.MEMBER` when the DB row says `member`
- query failures are handled gracefully
- missing rows return `null`
- empty user ids short-circuit safely

### Why it matters

This is the canonical role lookup function. If this becomes weak or inconsistent, every protected layout becomes unreliable.

---

## 2. `actions.test.ts`

File:

- `src/__tests__/actions.test.ts`

### What it proves

- an admin is allowed through `protectPage([AppRole.ADMIN])`
- a member is rejected from admin access
- an unauthenticated caller is redirected
- a caller with no resolved role is redirected

### Why it matters

`protectPage()` is the server-side route gatekeeper for protected layouts. These tests verify the route wall behaves correctly before any portal content renders.

---

## 3. `superadmin-add-user.test.ts`

File:

- `src/__tests__/superadmin-add-user.test.ts`

### What it proves

- a verified superadmin can create a new admin user successfully
- the admin client creates the auth user
- the role update writes to `user_roles`
- a `member` caller gets `403`
- an `admin` caller gets `403`
- unauthorized callers never reach the service-role admin client
- unauthenticated callers get `401`
- malformed payloads get `400`

### Why it matters

This is the most sensitive API in the starter. It exercises the **One-Two Punch** security model:

1. verify the caller is truly a superadmin
2. only then invoke the service-role client

If this route is weak, your RBAC system is weak.

---

## 4. `proxy.test.ts`

File:

- `src/__tests__/proxy.test.ts`

### What it proves

- `proxy()` delegates to `updateSession()`
- the matcher excludes static assets and image paths

### Why it matters

The request session refresh loop is foundational to SSR auth correctness. If middleware/proxy stops running correctly, route protection becomes inconsistent.

---

## How to Run Tests

### Standard run

```bash
npm test
```

### Single-threaded run

Useful for CI debugging or deterministic local troubleshooting:

```bash
npm test -- --runInBand
```

---

## Current Test Inventory

At the time of writing, the suite contains:

- 4 test suites
- 17 passing tests

These target the highest-value security surfaces in the starter.

---

## What This Suite Intentionally Prioritizes

This suite prioritizes:

- auth correctness
- route protection behavior
- privilege escalation prevention
- middleware/session consistency
- failure-path security

It does **not** waste time on low-value boilerplate.

---

## Recommended Future Expansion

As the starter evolves, add tests for:

- login/signup/logout route handlers directly
- cache invalidation calls (`revalidatePath`, `router.refresh` workflows)
- role mutation flows
- RLS-backed integration tests against a disposable Supabase environment
- portal-specific server component rendering behavior

---

## Testing Philosophy

> A real auth suite does not just prove that authorized users succeed. It proves that unauthorized users fail immediately and safely.

That is the standard this starter should maintain.
