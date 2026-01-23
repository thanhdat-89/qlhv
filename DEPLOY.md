# Deployment Guide

Follow these steps to deploy your **Student Management System** to Vercel and connect it to a Supabase database.

## 1. Supabase Setup (Database)

1.  **Create a Project**: Go to [Supabase](https://supabase.com/), sign up/login, and create a new project.
2.  **Create Tables**:
    -   Go to the **SQL Editor** in your Supabase dashboard.
    -   Open the `schema.sql` file from this project.
    -   Copy the content and paste it into the SQL Editor.
    -   Click **Run** to create the tables.
3.  **Get Credentials**:
    -   Go to **Project Settings** -> **API**.
    -   Copy the **Project URL** and **anon public key**. You will need these for Vercel.

## 2. Vercel Deployment

1.  **Install Vercel CLI** (if not installed):
    ```bash
    npm install -g vercel
    ```

2.  **Login to Vercel**:
    ```bash
    vercel login
    ```

3.  **Deploy**:
    Run the following command in your terminal from the project root:
    ```bash
    vercel
    ```
    -   Follow the prompts (say `y` to defaults).

4.  **Configure Environment Variables**:
    -   Go to your Vercel Dashboard for the newly created project.
    -   Navigate to **Settings** -> **Environment Variables**.
    -   Add the following variables using the credentials from Supabase:
        -   `VITE_SUPABASE_URL`: (Paste your Project URL)
        -   `VITE_SUPABASE_ANON_KEY`: (Paste your anon public key)

5.  **Redeploy**:
    -   After adding variables, you may need to redeploy for them to take effect.
    ```bash
    vercel --prod
    ```

## 3. Switching to Real Backend

Currently, the app is set up to use a **Service Layer**. The services in `src/services/` are currently using `localStorage` (Mock Mode) to let you test the deployment easily.

**To switch to Supabase:**
1.  Open `src/services/studentService.js`, `classService.js`, etc.
2.  Replace the localStorage logic with Supabase API calls.
    -   *Example:* `supabase.from('students').select('*')`
3.  Since the UI already uses `async/await`, no changes are needed in `useDatabase.js` or your components!
