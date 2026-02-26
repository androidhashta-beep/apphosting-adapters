# NaviQueue Pro

This is a Next.js application for a smart queueing system, built in Firebase Studio.

## Getting Started

To run the application in development mode, use the following command in the terminal:

```bash
npm run dev
```

This will start the Next.js development server. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Deployment and Installation Guide

This application is designed to be deployed to a web server and then "installed" on your local PCs as a Progressive Web App (PWA). This gives you a desktop-like experience with the benefit of automatic updates.

### Step 1: Build the App for Production

To create an optimized version of the app that's ready for deployment, you need to "build" it. This process bundles all the code and prepares it for a server.

Run the following command in your terminal:

```bash
npm run build
```

This will create a production-ready version of your app in the `.next` folder.

### Step 2: Deploy the App to a Server

This project is pre-configured for deployment with **Firebase App Hosting**, which is the recommended method.

**How it Works:**
1.  You connect your source code repository (e.g., a GitHub repository) to a Firebase project.
2.  Whenever you push new code, Firebase automatically builds and deploys the new version of your application for you.

You can find the official guide for setting this up here: [Firebase App Hosting Quickstart](https://firebase.google.com/docs/app-hosting/get-started?platform=nextjs).

(You can also deploy this application to other services like Vercel, Netlify, or your own server that supports Node.js. After running `npm run build`, you can start the production server with `npm run start`.)

### Step 3: Install the App on Your PCs

Once the app is deployed and you have a public URL (e.g., `https://your-app-name.web.app`), you can install it on any number of PCs.

**How to Install:**

1.  **Open the application's URL** in Google Chrome or Microsoft Edge on the PC where you want to install it.
2.  In the browser's address bar, look for an **"Install" icon**. It usually looks like a computer screen with a downward arrow.
3.  Click the icon and then click **"Install"** in the prompt that appears.

The app will now be installed on that computer. It will have its own desktop icon and run in its own window, just like a regular `.exe` application.

### Step 4: Updating the App

This is the best part. **You do not need to manually update or reinstall the app.**

Whenever you deploy a new version (Step 2), the installed apps on your PCs will automatically download the update in the background. The next time a user closes and re-opens the app, it will be the new version.

## Accessing the App on a Local Network

When you run the app in development (`npm run dev`), it is configured to be accessible from other devices on your local network. However, for this to work, you may need to adjust the firewall settings on the computer running the application (the server).

By default, firewalls on Windows and macOS often block incoming connections for security. You must create a new **inbound firewall rule** to allow traffic on **port 3000**.

**Example for Windows Defender Firewall:**
1.  Open "Windows Defender Firewall with Advanced Security".
2.  Go to "Inbound Rules" -> "New Rule...".
3.  Choose "Port", then "TCP", and specify port `3000`.
4.  Select "Allow the connection".
5.  Apply the rule to all network profiles (Domain, Private, Public).
6.  Name the rule something descriptive, like "NaviQueue Pro".

Once this rule is in place, other devices on the same network can access the app by navigating to `http://<server-ip-address>:3000` in their browser (e.g., `http://10.30.0.250:3000`).
