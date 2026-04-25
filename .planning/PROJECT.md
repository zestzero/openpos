# OpenPOS

## Product Vision
A dual-interface retail solution: a **mobile-first, offline-capable POS** for cashiers and a **desktop-centric Backoffice (ERP)** for shop owners. The system bridges the gap between high-speed front-end sales and robust back-end inventory management.

## Core Value Proposition
**"The sale never stops."** The POS functions end-to-end (scan, pay, receipt) without internet, syncing inventory and income to the Backoffice automatically once reconnected.

---

## 1. Backoffice Application (ERP)
The central hub for the shop owner to monitor and manage operations.

### A. Dashboard (Operations Monitor)
* **Sales Tracking:** Real-time stream of transaction history.
* **Inventory Health:** Visual summary of stock levels (e.g., "5 Items Low Stock", "2 Items Out of Stock").
* **Financial Snapshot:** Display of daily income with comparison to the previous day.
* **Quick Actions:** Shortcuts to add new products or generate reports.

### B. Inventory Management
* **Product Registry:** Full CRUD (Create, Read, Update, Delete) for items including Name, Price, SKU, Barcode, and Image.
* **Categorization:** Organize items into groups (e.g., Electronics, Apparel) for easier POS navigation.
* **Stock Control:** * **Manual Adjustments:** Record restocks or write-offs.
    * **Auto-Sync:** Stock levels are automatically decremented based on completed POS orders.
* **Product Hierarchy:** Support for variants (e.g., Small/Large, Red/Blue) under a single parent product.

### C. Reporting & Analytics
* **Time-Series Reports:** Aggregate data by Day, Month, and Year.
* **Performance Metrics:** Identify top-selling items and peak sales hours.
* **Data Portability:** Ability to export reports to CSV or PDF for accounting purposes.

---

## 2. POS Interface (Mobile-First)
The high-speed tool for the salesperson.

* **Offline Sales Loop:** Cache catalog locally; queue orders until internet is restored.
* **Flexible Input:** Support for barcode scanning, SKU search, and a touch-friendly category grid.
* **Payment Support:** Cash, Card, and PromptPay (QR).
* **Receipts:** Local printing to thermal printers via Bluetooth or USB.

---

## 3. Technical Constraints & Architecture

### Tech Stack
* **Backend:** Go (Chi router, SQLC, PostgreSQL). SQL-first, type-safe data access.
* **Frontend:** Vite + React (PWA). Route-based separation for POS and ERP views.
* **Offline Sync:** **Delta Sync Protocol**. Operations (e.g., `-1 qty`) are queued in IndexedDB and resolved on the server to prevent state conflicts.

### Key Logic
* **Currency:** Thai Baht (THB) only.
* **Inventory Ledger:** Every stock change must be recorded as a transaction (Ledger-based) rather than a simple integer update to ensure auditability.

---

## 4. Out of Scope (v1)
* Multi-location/Multi-warehouse support.
* Complex promotions (Buy 1 Get 1, Tiered Discounts).
* Customer Loyalty/Membership points.
* Advanced P&L financial accounting.

---
*Last updated: 2026-04-25 — Business Requirement Alignment*
