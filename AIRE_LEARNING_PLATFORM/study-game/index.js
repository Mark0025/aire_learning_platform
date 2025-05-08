// Main application entry point
const app = require('./src/server');

// Get port from environment variable or use default
const PORT = process.env.NODE_PORT || process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 