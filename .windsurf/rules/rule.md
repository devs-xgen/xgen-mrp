---
trigger: always_on
---

# RULE.md

## 🔑 Core Rule

Always follow and extend the guidelines in `/notes/AIRules/README.md`. No code should conflict with it. If ambiguity arises, prefer clean, modern, and scalable solutions.

---

## 📦 Project Standards

* **Framework**: Next.js (latest stable version).
* **Backend**: Node.js with REST or edge functions when suitable.
* **Styling**: Tailwind CSS + shadcn/ui components.
* **Auth**: Clerk (or configured provider).
* **Database**: Local SQL file storage (via Prisma ORM if applicable).

---

## 🧑‍💻 Code Quality

* Use **TypeScript** in all new files.
* Enforce **strict typing** and avoid `any`.
* Follow **DRY, KISS, SOLID** principles.
* Write **self-documenting code**; comments only for non-obvious logic.
* Prefer **async/await** over callbacks or `.then`.

---

## ⚡ Performance

* Use **React Server Components** where possible.
* Apply **dynamic imports** for heavy modules.
* Cache data fetches (Next.js `revalidate` or edge caching).
* Avoid over-fetching → prefer **selective queries**.

---

## 🛡 Security

* Always sanitize user inputs.
* Never expose secrets (use `.env.local`).
* Follow **OWASP best practices** for API endpoints.

---

## 🧪 Testing

* Write minimal **unit tests** for utilities.
* For pages/components → snapshot & integration tests.
* Keep tests **fast & isolated**.

---

## 🎨 Code Style

* Use Prettier + ESLint with strict rules.
* File naming → **kebab-case** for files, **PascalCase** for components.
* Organize imports (absolute paths, grouped by type).

---

## 🚀 Innovation

* Think **scalability first** (avoid hacks or shortcuts).
* Suggest **better patterns** when code can be improved.
* Use **modern Next.js features** (App Router, Server Actions, Edge).

---

✅ **Reminder**: If a rule here conflicts with `/notes/AIRules/README.md`, the README.md wins.

---