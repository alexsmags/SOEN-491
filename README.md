# AI-Based Image Caption Generator (SOEN-491)

A full-stack web application that uses an AI wrapper to generate captions for images, allowing users to edit captions in an editor page, share them to social media or various apps on Windows, and manage their saved content in a personal workspace.

Built with a **React + Vite + Tailwind** frontend and a **Node.js + Express** backend, integrated with **Supabase** for authentication and local computer storage.

---

## Release Information
**Current Version:** v1.0.0  
**Release Date:** November 2025  

**Key Features:**
- AI-based automatic caption generation  
- Caption style and tone customization  
- Workspace for saving and editing captioned images  
- Direct social media sharing via Windows sharing system.

---

## Tech Stack

### Frontend
- React (Vite)
- TailwindCSS
- Axios
- Auth.js

### Backend
- Node.js + Express.js
- Auth.js
- Prisma ORM
- Nodemon

### Database & Storage
- PostgreSQL
- Local Object Storage (Constraint: cloud are paid services).
- Prisma Adapter for Supabase

---

## How to Run the Project

bash
### 1. Clone the repository
```
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Install dependencies

#### For client
```
cd client
npm install
```

#### For server
```
cd ../server
npm install
npx prisma generate
```

### 3. Start the backend
```
cd server
npm run dev
```
#### Backend runs at: http://localhost:5000

### 4. Start the frontend (open a new terminal)
```
cd client
npm run dev
```
#### Frontend runs at: http://localhost:5173

---

## End-to-End Tests (Playwright)

### 1) Install Playwright (in root)
```bash
npm install -D @playwright/test
npm run build
npx playwright test
```

---

### Documentation
- [User Guide](./docs/user_guide.md): How to use the application
- [User_Feedback](./docs/feedback.md): User feedback 
- [Security & Risk Report](./docs/security_risk.md): Risk analysis and mitigations
- [API Docs (Swagger UI)](http://localhost:5000/docs): http://localhost:5000/docs
