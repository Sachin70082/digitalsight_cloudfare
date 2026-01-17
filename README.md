# Digitalsight

**Digitalsight** is a scalable music distribution and release-management platform built on **Cloudflare’s edge-native stack**.  
The system is designed for high availability, low latency, and secure handling of music metadata, releases, and workflows.

This repository contains the **Cloudflare Workers + D1** implementation of Digitalsight.

---

## 📌 Overview

Digitalsight enables:
- Artist, label, and release management
- Metadata validation and correction workflows
- Secure role-based access
- High-performance APIs deployed globally at the edge

The platform was **migrated from Firebase to Cloudflare** to improve performance, control costs, and reduce vendor lock-in.

---

## 🏗️ Architecture

Client (Browser)
│
▼
Vite + React (UI)
│
▼
Cloudflare Worker (API Layer)
│
├── D1 (SQLite) → Relational data
├── R2 (optional) → Assets / uploads
└── KV / Cache → Fast lookups (optional)

markdown
Copy code

**Key characteristics**
- Serverless, edge-first execution
- Stateless Workers
- Strongly typed APIs (TypeScript)
- SQL-based relational data model (D1)

---

## 🧰 Technology Stack

### Frontend
- **React**
- **Vite**
- **TypeScript**

### Backend
- **Cloudflare Workers**
- **Cloudflare D1 (SQLite)**
- **Wrangler CLI**

### Tooling
- ESLint
- TypeScript strict mode
- Miniflare (local emulation)

---

## 📁 Repository Structure

.
├── components/ # Shared UI components
├── pages/ # Application pages / routes
├── services/ # Business logic, D1, R2 services
├── worker/ # Cloudflare Worker entry + APIs
├── public/ # Static assets
├── wrangler.toml # Cloudflare configuration
├── vite.config.ts # Vite configuration
├── tsconfig.json
├── package.json
└── README.md

yaml
Copy code

---

## ⚙️ Environment Configuration

### Local environment
Create a `.env` file (never commit this):

```env
APP_ENV=development
