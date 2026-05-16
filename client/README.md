# Questro - Frontend Client

This is the frontend client for **Questro**, a modern web application acting as your hybrid gateway to cinematic experiences and gaming worlds. Built with a focus on performance, modularity, and a beautiful sleek interface using React and Vite.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) powered by [Vite](https://vitejs.dev/) for lightning-fast local development and HMR.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for flexible, utility-first styling.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for lightweight, robust global state logic (handling authentication and user sessions).
- **Routing**: [React Router v7](https://reactrouter.com/) for declarative client-side routing.
- **API & Data Fetching**: [Axios](https://axios-http.com/) for promise-based HTTP network requests configured securely with HttpOnly cookies.
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful, consistent iconography.
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for structured input validation.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher) or **yarn**

## 🛠️ Installation & Setup

1. **Verify your directory**:
   Make sure you are located inside the `client` directory of the project in your terminal:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   Install all required Node.js packages by running:
   ```bash
   npm install
   ```

3. **Backend Connection Configuration (Optional)**:
   By default, the frontend is configured to securely communicate with a local backend API instance running at `http://localhost:5222/api`. 
   If your backend is running on a different port or network, you can update the base URL securely inside the central `src/services/apiClient.js` file.

## 💻 Running the Application

To start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Your terminal will output the local network address. Open your browser and navigate to `http://localhost:5173` (or the equivalent address shown) to access the Questro application.

## 📦 Available Scripts

In the project directory, you can run the following built-in Vite scripts:

- `npm run dev`: Runs the app in development mode.
- `npm run build`: Bundles the app efficiently into static files for production deployment.
- `npm run preview`: Bootstraps a local web server to preview your production build.
- `npm run lint`: Runs ESLint to catch syntax, code style issues, and potential bugs.

## 📂 Project Structure

A quick transparent overview of the key directories within `src/`:

- `/assets` - Static visual assets, core graphics, and global CSS logic.
- `/components` - Reusable UI widgets and stateless visual components (Forms, Cards, Navigation, Grids, etc.).
- `/hooks` - Custom React hooks for encapsulating complex state & application logic independently from components (e.g., `useLogin`, `useRegister`).
- `/pages` - Top-level route components representing full screen views (Login, Register, Movies Dashboard).
- `/services` - The core abstraction layer handling specific API calls formatting (Axios calls), separating all backend integrations safely away from the UI.
- `/store` - Global state slices completely managed by Zustand (acting as the source of truth for the local authenticated user session).

## 🔐 Auth & API Note

The application implements a secure, 2-step OTP-based authentication system mapping exactly to the backend standards:
1. **Login/Register**: Users provide initial credentials. Wait for the `200/201` verification responses inside the UI.
2. **OTP Verification**: A 6-digit code is dispatched from the backend. The UI naturally toggles state allowing the entry of this targeted OTP.
3. **Internal State**: The frontend safely accepts the short-lived access-tokens in JS memory (in Zustand Store) while delegating all Refresh Token persistence entirely back securely onto browser `HttpOnly` cookies.

---
*Note: This repository contains the frontend client only. Ensure your Questro backend server is running in parallel for full platform functionality.*
