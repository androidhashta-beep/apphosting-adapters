# NaviQueue Pro

This is a Next.js application for a smart queueing system, built in Firebase Studio.

## Getting Started

To run the application in development mode, use the following command in the terminal:

```bash
npm run dev
```

This will start the Next.js development server. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Building, Installing, and Updating the App

### Building for Production

To create an optimized version of the app that's ready for deployment, you need to "build" it. This process bundles all the code into a few static files. You can do this by running:

```bash
npm run build
```

This will create a production-ready version of your app in the `.next` folder.

### Installing the App (PWA)

This application is a **Progressive Web App (PWA)**, which means it can be "installed" directly from the browser onto your computer.

**Key Features of PWA Installation:**
- **Runs in its own window:** It feels like a native desktop application, not just a browser tab.
- **Desktop Icon:** It gets its own icon on the desktop, Start Menu, and taskbar for easy access.
- **Offline Capability:** The app can be launched and used even if the computer is not connected to the internet.

**How to Install:**

1.  **Open the application's URL** in Google Chrome or Microsoft Edge.
2.  In the browser's address bar, look for an **"Install" icon**. It usually looks like a computer screen with a downward arrow.
3.  Click the icon and then click **"Install"** in the prompt that appears.

The app will now be installed on your system.

### Updating the Installed App

Because this is a PWA, **you do not need to manually update or reinstall it.** Updates are handled automatically by the browser.

Here's how it works:
1.  After you build and deploy a new version of the app, the next time a user opens their installed app while connected to the internet, the browser will detect the new version and download it in the background.
2.  The next time the user closes and re-opens the app, it will automatically launch the newly updated version.

## Deployment

When you're ready to share the app with users, you need to deploy it. This is a standard Next.js application and can be deployed to any platform that supports Next.js.

### Firebase App Hosting

This project is pre-configured for deployment with Firebase App Hosting. To deploy, you can connect your repository to a Firebase project.

### Other Platforms

You can also deploy this application to other services like Vercel, Netlify, or your own server. After building the app (`npm run build`), you can start the production server with:
```bash
npm run start
```

## Accessing the App on a Local Network

When you run the app using `npm run dev` or `npm run start`, it is configured to be accessible from other devices on your local network. However, for this to work, you may need to adjust the firewall settings on the computer running the application (the server).

By default, firewalls on Windows and macOS often block incoming connections for security. You must create a new **inbound firewall rule** to allow traffic on **port 3000**.

**Example for Windows Defender Firewall:**
1.  Open "Windows Defender Firewall with Advanced Security".
2.  Go to "Inbound Rules" -> "New Rule...".
3.  Choose "Port", then "TCP", and specify port `3000`.
4.  Select "Allow the connection".
5.  Apply the rule to all network profiles (Domain, Private, Public).
6.  Name the rule something descriptive, like "NaviQueue Pro".

Once this rule is in place, other devices on the same network can access the app by navigating to `http://<server-ip-address>:3000` in their browser (e.g., `http://10.30.0.250:3000`).
