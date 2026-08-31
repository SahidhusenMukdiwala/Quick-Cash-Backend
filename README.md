# ⚙️ QuickCash Ledger - Backend API

The RESTful backend service for QuickCash Ledger, powered by **Node.js**, **Express.js**, and an **Aiven MySQL** cloud database.

### ✨ Highlights
- 🔐 **JWT Session Authentication**: Secure token verification and session middleware.
- 💼 **Transaction Management API**: Optimized endpoints for transaction creation, updates, and balance aggregation.
- 🌐 **IP & Audit Logging**: Automatic client public IP capture via `x-forwarded-for` and session activity tracking.
- 🛡️ **Robust Error Handling**: Standardized JSON response envelope schemas (`success`, `result`, `errors`).
