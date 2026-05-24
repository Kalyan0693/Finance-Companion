[PRD_Multi_Tier_Finance_Tracker.md](https://github.com/user-attachments/files/28196862/PRD_Multi_Tier_Finance_Tracker.md)
# Product Requirements Document (PRD): Multi-Tier Finance Tracker

## 1. Executive Summary
**Product Name:** Finance Companion
**Document Owner:** Product Manager
**Current Status:** Ideation / MVP Definition

**Problem Statement:**
Personal finance applications typically force users into a binary: they are either strictly for individuals or strictly for joint accounts. This creates friction for modern households where users need to maintain financial autonomy (individual hobbies, personal investments) while also contributing to shared goals and family expenses. 

**Solution:**
A scalable, multi-tier finance tracking web application that allows users to log expenses and investments seamlessly across three dimensions: Individual, Partner, and Family/Team. It provides granular visibility into daily spending buckets while rolling up data to provide a holistic view of the household's financial health, including accurate net worth calculations that account for recurring liabilities.

---

## 2. Target Audience & User Personas

To build a product that solves real-world problems, we have defined three core personas that represent the primary user journey from individual to family tracking.

### Persona 1: The Wealth-Builder (Individual Focus)
* **Profile:** 32-year-old Corporate Employee. 
* **Behaviors:** Highly focused on wealth compounding and aggressive market investments. Enjoys weekend recreation (e.g., booking local cricket pitches with friends) to decompress.
* **Pain Points:** Wants to track personal discretionary spending and complex investment vehicles (like step-up SIPs) without cluttering the family's shared grocery budget.
* **Needs:** A private dashboard for personal spending buckets and long-term stock/mutual fund tracking.

### Persona 2: The Co-Pilot (Partner Focus)
* **Profile:** 30-year-old Operations Professional.
* **Behaviors:** Manages the operational logistics of the household. Shares major expenses (rent, utilities, dining out) with their partner.
* **Pain Points:** Tired of using shared spreadsheets to reconcile who paid for what at the end of every month. 
* **Needs:** A unified "Partner Dashboard" where both individuals can log shared expenses, view monthly/quarterly trends, and maintain transparency as a financial team.

### Persona 3: The Household Manager (Family Focus)
* **Profile:** A growing family (Husband, Wife, and Child).
* **Behaviors:** Planning for long-term generational wealth, child education funds, and managing major household debt.
* **Pain Points:** Needs a top-down view of the entire family's cash flow and liabilities to understand true net worth.
* **Needs:** Aggregate reporting across all members, specific "Child Expense" buckets, and automated liability deductions.

---

## 3. Success Metrics (KPIs)

To evaluate the success of the MVP, we will monitor the following product metrics:
* **Activation Rate:** % of newly registered users who create at least one "Shared Group" (Partner/Family) within 7 days.
* **Engagement (WAA - Weekly Active Actions):** Average number of transactions logged per user per week. Target: >10 logs/week.
* **Retention:** D30 retention rate of users utilizing both Individual and Group modes.
* **Feature Adoption:** % of users who set up recurring automated payments/investments (EMIs, SIPs).

---

## 4. Feature Prioritization (MVP vs. V2)

### Phase 1: Minimum Viable Product (MVP)
* **User Authentication & Profiles:** Sign up, log in, and manage basic profile settings.
* **Multi-Tier Workspaces:** Ability to toggle between "Personal Space" and "Shared Space".
* **Transaction Logging:** CRUD operations for daily expenses with tagging/bucket categorization.
* **Dashboard & Analytics (Basic):** Monthly and Quarterly visual breakdowns (pie/bar charts) of spending per bucket.
* **Core Liability Tracking:** Dynamic Net Worth calculator that strictly computes and adjusts for ongoing EMI payments automatically.

### Phase 2: Fast Follows (Growth & Retention)
* **Advanced Investment Tracking:** Modules specifically designed to track long-term SIPs, including automated annual step-up projections.
* **Granular Permissions:** Ability to hide specific personal transactions from the shared Partner/Family dashboard while still contributing to the overall aggregate spend.
* **CSV/Bank Export:** Import existing data from bank statements or Google Sheets for historical analysis.

---

## 5. Core User Stories (Functional Requirements)

**Epic 1: Multi-Tier Tracking**
* *As an individual*, I want to categorize my daily spending into personal buckets so that I can monitor my independent cash flow.
* *As a partner*, I want to switch to a "Shared Workspace" to log a grocery bill so that my spouse can immediately see the updated monthly household expenditure.
* *As a family member*, I want to view a combined quarterly report of all accounts so that we have clarity on our total household savings rate.

**Epic 2: Net Worth & Recurring Automated Logic**
* *As a user with existing debt*, I want the system to automatically calculate and deduct my ongoing EMI payments from my available assets every month, so that my Net Worth dashboard reflects a highly accurate, real-time number.
* *As an investor*, I want to set up an automated monthly SIP log with a configured annual step-up percentage, so I don't have to manually enter my investment contributions every month.

---

## 6. Technical & UX Considerations
* **Data Segregation:** The database architecture must rigidly separate `Personal` vs. `Group` transactions to ensure data privacy where required.
* **Frictionless UX:** Adding a transaction must take fewer than 3 clicks. Mobile responsiveness is non-negotiable, as users will log expenses on the go.
* **Scalability:** The group structure should be polymorphic, allowing a user to belong to a "Partner" group and a larger "Family" group simultaneously without duplicating underlying data schemas.
