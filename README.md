# Daymark — MERN Todo App

A responsive todo list built with React, Express, Node.js, and MongoDB. It supports adding, editing, completing, filtering, and deleting tasks. The Express server serves the built React app at `/`, so the backend base URL opens the Todo app. `GET /name` returns `Developer Name: <name>` as plain text.

## Set up locally

1. Install Node.js 20 or newer and create a MongoDB Atlas database (or use a MongoDB instance you control).
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and `DEVELOPER_NAME`.
3. From this folder, run `npm install`, `npm run setup`, then `npm run dev`.
4. Open `http://localhost:5173`. The API runs at `http://localhost:5000`.

The Vite development server proxies `/api` and `/name` to the local Express server. For production builds, leave `VITE_API_URL` unset when the client is served by the Express backend. For a separately hosted frontend, set it to the backend base URL.

## Deploy the backend and database

1. Create a **personal MongoDB Atlas project and cluster** for your assignment. Add a database user, allow your backend host to connect, and copy its connection string. Replace the username, password, and database name. Keep this private.
2. Push this repository to your own GitHub account.
3. Create a Render Web Service from that repository. Set the root directory to `outputs/mern-todo-app` if the repository contains the parent workspace, or the repository root if you pushed this folder by itself.
4. Set the build command to `npm install && npm run build` and the start command to `npm start`.
5. Add these Render environment variables:
   - `MONGODB_URI`: your Atlas connection string
   - `DEVELOPER_NAME`: your name
   - `CLIENT_ORIGINS`: your Vercel frontend URL, if using a separate frontend (otherwise omit)
6. Deploy. The Render service URL is the **Live Backend Base URL** and should show the app; append `/name` to confirm the name endpoint.

## Deploy the frontend separately (optional)

The backend deployment already serves the app. If a separate frontend URL is required, import the same repository into Vercel and set the project root to `outputs/mern-todo-app/client` (or the repository root if this folder is the repo root). Use `npm run build` as the build command and `dist` as the output directory. Set `VITE_API_URL` to the deployed Render backend URL. Add the Vercel URL to the backend's comma-separated `CLIENT_ORIGINS`, then redeploy the backend. If the backend URL is submitted as the frontend URL, it satisfies the assignment's requirement that the backend base URL display the app.

## Submission checklist

- Developer Name: Abin Mathew (set `DEVELOPER_NAME=Abin Mathew` in the backend environment)
- Live Frontend URL: deployed Vercel URL, or the backend URL if using the backend-served app
- Live Backend Base URL: deployed Render URL
- GitHub Repository URL: your public repository URL

Each developer should deploy their own backend service and MongoDB database. Never commit `.env` files or publish database credentials.
