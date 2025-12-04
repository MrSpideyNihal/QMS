# 🚀 How to Deploy to Netlify

Your application is now fully configured for Netlify! Follow these simple steps to deploy.

## Prerequisites
- A [Netlify account](https://www.netlify.com/)
- [GitHub account](https://github.com/) (recommended) or Netlify CLI

## Method 1: Deploy via GitHub (Recommended)

1.  **Push your code to GitHub**
    - Create a new repository on GitHub.
    - Push your code:
      ```bash
      git init
      git add .
      git commit -m "Initial commit"
      git branch -M main
      git remote add origin <your-repo-url>
      git push -u origin main
      ```

2.  **Connect to Netlify**
    - Log in to Netlify.
    - Click **"Add new site"** > **"Import from an existing project"**.
    - Select **GitHub** and choose your repository.

3.  **Configure Build Settings**
    - **Build command:** `npm run build`
    - **Publish directory:** `.next`
    - Click **"Deploy site"**.

4.  **Add Environment Variables**
    - Go to **Site configuration** > **Environment variables**.
    - Add the following variables (copy from your `.env.local`):

    | Key | Value |
    |-----|-------|
    | `MONGODB_URI` | `mongodb+srv://oneforall0311_db_user:JFtgU1GDBXfmNlvl@cluster0.uktus9z.mongodb.net/restaurant-queue?retryWrites=true&w=majority&appName=Cluster0` |
    | `JWT_SECRET` | `qms-super-secret-jwt-key-production-2024-change-this` |
    | `NEXT_PUBLIC_API_URL` | `https://<your-site-name>.netlify.app` |

5.  **Redeploy**
    - Go to **Deploys** tab.
    - Click **"Trigger deploy"** > **"Clear cache and deploy site"**.

## Method 2: Deploy via Netlify CLI (Manual)

1.  **Install CLI**
    ```bash
    npm install -g netlify-cli
    ```

2.  **Build Project**
    ```bash
    npm run build
    ```

3.  **Deploy**
    ```bash
    netlify deploy --prod
    ```
    - Select "Create & configure a new site".
    - **Publish directory:** `.next`

4.  **Set Environment Variables**
    - Go to your Netlify dashboard for the new site.
    - Add the variables listed in Method 1.

## ✅ What to Expect
- **Real-time Updates:** The app now uses "polling" (checks every 5 seconds) instead of live sockets. This works perfectly on Netlify!
- **Performance:** First load might take a few seconds (serverless cold start), then it will be fast.
- **Database:** Your MongoDB Atlas connection works globally.

## 🎉 Done!
Your Restaurant Queue System is ready for the world!
