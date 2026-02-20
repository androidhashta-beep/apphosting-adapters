# Smart Queueing System

This is a Next.js & Electron desktop application for a smart queueing system, built in Firebase Studio.

## Getting Started

To run the application in development mode, which includes hot-reloading for both the web content and the Electron app, use the following command:

```bash
npm run electron:dev
```

This will start the Next.js development server and then launch the Electron window.

## Deployment

This application is built as a desktop app using Electron. You can create distributable packages for Windows, macOS, and Linux using the provided scripts.

### Packaging the Application

To bundle your application into a folder for your operating system (without creating an installer), run:

```bash
npm run electron:package
```

This command first builds the Next.js static files (`npm run build`) and then uses Electron Forge to package them into an application. The output will be in a new `out` directory at the project root (e.g., `out/nextn-desktop-win32-x64`).

### Creating an Installer

To create a full installer for your application (e.g., an `.exe` for Windows or a `.dmg` for macOS), run:

```bash
npm run electron:make
```

This command also builds the Next.js project first. Electron Forge will then create the installers in the `out/make` directory.

After running this command, you can find the distributable files and share them with your users.
