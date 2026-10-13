# AlumiBridge Frontend Dependencies & Requirements

This document outlines all libraries and packages installed in the **AlumiBridge** React frontend, their exact versions, and their architectural purpose in the system.

---

## 1. Core Runtime Dependencies

| Package | Version | Architectural Role | Why It Was Chosen |
| :--- | :--- | :--- | :--- |
| **`react`** | `^18.3.1` | UI Library | Core component-based reactive user interface runtime. |
| **`react-dom`** | `^18.3.1` | DOM Renderer | Mounts React components to the browser DOM. |
| **`react-router-dom`** | `^6.28.0` | Client-Side Routing | Manages SPA routes (`/login`, `/register`, `/community/*`, `/analytics/*`, `/profile/*`) without full-page reloads. Supports nested route layouts via `<Outlet />`. |
| **`axios`** | `^1.7.9` | HTTP Client | Communicates with the Django REST Framework backend. Features centralized request/response interceptors for automatic JWT header injection and seamless token refresh on 401s. |
| **`lucide-react`** | `^0.468.0` | Icons Suite | Lightweight, tree-shakable SVG icons used for navbar, sidebars, alerts, action buttons, and status indicators. |
| **`react-hot-toast`** | `^2.4.1` | Toast Notifications | Lightweight, accessible notifications providing instant feedback on user actions (e.g., login success, OTP sent, errors). |

---

## 2. Build & Developer Dependencies

| Package | Version | Architectural Role | Why It Was Chosen |
| :--- | :--- | :--- | :--- |
| **`vite`** | `^5.4.11` | Build Tool & Dev Server | Ultra-fast development server with Hot Module Replacement (HMR) and optimized Rollup production bundling. |
| **`@vitejs/plugin-react`**| `^4.3.4` | Vite React Plugin | Enables Fast Refresh (HMR) and JSX compilation via Babel/esbuild. |
| **`tailwindcss`** | `^3.4.16` | Utility-First CSS | High-productivity styling framework allowing rapid responsive UI design without bulky CSS files. |
| **`postcss`** | `^8.4.49` | CSS Processor | Required by Tailwind CSS for transforming modern CSS syntax. |
| **`autoprefixer`** | `^10.4.20` | CSS Vendor Prefixing | Automatically appends vendor prefixes (e.g., `-webkit-`) to CSS rules for cross-browser compatibility. |

---

## 3. Environment Variables Specification

The frontend requires environment variables prefixed with `VITE_` to be exposed to client-side code:

| Variable | Environment | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Development | `http://127.0.0.1:8000/api` | Base URL of the Django REST Framework API endpoints. |
| `VITE_API_BASE_URL` | Production | `https://api.alumibridge.com/api` | Production backend API domain. |

---

## 4. Scripts Reference

* **`npm run dev`**: Starts the local Vite development server at `http://localhost:5173`.
* **`npm run build`**: Builds and optimizes the frontend assets for production into the `dist/` directory.
* **`npm run preview`**: Locally previews the production build.
