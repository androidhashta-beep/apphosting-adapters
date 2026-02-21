# NaviQueue Pro

This is a Next.js application for a smart queueing system, built in Firebase Studio.

## Getting Started

To run the application in development mode, use the following command in the terminal:

```bash
npm run dev
```

This will start the Next.js development server. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Manual Installation for Windows 10 & 11

This application is a **Progressive Web App (PWA)**. This is a modern way to create installable applications that doesn't require a traditional `.exe` or `.msi` installer file. Instead, users can install it directly from their web browser (like Chrome or Edge) onto their computer.

**Key Features of PWA Installation:**
- **Runs in its own window:** It feels like a native desktop application, not just a browser tab.
- **Desktop Icon:** It gets its own icon on the desktop, Start Menu, and taskbar for easy access.
- **Offline Capability:** The app can be launched and used even if the computer is not connected to the internet.

### How to Install

To install the app, you first need to have it running. You can either run it locally for testing or deploy it to a hosting service to get a public URL.

1.  **Open the application's URL** in Google Chrome or Microsoft Edge.
    *   **For local testing on your network:** Other users on the same Wi-Fi can often use `http://<your-computer's-IP-address>:3000`.
    *   **After deployment:** Use the public URL provided by your hosting service (e.g., Firebase App Hosting).

2.  In the browser's address bar, look for an **"Install" icon**. It usually looks like a computer screen with a downward arrow.

3.  Click the icon and then click **"Install"** in the prompt that appears.

4.  That's it! The app is now "installed." You can find it in your Start Menu and pin it to your taskbar just like any other program.

## Deployment

When you're ready to share the app with users outside your local network, you need to deploy it. This is a standard Next.js application and can be deployed to any platform that supports Next.js.

### Firebase App Hosting

This project is pre-configured for deployment with Firebase App Hosting. To deploy, you can connect your repository to a Firebase project.

### Other Platforms

You can also deploy this application to other services like Vercel, Netlify, or your own server.

1.  Build the application for production:
    ```bash
    npm run build
    ```
2.  Start the production server:
    ```bash
    npm run start
    ```
