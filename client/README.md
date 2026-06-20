# Questro - Frontend Client

This is the frontend client for **Questro**, an interactive entertainment discovery platform. Dive into a seamless experience to explore movies, games, cast details, and more. Built with modern web technologies, the app ensures performance, a sleek user interface, and smooth micro-animations.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) powered by [Vite](https://vitejs.dev/) for an exceptionally fast development experience.
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) for utility-first, scalable styling.
- **State & Data Fetching**: 
  - [Zustand](https://github.com/pmndrs/zustand) for lightweight, global client state management.
  - [React Query (TanStack)](https://tanstack.com/query/latest) for powerful asynchronous state management, caching, and data fetching.
- **Routing**: [React Router v7](https://reactrouter.com/) for declarative client-side navigation.
- **API Requests**: [Axios](https://axios-http.com/) for network communication with our backend services.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) to power interactive and dynamic fluid micro-animations.
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) combined with [Zod](https://zod.dev/) for robust schema-based validation.
- **Icons**: [Lucide React](https://lucide.dev/) for a clean and consistent icon set.

## 🛠️ Installation & Setup

Before you start, ensure you have **Node.js** (v18+) and **npm** installed on your system.

1. **Navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root of the `client` directory (if not already present) and configure your backend URL or any necessary keys. Example:
   ```env
   VITE_API_BASE_URL=http://localhost:5222/api
   ```

## 💻 Running the Application

To start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open your browser and navigate to the address shown in your terminal (usually `http://localhost:5173`) to view the application.

## 📦 Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Compiles the application for production.
- `npm run preview`: Bootstraps a local server to preview the production build.
- `npm run lint`: Runs ESLint to identify syntax and styling issues.

## 📂 Project Architecture

The application is structured using a feature-based architecture within the `src/` directory to improve scalability and maintainability:

- **`/api`**: Centralized Axios configurations and global API utilities.
- **`/assets`**: Static files like images, fonts, and global stylesheets (`index.css`).
- **`/components`**: Reusable, cross-feature UI widgets (e.g., buttons, inputs, modals).
- **`/features`**: Domain-driven modules containing their own components, API calls, and logic. Includes modules such as `auth`, `movies`, `games`, `profile`, `notifications`, and `chatbot`.
- **`/hooks`**: Custom React hooks for shared application logic.
- **`/lib`**: Third-party library initializations and wrappers.
- **`/pages`**: Top-level route components that act as entry points to the application's views.
- **`/routes`**: Application routing configuration linking paths to pages.
- **`/utils`**: Helper functions and shared utility methods.

## 🔐 Authentication Flow

The platform utilizes a secure authentication flow:
1. **Credentials & OTP**: Users authenticate via standard credentials and must verify their session using a backend-dispatched One-Time Password (OTP).
2. **Token Management**: The frontend handles short-lived access tokens via `Zustand` memory state and relies on secure `HttpOnly` cookies for refresh tokens.
