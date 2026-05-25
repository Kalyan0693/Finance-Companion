# System Architecture & UI Overview

## 1. High-Level Architecture
SyncWealth is designed as a modern, serverless Next.js application. 
* **Frontend:** Next.js (App Router) with React Server Components for fast loading times.
* **Styling:** Tailwind CSS for a responsive, mobile-first design (crucial for on-the-go expense logging).
* **Backend API:** Next.js Server Actions handling business logic directly without a separate Node.js server.
* **Database Engine:** PostgreSQL managed via Prisma ORM for type-safe database queries.

## 2. Core UI Components (Wireframe Mapping)

### A. The Global Context Switcher (Top Nav)
The most critical UI element. A dropdown in the navigation bar allows the user to seamlessly toggle their data context:
* `[👤 Personal Workspace]` 
* `[🤝 Partner Workspace]`
* `[👨‍👩‍👦 Family Workspace]`
*Action:* Toggling this updates all downstream widgets (Net Worth, Spending Buckets) to query only the data associated with the selected `groupId`.

### B. Dynamic Net Worth Widget
Unlike standard expense trackers that just show "Income - Expenses", this widget factors in the `RecurringItem` table.
* **Assets:** Sum of all cash inputs + current SIP valuations.
* **Liabilities:** Automatically subtracts the outstanding balance of tracked EMIs. 
* *PM Note:* This solves a major user pain point where users feel their "Net Worth" is inaccurate because it ignores ongoing monthly debt obligations.

### C. The "Quick Add" Transaction Flow
A persistent floating action button (FAB) for mobile users.
1. Input Amount.
2. Select Bucket (auto-filtered based on current Workspace).
3. Hit Save. (Designed to take < 5 seconds).

### D. Investment & Liability Hub
A dedicated page for managing `RecurringItems`.
* **SIP Manager:** Users input their base monthly investment (e.g., ₹5000) and an annual step-up (e.g., ₹2000). The system automatically projects future contributions.
* **EMI Tracker:** Users input total loan duration. The system visually tracks the "Months Completed" vs. "Remaining Balance" to give psychological wins as debt decreases.
