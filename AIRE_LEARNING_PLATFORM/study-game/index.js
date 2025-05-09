// Main application entry point
const app = require('./src/server');

// Get port from environment variable or use default
const PORT = process.env.NODE_PORT || process.env.PORT || 3000;

// For Vercel serverless deployment
if (process.env.VERCEL) {
  // Export the Express app for Vercel serverless functions
  module.exports = app;
} else {
  // Start the server for local development
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} 