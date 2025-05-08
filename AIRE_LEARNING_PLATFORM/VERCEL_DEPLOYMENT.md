# Deploying AIRE Learning Platform to Vercel

This guide covers how to properly deploy the AIRE Learning Platform to Vercel.

## Prerequisites

- A Vercel account
- The Vercel CLI (optional, for advanced deployment)

## Deployment Steps

### Option 1: Deploy with the Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and login to your account
2. Click "Add New..." → "Project"
3. Import your Git repository or upload the project files
4. Configure the deployment settings:
   - **Project Name**: Your preferred name
   - **Framework Preset**: Other
   - **Root Directory**: `AIRE_LEARNING_PLATFORM/study-game`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `public`
   - **Install Command**: `npm install`
5. Click "Deploy"

### Option 2: Deploy with Vercel CLI

1. Install the Vercel CLI: `npm i -g vercel`
2. Navigate to the `AIRE_LEARNING_PLATFORM/study-game` directory
3. Run `vercel` and follow the prompts
4. If you're updating an existing deployment, use `vercel --prod`

## Configuration Files

The following files have been configured specifically for Vercel deployment:

### vercel.json

This file tells Vercel how to build and serve the application:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

### Package.json

The package.json file has a special `vercel-build` script that ensures all necessary directories exist and files are built:

```json
"scripts": {
  "vercel-build": "npm run build && mkdir -p learning/modules && touch learning/modules/index.json"
}
```

## Troubleshooting

If you encounter issues during deployment:

1. **Build Failures**: Check the Vercel deployment logs. Look for any missing dependencies or build script errors.

2. **404 Errors** for SVG files: The MIME type configuration has been added to server.js. If still having issues, ensure the file paths are correct.

3. **Module Loading Errors**: The `vercel-build` script creates an initial `index.json` file, but if you're seeing errors related to modules, you may need to manually upload your module files to the Vercel deployment.

4. **Serverless Function Timeouts**: Vercel has limits on serverless function execution time. If your app is timing out, consider optimizing your server endpoints.

## Environment Variables

If your application requires environment variables (API keys, etc.), you can add them in the Vercel project settings under "Environment Variables." 