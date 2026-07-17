# 🎬 Questro - Frontend Client

Welcome to the frontend repository for **Questro**! 👋

Questro is an interactive entertainment discovery platform designed to help users dive into a seamless experience to explore movies, games, cast details, and more. 

We built this client with a focus on **performance**, **scalability**, and most importantly, providing a **beautiful, fluid user experience** using modern web technologies and subtle micro-animations.

---

## ✨ Key Features

- **Blazing Fast**: Powered by React 19 and Vite for instant server start and lightning-fast HMR.
- **Beautiful UI**: Styled with Tailwind CSS v4 and brought to life with Framer Motion fluid micro-animations.
- **Robust State Management**: Leveraging Zustand for lightweight global state and React Query for powerful data caching and asynchronous state.
- **Secure Authentication**: Implements a secure credentials and OTP-based authentication flow with HTTP-only cookies and short-lived access tokens.
- **Scalable Architecture**: Organized using a feature-based directory structure to keep the codebase clean and maintainable as it grows.

---

## 🚀 Tech Stack

We carefully selected our tech stack to ensure the best developer and user experience:

- **Core**: [React 19](https://react.dev/) & [Vite](https://vitejs.dev/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) (Icons)
- **State & Data**: [React Query v5](https://tanstack.com/query/latest), [Zustand](https://github.com/pmndrs/zustand)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Networking**: [Axios](https://axios-http.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

---

## 🛠️ Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites

You'll need **Node.js** (v18 or higher) and **npm** installed on your system.

### Installation

1. **Navigate to the client directory**:
   ```bash
   cd client
   ```

2. **Install the dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file in the root of the `client` directory. You can use this example to connect to your local backend:
   ```env
   VITE_API_BASE_URL=http://localhost:5222/api
   ```

### Running the App

Start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Your app should now be running at `http://localhost:5173`! 🎉

---

## 📂 Project Structure

To keep things organized and maintainable, we use a domain-driven, feature-based architecture. Here's a quick tour of the `src/` directory:

- 📁 **`/api`**: Centralized Axios configurations and global API utilities.
- 📁 **`/assets`**: Static files like images, fonts, and global stylesheets (`index.css`).
- 📁 **`/components`**: Reusable UI building blocks (buttons, inputs, modals, etc.) shared across features.
- 📁 **`/features`**: The core domains of the app (`auth`, `movies`, `games`, `profile`, `chatbot`). Each feature module contains its own components, logic, and API calls.
- 📁 **`/hooks`**: Shared custom React hooks.
- 📁 **`/lib`**: Third-party library initializations and wrappers.
- 📁 **`/pages`**: Top-level route components representing full views.
- 📁 **`/routes`**: Routing configuration mapping URLs to pages.
- 📁 **`/utils`**: Helpful utility functions and shared methods.

---

## 🔐 Authentication Flow

Security is a priority. Here's how our auth flow works under the hood:

1. **Login**: Users authenticate with standard credentials.
2. **Verification (OTP)**: A One-Time Password is sent by the backend to verify the session.
3. **Token Management**: Once verified, the app receives a short-lived access token (stored safely in memory via Zustand) and a refresh token (stored securely as an `HttpOnly` cookie).

---

## 📜 Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Bundles the application for production.
- `npm run preview`: Bootstraps a local server to preview the production build.
- `npm run lint`: Runs ESLint to identify syntax and styling issues.

---

*Happy coding! If you have any questions or run into issues, feel free to explore the code or reach out.* 🚀
