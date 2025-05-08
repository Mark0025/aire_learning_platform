# Development Utilities

This directory contains utilities to assist in development and testing of the Study Game platform.

## Dev Simulator

The `dev-simulator.js` script simulates user activity by:
1. Generating random user IDs
2. Randomly answering questions from selected modules
3. Creating simulated quiz sessions and progress data

This helps quickly populate the system with test data for development purposes.

### Usage

Run the script directly:
```bash
npm run dev:sim
```

Or start the development server with simulation tools:
```bash
npm run dev:with-sim
```

When running through the simulator:
1. You will be prompted to select a module or run through all modules
2. You will be asked how many questions to simulate answers for
3. After completion, the script will generate a simulated user ID and save progress data

## Development Mode

You can access development tools in the web application by adding `?dev=true` to the URL:
```
http://localhost:3000/?dev=true
```

This will display a development toolbar with the following tools:
- **Answer Randomly**: Quickly fill in random answers for the current quiz
- **Load Simulated User**: Choose from previously simulated users
- **Clear Storage**: Reset all local storage data

## Using Simulated User Data

After running the simulator, you can load the simulated user data in two ways:

1. **From the Dev Tools panel**:
   - Open the application with `?dev=true` in the URL
   - Click "Load Simulated User"
   - Select a user from the dropdown
   - Click "Load Selected User"

2. **Manually in the browser console**:
   ```javascript
   localStorage.setItem('currentUserId', 'sim_user_123456789');
   ```
   Then refresh the page to see the simulated user's progress.

The simulator saves user progress data in the `data/` directory as JSON files. 