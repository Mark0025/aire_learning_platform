# AIRE Learning Platform Codebase Documentation

Generated on Thu May  8 21:11:22 CDT 2025

## Table of Contents

- [Core Configuration Files](#core-configuration-files)
  - [vercel.json](#vercel-json)
  - [package.json](#package-json)
  - [tailwind.config.js](#tailwind-config-js)
  - [postcss.config.js](#postcss-config-js)
  - [.nvmrc](#-nvmrc)
- [Main Application Files](#main-application-files)
  - [./index.js](#index.js)
  - [./src/server.js](#--src-server.js)
- [Frontend Files](#frontend-files)
  - [./src/public/dev-tools-help.html](#--src-public-dev-tools-help.html)
  - [./src/public/flashcards.html](#--src-public-flashcards.html)
  - [./src/public/game.js](#--src-public-game.js)
  - [./src/public/index.html](#--src-public-index.html)
  - [./src/public/js/shared-assets.js](#--src-public-js-shared-assets.js)
  - [./src/public/questions.js](#--src-public-questions.js)
  - [./src/public/style.css](#--src-public-style.css)
  - [./src/public/upload.html](#--src-public-upload.html)
  - [./src/public/user-history.html](#--src-public-user-history.html)
- [Learning Modules](#learning-modules)
  - [./src/learning/modules/index.json](#--src-learning-modules-index.json)
  - [./src/learning/modules/intro-to-ai.json](#--src-learning-modules-intro-to-ai.json)
  - [./src/learning/modules/js-basics.json](#--src-learning-modules-js-basics.json)
  - [./src/learning/modules/tauros-module1.json](#--src-learning-modules-tauros-module1.json)
  - [./src/learning/schema.json](#--src-learning-schema.json)
  - [./src/learning/templates/example-module.json](#--src-learning-templates-example-module.json)
  - [./src/learning/templates/module-template.json](#--src-learning-templates-module-template.json)
- [Utility Scripts](#utility-scripts)
  - [./src/scripts/dev-simulator.js](#--src-scripts-dev-simulator.js)
  - [./src/scripts/generate-ai-questions.js](#--src-scripts-generate-ai-questions.js)
  - [./src/scripts/generate-module-from-text.js](#--src-scripts-generate-module-from-text.js)
  - [./src/utils/questionUtils.js](#--src-utils-questionUtils.js)
  - [./src/utils/userProgressUtils.js](#--src-utils-userProgressUtils.js)

## Core Configuration Files

### vercel.json

File path: `./vercel.json`

```json
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs22.x"
    },
    "index.js": {
      "runtime": "nodejs22.x"
    }
  },
  "outputDirectory": "src/public",
  "public": true,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.js" }
  ]
} ```

### package.json

File path: `./package.json`

```json
{
  "name": "study-game",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "NODE_PORT=4000 node index.js",
    "dev": "concurrently \"NODE_PORT=4000 node index.js\" \"npx tailwindcss -i ./src/style.css -o ./src/public/style.css --watch\"",
    "dev:sim": "node src/scripts/dev-simulator.js",
    "dev:with-sim": "concurrently \"NODE_PORT=4000 node index.js\" \"npx tailwindcss -i ./src/style.css -o ./src/public/style.css --watch\" \"npm run dev:sim\"",
    "build": "mkdir -p src/learning/modules src/learning/uploads src/data && touch src/learning/modules/index.json",
    "import-module": "node src/learning/scripts/import-module.js",
    "list-modules": "node -e \"console.table(require('./src/learning/modules/index.json').modules.map(m => ({moduleId: m.moduleId, name: m.moduleName, questions: m.questionCount, flashcards: m.flashcardCount})))\""
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": "",
  "engines": {
    "node": "22.x"
  },
  "dependencies": {
    "ajv": "^8.12.0",
    "ajv-formats": "^2.1.1",
    "concurrently": "^9.1.2",
    "express": "^5.1.0",
    "mime": "^2.6.0",
    "multer": "^1.4.5-lts.1",
    "wink-eng-lite-web-model": "^1.8.1",
    "wink-nlp": "^2.3.2"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.3",
    "tailwindcss": "^4.1.5"
  }
}
```

### tailwind.config.js

File path: `./tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/public/**/*.{html,js}',
    './src/**/*.{html,js}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} ```

### postcss.config.js

File path: `./postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
} ```

### .nvmrc

File path: `./.nvmrc`

```plaintext
22.x ```

## Main Application Files

### ./index.js

File path: `./index.js`

```javascript
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
} ```

### ./src/server.js

File path: `./src/server.js`

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { promisify } = require('util');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const mime = require('mime');
// Import the module generator
const { generateModuleFromText, saveModule } = require('./scripts/generate-module-from-text.js');

const app = express();
const PORT = process.env.NODE_PORT || process.env.PORT || 3000;

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Setup file upload handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'learning', 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only JSON files
    if (file.mimetype !== 'application/json' && !file.originalname.endsWith('.json')) {
      return cb(new Error('Only JSON files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Configure express.static with proper MIME types
mime.define({
  'image/svg+xml': ['svg']
}, { force: true });

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve learning modules and assets
app.use('/learning', express.static(path.join(__dirname, 'learning')));

// Serve user progress data in dev mode only
app.use('/data', (req, res, next) => {
  // Only allow access if dev parameter is present in the query string
  if (req.query.dev !== undefined) {
    express.static(path.join(__dirname, 'data'))(req, res, next);
  } else {
    res.status(403).send('Access denied');
  }
});

// JSON body parser middleware
app.use(express.json());

// API to get available simulated users
app.get('/api/dev/users', (req, res) => {
  // Only allow access if dev parameter is present
  if (req.query.dev === undefined) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const dataDir = path.join(__dirname, 'data');
  
  try {
    if (!fs.existsSync(dataDir)) {
      return res.json({ users: [] });
    }
    
    const files = fs.readdirSync(dataDir);
    const users = files
      .filter(file => file.startsWith('progress_') && file.endsWith('.json'))
      .map(file => {
        const userId = file.replace('progress_', '').replace('.json', '');
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
          return {
            userId,
            createdAt: data.createdAt || 'Unknown',
            lastUpdated: data.lastUpdated || 'Unknown',
            totalAnswered: data.totalAnswered || 0,
            totalCorrect: data.totalCorrect || 0,
            moduleCount: Object.keys(data.modules || {}).length
          };
        } catch (error) {
          return { userId, error: 'Failed to parse data' };
        }
      });
    
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// API to save user progress data
app.post('/api/dev/save-user-progress', async (req, res) => {
  // Only allow access if dev parameter is present
  if (req.query.dev === undefined) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  try {
    const userData = req.body;
    
    if (!userData || !userData.userId) {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save the user progress file
    const progressFilePath = path.join(dataDir, `progress_${userData.userId}.json`);
    await writeFile(progressFilePath, JSON.stringify(userData, null, 2), 'utf8');
    
    res.json({ success: true, message: 'User progress saved successfully' });
  } catch (error) {
    console.error('Error saving user progress:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve the index.html file for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the flashcards.html file
app.get('/flashcards', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'flashcards.html'));
});

// Serve the upload.html file
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// API endpoint to handle module uploads
app.post('/api/upload-module', upload.single('module'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Read the uploaded file
    const moduleData = JSON.parse(await readFile(req.file.path, 'utf8'));

    // Read the schema file for validation
    const schemaPath = path.join(__dirname, 'learning', 'schema.json');
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));

    // Validate the module against the schema
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(moduleData);

    if (!valid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid module format', 
        errors: validate.errors 
      });
    }

    // Process module metadata
    const now = new Date().toISOString();
    if (!moduleData.createdAt) {
      moduleData.createdAt = now;
    }
    moduleData.updatedAt = now;

    // Save the module file
    const modulesDir = path.join(__dirname, 'learning', 'modules');
    const moduleFilePath = path.join(modulesDir, `${moduleData.moduleId}.json`);

    // Check if module already exists
    const moduleExists = fs.existsSync(moduleFilePath);
    
    // Write the module file
    await writeFile(moduleFilePath, JSON.stringify(moduleData, null, 2), 'utf8');

    // Update the module index
    await updateModuleIndex(moduleData);

    // Delete the temporary upload file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: moduleExists ? 'Module updated successfully' : 'Module created successfully',
      moduleId: moduleData.moduleId
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update the module index file
async function updateModuleIndex(moduleData) {
  const indexPath = path.join(__dirname, 'learning', 'modules', 'index.json');
  let index = { modules: [] };
  
  // Read existing index if it exists
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(await readFile(indexPath, 'utf8'));
    } catch (error) {
      console.warn('Warning: Could not read module index. Creating a new one.');
    }
  }
  
  // Remove existing module entry if any
  index.modules = index.modules.filter(m => m.moduleId !== moduleData.moduleId);
  
  // Add new module entry
  index.modules.push({
    moduleId: moduleData.moduleId,
    moduleName: moduleData.moduleName,
    description: moduleData.description || '',
    category: moduleData.category || 'Uncategorized',
    difficulty: moduleData.difficulty || 'beginner',
    tags: moduleData.tags || [],
    coverImage: moduleData.coverImage || '',
    questionCount: moduleData.questions ? moduleData.questions.length : 0,
    flashcardCount: moduleData.flashcards ? moduleData.flashcards.length : 0,
    updatedAt: moduleData.updatedAt
  });
  
  // Sort modules by category and name
  index.modules.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.moduleName.localeCompare(b.moduleName);
  });
  
  // Write the index file
  await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
}

// Create necessary directories
const dirs = [
  path.join(__dirname, 'learning', 'modules'),
  path.join(__dirname, 'learning', 'assets'),
  path.join(__dirname, 'learning', 'uploads')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create an index.json if it doesn't exist
const modulesDir = path.join(__dirname, 'learning', 'modules');
const indexPath = path.join(modulesDir, 'index.json');

// Create the index file if it doesn't exist
if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, JSON.stringify({ modules: [] }), 'utf8');
  console.log('Created empty modules index file');
}

// API endpoint to generate a module from text
app.post('/api/generate-module-from-text', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { text, moduleId, moduleName, description, maxQuestions = 50 } = req.body;
    
    // Basic validation
    if (!text || !moduleId || !moduleName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: text, moduleId, and moduleName are required' 
      });
    }
    
    // Generate module
    console.log(`Generating module ${moduleId} from text (${text.length} characters)`);
    const module = generateModuleFromText(text, moduleId, moduleName, description, maxQuestions);
    
    // Save the module
    await saveModule(module);
    
    res.json({
      success: true,
      message: 'Module generated and saved successfully',
      moduleId: module.moduleId,
      questionCount: module.questions.length
    });
  } catch (error) {
    console.error('Error generating module from text:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Don't export directly - we'll use a separate file as entry point
module.exports = app; ```

## Frontend Files

### ./src/public/dev-tools-help.html

File path: `./src/public/dev-tools-help.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Study Game Dev Tools Documentation</title>
  <link rel="stylesheet" href="style.css">
  <style>
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    .doc-section {
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .issue {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background-color: #f3f4f6;
      border-radius: 0.5rem;
    }
    
    .code {
      font-family: monospace;
      background-color: #f3f4f6;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
    }
    
    pre {
      background-color: #f3f4f6;
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
    }
    
    .steps {
      margin-left: 1.5rem;
    }
    
    .notes {
      margin-top: 1rem;
      padding: 0.75rem;
      background-color: #e0f2fe;
      border-radius: 0.5rem;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-blue-100 to-indigo-200 min-h-screen">
  <div class="container bg-white rounded-lg shadow-lg p-6 my-6">
    <header class="text-center mb-8">
      <h1 class="text-3xl font-bold text-indigo-800 mb-2">🛠️ Study Game Dev Tools Guide</h1>
      <a href="index.html" class="text-indigo-600 hover:text-indigo-800 font-bold">← Back to Game</a>
    </header>

    <div class="doc-section">
      <h2 class="text-2xl font-semibold text-indigo-700 mb-4">Enabling Dev Mode</h2>
      <p class="mb-4">To enable the development tools, add <span class="code">?dev=true</span> to the URL:</p>
      <pre>http://localhost:3000/?dev=true</pre>
      <p class="mt-4">This will activate both the floating dev panel in the top-right corner and the fixed dev toolbar at the bottom of the screen.</p>
    </div>

    <div class="doc-section">
      <h2 class="text-2xl font-semibold text-indigo-700 mb-4">Available Dev Tools</h2>
      
      <h3 class="text-xl font-semibold text-indigo-600 mb-3">1. Answer Randomly</h3>
      <p class="mb-2"><strong>Purpose:</strong> Automatically answers all questions in the current quiz session with random selections.</p>
      
      <p class="mb-2"><strong>How to use:</strong></p>
      <ol class="steps mb-4">
        <li>Select a module and start a quiz</li>
        <li>Click "Answer Randomly" in either dev panel</li>
        <li>The system will instantly select random answers for all questions</li>
        <li>A notification will show your final score (e.g., "Randomly answered all questions. Score: 2/10")</li>
      </ol>
      
      <div class="notes">
        <p class="font-medium mb-1">Notes:</p>
        <ul class="list-disc ml-5">
          <li>This tool is useful for quickly testing quiz completion flow</li>
          <li>The score will vary as answers are selected randomly</li>
          <li>You can still navigate through questions to review the randomly selected answers</li>
        </ul>
      </div>
      
      <h3 class="text-xl font-semibold text-indigo-600 mb-3 mt-6">2. Load Simulated User</h3>
      <p class="mb-2"><strong>Purpose:</strong> Load progress data from previously simulated users created via the simulation script.</p>
      
      <p class="mb-2"><strong>How to use:</strong></p>
      <ol class="steps mb-4">
        <li>Click "Load Simulated User" in either dev panel</li>
        <li>A dropdown will appear with available simulated users</li>
        <li>Select a user from the list</li>
        <li>Click "Load Selected User"</li>
        <li>The page will reload with the selected user's progress data</li>
      </ol>
      
      <div class="notes">
        <p class="font-medium mb-1">Notes:</p>
        <ul class="list-disc ml-5">
          <li>Simulated users are created by running <span class="code">npm run dev:sim</span></li>
          <li>Each simulated user has their own history, progress, and statistics</li>
          <li>You can use this to test the UI with different progress states</li>
        </ul>
      </div>
      
      <h3 class="text-xl font-semibold text-indigo-600 mb-3 mt-6">3. Clear Storage</h3>
      <p class="mb-2"><strong>Purpose:</strong> Reset all local storage data to start with a clean state.</p>
      
      <p class="mb-2"><strong>How to use:</strong></p>
      <ol class="steps mb-4">
        <li>Click "Clear Storage" in either dev panel</li>
        <li>Confirm the action in the alert dialog</li>
        <li>The page will reload with all local storage data cleared</li>
      </ol>
      
      <div class="notes">
        <p class="font-medium mb-1">Notes:</p>
        <ul class="list-disc ml-5">
          <li>This is useful when you want to reset your testing environment</li>
          <li>All progress, settings, and user data will be removed from the browser</li>
        </ul>
      </div>
    </div>

    <div class="doc-section">
      <h2 class="text-2xl font-semibold text-indigo-700 mb-4">Creating Simulated User Data</h2>
      <p class="mb-4">To generate simulated user data for testing:</p>
      
      <ol class="steps mb-4">
        <li>Run the simulation script:
          <pre>npm run dev:sim</pre>
        </li>
        <li>Follow the prompts to select modules and number of questions</li>
        <li>The script will create a simulated user with random answers</li>
        <li>Load this user with the "Load Simulated User" tool</li>
      </ol>
    </div>

    <div class="doc-section">
      <h2 class="text-2xl font-semibold text-indigo-700 mb-4">Testing Multiple Questions</h2>
      <p class="mb-4">When testing question batches:</p>
      
      <ol class="steps mb-4">
        <li>Make sure to set the desired batch size in the settings (5, 10, 20, etc.)</li>
        <li>Start the quiz with a module containing enough questions</li>
        <li>If you need to answer quickly, use the "Answer Randomly" tool</li>
      </ol>
      
      <div class="notes">
        <p>The batch size setting limits the number of questions shown in a session, which is helpful for testing different quiz lengths.</p>
      </div>
    </div>

    <div class="doc-section">
      <h2 class="text-2xl font-semibold text-indigo-700 mb-4">Troubleshooting</h2>
      
      <div class="issue">
        <p class="font-semibold">Issue: Dev tools aren't visible</p>
        <p>Solution: Make sure you have <span class="code">?dev=true</span> in your URL</p>
      </div>
      
      <div class="issue">
        <p class="font-semibold">Issue: Can't load simulated users</p>
        <p>Solution: Run the simulation script first: <span class="code">npm run dev:sim</span></p>
      </div>
      
      <div class="issue">
        <p class="font-semibold">Issue: Random answers not working</p>
        <p>Solution: Ensure you've selected a module and started a quiz</p>
      </div>
      
      <div class="issue">
        <p class="font-semibold">Issue: Only seeing a subset of questions</p>
        <p>Solution: Check your batch size setting - it limits the number of questions per session</p>
      </div>
    </div>

    <div class="doc-section">
      <h2 class="text-2xl font-semibold text-indigo-700 mb-4">Best Practices</h2>
      
      <ol class="list-decimal ml-5 space-y-2">
        <li>Use simulated users for testing user progress features</li>
        <li>Use random answers for quickly testing quiz completion</li>
        <li>Clear storage between major test scenarios</li>
        <li>Use different batch sizes to test the quiz with varying question counts</li>
      </ol>
    </div>
  </div>
</body>
</html> ```

### ./src/public/flashcards.html

File path: `./src/public/flashcards.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIRE Learning Platform - Flashcards</title>
  <link rel="stylesheet" href="style.css">
  <script src="js/shared-assets.js"></script>
  <style>
    .flashcard {
      perspective: 1000px;
      height: 200px;
      margin-bottom: 20px;
    }
    
    .flashcard-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.6s;
      transform-style: preserve-3d;
      cursor: pointer;
    }
    
    .flashcard.flipped .flashcard-inner {
      transform: rotateY(180deg);
    }
    
    .flashcard-front, .flashcard-back {
      position: absolute;
      width: 100%;
      height: 100%;
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      border-radius: 10px;
    }
    
    .flashcard-front {
      background-color: #f0f9ff;
      border: 1px solid #93c5fd;
      color: #1e40af;
    }
    
    .flashcard-back {
      background-color: #eff6ff;
      border: 1px solid #60a5fa;
      color: #1e3a8a;
      transform: rotateY(180deg);
    }
    
    .module-select {
      padding: 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid #d1d5db;
      width: 100%;
      max-width: 24rem;
      margin-bottom: 1rem;
    }
    
    .controls {
      display: flex;
      justify-content: space-between;
      margin-top: 1rem;
      margin-bottom: 2rem;
    }
    
    .progress-bar {
      height: 0.5rem;
      background-color: #e5e7eb;
      border-radius: 0.25rem;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    
    .progress-bar-fill {
      height: 100%;
      background-color: #4f46e5;
      border-radius: 0.25rem;
      transition: width 0.3s;
    }
    
    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .logo-img {
      max-width: 200px;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-blue-100 to-indigo-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="text-center mb-8">
      <div class="logo-container" id="logo-container">
        <!-- Logo will be inserted by JavaScript -->
      </div>
      <h1 class="text-4xl font-bold text-indigo-800 mb-2">AIRE Learning Platform</h1>
      <p class="text-lg text-gray-600">Master real estate investing with flashcards</p>
      
      <nav class="mt-4">
        <a href="index.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Quiz Game</a>
        <a href="flashcards.html" class="text-indigo-600 hover:text-indigo-800 font-bold mr-4">Flashcards</a>
        <a href="upload.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Upload</a>
        <a href="user-history.html" class="text-indigo-600 hover:text-indigo-800">History</a>
      </nav>
    </header>

    <div class="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
      <div class="mb-6">
        <label for="module-select" class="block text-sm font-medium text-gray-700 mb-2">Select a module:</label>
        <select id="module-select" class="module-select">
          <option value="">Loading modules...</option>
        </select>
      </div>
      
      <div class="controls">
        <button id="prev-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Previous
        </button>
        <div class="text-center">
          <span id="card-counter" class="text-sm font-medium text-gray-500">Card 0 of 0</span>
          <div class="progress-bar">
            <div id="progress-bar-fill" class="progress-bar-fill" style="width: 0%"></div>
          </div>
        </div>
        <button id="next-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
          Next
        </button>
      </div>
      
      <div id="flashcard-container">
        <div class="text-center py-8 text-gray-500">
          <p>Select a module to start</p>
        </div>
      </div>
      
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-500">Click on a card to flip it</p>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Insert the logo using the shared asset
      insertAireLogo('logo-container');
      
      // Elements
      const moduleSelect = document.getElementById('module-select');
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      const cardCounter = document.getElementById('card-counter');
      const progressBarFill = document.getElementById('progress-bar-fill');
      const flashcardContainer = document.getElementById('flashcard-container');
      
      // State
      let modules = [];
      let currentModule = null;
      let currentCardIndex = 0;
      let flashcards = [];
      
      // Load modules index
      fetch('/learning/modules/index.json')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load modules');
          }
          return response.json();
        })
        .then(data => {
          modules = data.modules;
          
          // Populate the module select
          moduleSelect.innerHTML = '';
          moduleSelect.innerHTML = '<option value="">Select a module...</option>';
          
          modules.forEach(module => {
            if (module.flashcardCount > 0) {
              const option = document.createElement('option');
              option.value = module.moduleId;
              option.textContent = `${module.moduleName} (${module.flashcardCount} cards)`;
              moduleSelect.appendChild(option);
            }
          });
        })
        .catch(error => {
          console.error('Error loading modules:', error);
          moduleSelect.innerHTML = '<option value="">Error loading modules</option>';
        });
      
      // Event listener for module selection
      moduleSelect.addEventListener('change', () => {
        const moduleId = moduleSelect.value;
        
        if (!moduleId) {
          resetFlashcards();
          return;
        }
        
        loadModule(moduleId);
      });
      
      // Load a module
      function loadModule(moduleId) {
        fetch(`/learning/modules/${moduleId}.json`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to load module');
            }
            return response.json();
          })
          .then(data => {
            currentModule = data;
            flashcards = data.flashcards || [];
            
            if (flashcards.length === 0) {
              flashcardContainer.innerHTML = '<div class="text-center py-8 text-gray-500"><p>No flashcards available for this module</p></div>';
              prevBtn.disabled = true;
              nextBtn.disabled = true;
              return;
            }
            
            currentCardIndex = 0;
            showFlashcard(currentCardIndex);
            updateControls();
          })
          .catch(error => {
            console.error('Error loading module:', error);
            flashcardContainer.innerHTML = '<div class="text-center py-8 text-red-500"><p>Error loading module</p></div>';
          });
      }
      
      // Show a flashcard
      function showFlashcard(index) {
        const card = flashcards[index];
        
        flashcardContainer.innerHTML = `
          <div class="flashcard" id="current-card">
            <div class="flashcard-inner">
              <div class="flashcard-front">
                <div class="text-center">
                  <p class="text-xl">${card.front}</p>
                  ${card.image ? `<img src="${card.image}" alt="Flashcard" class="mt-4 max-h-24 mx-auto">` : ''}
                </div>
              </div>
              <div class="flashcard-back">
                <div class="text-center">
                  <p class="text-xl">${card.back}</p>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // Add click event to flip the card
        const currentCard = document.getElementById('current-card');
        currentCard.addEventListener('click', () => {
          currentCard.classList.toggle('flipped');
        });
        
        // Update the counter and progress bar
        cardCounter.textContent = `Card ${index + 1} of ${flashcards.length}`;
        const progress = ((index + 1) / flashcards.length) * 100;
        progressBarFill.style.width = `${progress}%`;
      }
      
      // Update controls
      function updateControls() {
        prevBtn.disabled = currentCardIndex === 0;
        nextBtn.disabled = currentCardIndex === flashcards.length - 1;
      }
      
      // Reset flashcards
      function resetFlashcards() {
        currentModule = null;
        flashcards = [];
        currentCardIndex = 0;
        
        flashcardContainer.innerHTML = '<div class="text-center py-8 text-gray-500"><p>Select a module to start</p></div>';
        cardCounter.textContent = 'Card 0 of 0';
        progressBarFill.style.width = '0%';
        
        prevBtn.disabled = true;
        nextBtn.disabled = true;
      }
      
      // Event listeners for navigation
      prevBtn.addEventListener('click', () => {
        if (currentCardIndex > 0) {
          currentCardIndex--;
          showFlashcard(currentCardIndex);
          updateControls();
        }
      });
      
      nextBtn.addEventListener('click', () => {
        if (currentCardIndex < flashcards.length - 1) {
          currentCardIndex++;
          showFlashcard(currentCardIndex);
          updateControls();
        }
      });
      
      // Keyboard navigation
      document.addEventListener('keydown', (event) => {
        if (!currentModule || flashcards.length === 0) return;
        
        if (event.key === 'ArrowLeft' && currentCardIndex > 0) {
          currentCardIndex--;
          showFlashcard(currentCardIndex);
          updateControls();
        } else if (event.key === 'ArrowRight' && currentCardIndex < flashcards.length - 1) {
          currentCardIndex++;
          showFlashcard(currentCardIndex);
          updateControls();
        } else if (event.key === ' ' || event.key === 'Enter') {
          // Flip the current card
          const currentCard = document.getElementById('current-card');
          currentCard.classList.toggle('flipped');
        }
      });
    });
  </script>
</body>
</html> ```

### ./src/public/game.js

File path: `./src/public/game.js`

```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Cache DOM elements
  const startScreen = document.getElementById('start-screen');
  const questionScreen = document.getElementById('question-screen');
  const resultsScreen = document.getElementById('results-screen');
  const reviewScreen = document.getElementById('review-screen');
  
  const startBtn = document.getElementById('start-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const restartBtn = document.getElementById('restart-btn');
  const reviewBtn = document.getElementById('review-btn');
  const backToResultsBtn = document.getElementById('back-to-results-btn');
  const lockAnswersCheckbox = document.getElementById('lock-answers');
  
  const currentQuestionEl = document.getElementById('current-question');
  const totalQuestionsEl = document.getElementById('total-questions');
  const scoreEl = document.getElementById('score');
  const questionTextEl = document.getElementById('question-text');
  const optionsContainerEl = document.getElementById('options-container');
  const feedbackContainerEl = document.getElementById('feedback-container');
  const feedbackTextEl = document.getElementById('feedback-text');
  const explanationTextEl = document.getElementById('explanation-text');
  const finalScoreEl = document.getElementById('final-score');
  const maxScoreEl = document.getElementById('max-score');
  const resultMessageEl = document.getElementById('result-message');
  const reviewContainerEl = document.getElementById('review-container');
  
  // Game state
  let currentQuestionIndex = 0;
  let score = 0;
  let userAnswers = [];
  let questions = [];
  let lockedAnswers = false; // Flag to track if answers are locked after selection
  let answeredQuestions = []; // Track which questions have been answered
  
  // Fetch questions from the module1.json file
  fetch('module1.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load questions');
      }
      return response.json();
    })
    .then(data => {
      questions = data.questions;
      console.log('Questions loaded successfully:', questions.length);
      
      // Enable start button once questions are loaded
      startBtn.disabled = false;
      
      // If there was a loading message, remove it
      const loadingMessage = document.getElementById('loading-message');
      if (loadingMessage) {
        loadingMessage.remove();
      }
    })
    .catch(error => {
      console.error('Error loading questions:', error);
      // Show error message to the user
      const startScreenContent = document.querySelector('#start-screen div');
      startScreenContent.innerHTML = `
        <h2 class="text-2xl font-semibold text-red-700 mb-6">Error Loading Questions</h2>
        <p class="text-gray-600 mb-8">Could not load questions. Please try refreshing the page.</p>
        <p class="text-red-600">${error.message}</p>
      `;
    });
  
  // Initialize the game
  function initGame() {
    // Set the total questions count
    totalQuestionsEl.textContent = questions.length;
    maxScoreEl.textContent = questions.length;
    
    // Get the lock answers setting
    lockedAnswers = lockAnswersCheckbox.checked;
    
    // Reset game state
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = Array(questions.length).fill(null);
    answeredQuestions = Array(questions.length).fill(false);
    
    // Update score display
    scoreEl.textContent = score;
    
    // Show the first question
    showQuestion(currentQuestionIndex);
  }
  
  // Show the question at the given index
  function showQuestion(index) {
    const question = questions[index];
    
    // Update current question number
    currentQuestionIndex = index;
    currentQuestionEl.textContent = index + 1;
    
    // Show the question text
    questionTextEl.textContent = question.question;
    
    // Create and show the options
    optionsContainerEl.innerHTML = '';
    question.options.forEach((option, optionIndex) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'option-item';
      
      // Check if this option was previously selected
      const isSelected = userAnswers[index] === optionIndex || 
                        (userAnswers[index] && typeof userAnswers[index] === 'object' && userAnswers[index].value === optionIndex);
      
      // Determine if this option should be disabled
      const isDisabled = lockedAnswers && answeredQuestions[index];
      
      optionEl.innerHTML = `
        <label class="flex items-center p-3 border rounded-lg ${
          isSelected ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-200 hover:bg-gray-50'
        } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} transition-colors">
          <input type="radio" name="question-${index}" value="${optionIndex}" ${
            isSelected ? 'checked' : ''
          } ${isDisabled ? 'disabled' : ''} class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500">
          <span class="ml-2">${option}</span>
        </label>
      `;
      
      // Add event listener for option selection (if not disabled)
      if (!isDisabled) {
        const radioInput = optionEl.querySelector('input');
        radioInput.addEventListener('change', () => {
          // Update user answers
          userAnswers[index] = optionIndex;
          
          // Mark this question as answered
          answeredQuestions[index] = true;
          
          // Update UI to show selected option
          document.querySelectorAll('.option-item label').forEach(label => {
            label.classList.remove('bg-indigo-100', 'border-indigo-400');
            label.classList.add('bg-white', 'border-gray-200', 'hover:bg-gray-50');
          });
          
          optionEl.querySelector('label').classList.remove('bg-white', 'border-gray-200', 'hover:bg-gray-50');
          optionEl.querySelector('label').classList.add('bg-indigo-100', 'border-indigo-400');
          
          // If answers are locked, disable all radio buttons for this question
          if (lockedAnswers) {
            document.querySelectorAll('.option-item input[type="radio"]').forEach(input => {
              input.disabled = true;
              input.parentElement.classList.add('opacity-60', 'cursor-not-allowed');
            });
          }
          
          // Enable the next button once an option is selected
          nextBtn.disabled = false;
          
          // Show feedback
          showFeedback(index);
        });
      }
      
      optionsContainerEl.appendChild(optionEl);
    });
    
    // Show feedback if user has already answered this question
    if (userAnswers[index] !== null) {
      showFeedback(index);
      nextBtn.disabled = false;
    } else {
      hideFeedback();
      nextBtn.disabled = true;
    }
    
    // Enable/disable navigation buttons based on current index
    prevBtn.disabled = index === 0;
    
    // Hide feedback initially if moving to a new unanswered question
    if (userAnswers[index] === null) {
      hideFeedback();
    }
  }
  
  // Show feedback for the current question
  function showFeedback(index) {
    const question = questions[index];
    const userAnswer = userAnswers[index];
    let userAnswerValue = userAnswer;
    
    // Handle case where userAnswer is an object from scoring
    if (userAnswer && typeof userAnswer === 'object' && 'value' in userAnswer) {
      userAnswerValue = userAnswer.value;
    }
    
    const correctAnswer = question.correctAnswer;
    
    // Show feedback container
    feedbackContainerEl.classList.remove('hidden');
    
    if (userAnswerValue === correctAnswer) {
      // Correct answer
      feedbackContainerEl.classList.remove('bg-red-100');
      feedbackContainerEl.classList.add('bg-green-100');
      feedbackTextEl.classList.remove('text-red-700');
      feedbackTextEl.classList.add('text-green-700');
      feedbackTextEl.textContent = '✓ Correct!';
      
      // Update score if this is the first time answering correctly
      if (!hasBeenScored(index)) {
        score++;
        scoreEl.textContent = score;
        markAsScored(index);
      }
    } else {
      // Incorrect answer
      feedbackContainerEl.classList.remove('bg-green-100');
      feedbackContainerEl.classList.add('bg-red-100');
      feedbackTextEl.classList.remove('text-green-700');
      feedbackTextEl.classList.add('text-red-700');
      feedbackTextEl.textContent = '✗ Incorrect';
    }
    
    // Show explanation
    explanationTextEl.textContent = question.explanation;
  }
  
  // Check if a question has been scored already
  function hasBeenScored(index) {
    return userAnswers[index] && typeof userAnswers[index] === 'object' && userAnswers[index].hasBeenScored;
  }
  
  // Mark a question as scored
  function markAsScored(index) {
    const value = typeof userAnswers[index] === 'object' ? userAnswers[index].value : userAnswers[index];
    userAnswers[index] = { value, hasBeenScored: true };
  }
  
  // Hide feedback
  function hideFeedback() {
    feedbackContainerEl.classList.add('hidden');
  }
  
  // Show the results screen
  function showResults() {
    // Update final score
    finalScoreEl.textContent = score;
    
    // Show appropriate message based on score
    const percentage = (score / questions.length) * 100;
    let message, bgColor, textColor;
    
    if (percentage >= 90) {
      message = "Outstanding! You're a Tauros expert! 🏆";
      bgColor = "bg-green-100";
      textColor = "text-green-800";
    } else if (percentage >= 70) {
      message = "Great job! You know Tauros well! 👍";
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
    } else if (percentage >= 50) {
      message = "Good effort! You're on your way to understanding Tauros. 📚";
      bgColor = "bg-yellow-100";
      textColor = "text-yellow-800";
    } else {
      message = "Keep studying! You'll get better with practice. 💪";
      bgColor = "bg-red-100";
      textColor = "text-red-800";
    }
    
    resultMessageEl.className = `p-4 rounded-lg mb-8 ${bgColor}`;
    resultMessageEl.innerHTML = `<p class="text-lg ${textColor} font-medium">${message}</p>`;
    
    // Hide question screen and show results screen
    questionScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
  }
  
  // Show the review screen
  function showReview() {
    // Clear previous content
    reviewContainerEl.innerHTML = '';
    
    // Add each question and the user's answer
    questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      let userAnswerValue = userAnswer;
      
      // Handle case where userAnswer is an object from scoring
      if (userAnswer && typeof userAnswer === 'object' && 'value' in userAnswer) {
        userAnswerValue = userAnswer.value;
      }
      
      const isCorrect = userAnswerValue === question.correctAnswer;
      const isAnswered = userAnswerValue !== null && userAnswerValue !== undefined;
      
      const reviewItemEl = document.createElement('div');
      reviewItemEl.className = 'review-item border-b pb-6';
      
      reviewItemEl.innerHTML = `
        <h3 class="text-lg font-medium text-gray-800 mb-2">
          <span class="inline-block w-7 h-7 text-center rounded-full mr-2 ${
            !isAnswered ? 'bg-gray-100 text-gray-700' : (isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
          }">${!isAnswered ? '?' : (isCorrect ? '✓' : '✗')}</span>
          Question ${index + 1}
        </h3>
        <p class="mb-3">${question.question}</p>
        <div class="mb-3">
          <p class="font-medium text-sm text-gray-500 mb-1">Your answer:</p>
          <p class="${!isAnswered ? 'text-gray-500 italic' : (isCorrect ? 'text-green-600' : 'text-red-600')}">
            ${isAnswered ? question.options[userAnswerValue] : 'Not answered'}
          </p>
        </div>
        ${
          !isCorrect
            ? `
            <div class="mb-3">
              <p class="font-medium text-sm text-gray-500 mb-1">Correct answer:</p>
              <p class="text-green-600">${question.options[question.correctAnswer]}</p>
            </div>
            `
            : ''
        }
        <div class="mt-2 text-sm text-gray-600">
          <p class="font-medium text-gray-500 mb-1">Explanation:</p>
          <p>${question.explanation}</p>
        </div>
      `;
      
      reviewContainerEl.appendChild(reviewItemEl);
    });
    
    // Hide results screen and show review screen
    resultsScreen.classList.add('hidden');
    reviewScreen.classList.remove('hidden');
  }
  
  // Event listeners
  startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    questionScreen.classList.remove('hidden');
    initGame();
  });
  
  prevBtn.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      showQuestion(currentQuestionIndex - 1);
    }
  });
  
  nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Go to next question
      showQuestion(currentQuestionIndex + 1);
    } else {
      // End of quiz, show results
      showResults();
    }
  });
  
  restartBtn.addEventListener('click', () => {
    // Reset game and go back to first question
    resultsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
  });
  
  reviewBtn.addEventListener('click', showReview);
  
  backToResultsBtn.addEventListener('click', () => {
    reviewScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
  });
  
  // Disable start button until questions are loaded
  startBtn.disabled = true;
}); ```

### ./src/public/index.html

File path: `./src/public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIRE Learning Platform</title>
  <link rel="stylesheet" href="style.css">
  <script src="js/shared-assets.js"></script>
  <style>
    #dev-tools-bottom {
      background-color: #1e40af; /* bg-blue-800 */
      color: white;
      font-weight: bold;
      padding: 10px;
      display: flex;
      gap: 10px;
    }
    
    #dev-tools-bottom button {
      background-color: #3b82f6; /* bg-blue-500 */
      color: white;
      font-weight: bold;
      padding: 5px 10px;
      border-radius: 5px;
      border: none;
    }
    
    #dev-tools-bottom button:hover {
      background-color: #2563eb; /* bg-blue-600 */
    }

    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .logo-img {
      max-width: 200px;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-blue-100 to-indigo-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="text-center mb-8">
      <div class="logo-container" id="logo-container">
        <!-- Logo will be inserted by JavaScript -->
      </div>
      <h1 class="text-4xl font-bold text-indigo-800 mb-2">AIRE Learning Platform</h1>
      <p class="text-lg text-gray-600">Master real estate investing with interactive tools</p>
      
      <nav class="mt-4">
        <a href="index.html" class="text-indigo-600 hover:text-indigo-800 font-bold mr-4">Quiz Game</a>
        <a href="flashcards.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Flashcards</a>
        <a href="upload.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Upload</a>
        <a href="user-history.html?dev=true" class="text-indigo-600 hover:text-indigo-800">History</a>
      </nav>
    </header>

    <div class="game-container bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
      <!-- Start Screen -->
      <div id="start-screen" class="text-center py-10">
        <h2 class="text-2xl font-semibold text-indigo-700 mb-6">Ready to test your knowledge?</h2>
        <p class="text-gray-600 mb-8">Select a module and test your understanding with interactive quizzes.</p>
        
        <!-- Module Selection -->
        <div class="mb-8">
          <label for="module-select" class="block text-sm font-medium text-gray-700 mb-2">Select a module:</label>
          <select id="module-select" class="block w-full p-2 border border-gray-300 rounded-md mb-4">
            <option value="">Loading modules...</option>
          </select>
        </div>
        
        <!-- Game Settings -->
        <div class="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-medium text-gray-700 mb-3">Game Settings</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-center space-x-2">
              <input type="checkbox" id="lock-answers" class="w-4 h-4">
              <label for="lock-answers" class="text-gray-700">Lock answers after selection (no changes allowed)</label>
            </div>
            
            <div class="flex flex-col items-center justify-center mt-2">
              <label for="batch-size" class="text-gray-700 mb-1">Number of questions per session:</label>
              <select id="batch-size" class="block w-40 p-2 border border-gray-300 rounded-md">
                <option value="5">5 questions</option>
                <option value="10" selected>10 questions</option>
                <option value="20">20 questions</option>
                <option value="50">50 questions</option>
                <option value="100">100 questions</option>
              </select>
            </div>
            
            <div class="flex flex-col items-center justify-center mt-2">
              <label for="difficulty" class="text-gray-700 mb-1">Difficulty level (if available):</label>
              <select id="difficulty" class="block w-40 p-2 border border-gray-300 rounded-md">
                <option value="">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>
        </div>
        
        <div id="user-stats" class="mb-8 p-4 bg-indigo-50 rounded-lg">
          <h3 class="text-lg font-medium text-indigo-700 mb-2">Your Progress</h3>
          <div class="grid grid-cols-2 gap-2 text-center">
            <div class="bg-white p-2 rounded shadow-sm">
              <p class="text-xs text-gray-500">Total Answered</p>
              <p id="stat-total-answered" class="text-lg font-semibold text-indigo-600">0</p>
            </div>
            <div class="bg-white p-2 rounded shadow-sm">
              <p class="text-xs text-gray-500">Accuracy</p>
              <p id="stat-accuracy" class="text-lg font-semibold text-indigo-600">0%</p>
            </div>
            <div class="bg-white p-2 rounded shadow-sm">
              <p class="text-xs text-gray-500">Completed Modules</p>
              <p id="stat-completed-modules" class="text-lg font-semibold text-indigo-600">0</p>
            </div>
            <div class="bg-white p-2 rounded shadow-sm">
              <p class="text-xs text-gray-500">Last Session</p>
              <p id="stat-last-session" class="text-lg font-semibold text-indigo-600">-</p>
            </div>
          </div>
        </div>
        
        <div class="flex justify-center gap-4">
          <button id="start-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300" disabled>
            Start Quiz
          </button>
        </div>
        <p id="loading-message" class="text-sm text-gray-500 mt-4">Loading modules...</p>
      </div>

      <!-- Question Screen -->
      <div id="question-screen" class="hidden">
        <div class="flex justify-between items-center mb-6">
          <div class="text-sm font-medium text-gray-500">
            Question <span id="current-question">1</span> of <span id="total-questions">10</span>
          </div>
          <div class="text-sm font-medium text-indigo-600">
            Score: <span id="score">0</span>
          </div>
        </div>

        <div class="question-container mb-6">
          <h2 id="question-text" class="text-xl font-semibold text-gray-800 mb-4">Question goes here?</h2>
          <div id="options-container" class="space-y-3">
            <!-- Options will be inserted here by JavaScript -->
          </div>
        </div>

        <div class="hidden mt-6 p-4 rounded-lg" id="feedback-container">
          <p id="feedback-text" class="text-lg"></p>
          <p id="explanation-text" class="text-gray-600 mt-2"></p>
        </div>

        <div class="flex justify-between mt-8">
          <button id="prev-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            Previous
          </button>
          <button id="next-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
            Next
          </button>
        </div>
      </div>

      <!-- Results Screen -->
      <div id="results-screen" class="hidden text-center py-10">
        <h2 class="text-2xl font-semibold text-indigo-700 mb-4">Quiz Complete!</h2>
        <p class="text-lg mb-6">Your final score: <span id="final-score" class="font-bold text-indigo-600">0</span> out of <span id="max-score">10</span></p>
        
        <div id="result-message" class="p-4 rounded-lg mb-8">
          <!-- Result message will be inserted here -->
        </div>

        <div class="flex justify-center gap-4">
          <button id="restart-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300">
            Restart Quiz
          </button>
          <button id="review-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition duration-300">
            Review Answers
          </button>
        </div>
      </div>

      <!-- Review Screen -->
      <div id="review-screen" class="hidden">
        <h2 class="text-2xl font-semibold text-indigo-700 mb-6 text-center">Review Your Answers</h2>
        <div id="review-container" class="space-y-8">
          <!-- Review items will be inserted here -->
        </div>
        <div class="flex justify-center mt-8">
          <button id="back-to-results-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300">
            Back to Results
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Insert the logo using the shared asset
      insertAireLogo('logo-container');
      
      // Cache DOM elements
      const moduleSelect = document.getElementById('module-select');
      const startScreen = document.getElementById('start-screen');
      const questionScreen = document.getElementById('question-screen');
      const resultsScreen = document.getElementById('results-screen');
      const reviewScreen = document.getElementById('review-screen');
      
      const startBtn = document.getElementById('start-btn');
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      const restartBtn = document.getElementById('restart-btn');
      const reviewBtn = document.getElementById('review-btn');
      const backToResultsBtn = document.getElementById('back-to-results-btn');
      const lockAnswersCheckbox = document.getElementById('lock-answers');
      
      const currentQuestionEl = document.getElementById('current-question');
      const totalQuestionsEl = document.getElementById('total-questions');
      const scoreEl = document.getElementById('score');
      const questionTextEl = document.getElementById('question-text');
      const optionsContainerEl = document.getElementById('options-container');
      const feedbackContainerEl = document.getElementById('feedback-container');
      const feedbackTextEl = document.getElementById('feedback-text');
      const explanationTextEl = document.getElementById('explanation-text');
      const finalScoreEl = document.getElementById('final-score');
      const maxScoreEl = document.getElementById('max-score');
      const resultMessageEl = document.getElementById('result-message');
      const reviewContainerEl = document.getElementById('review-container');
      const loadingMessageEl = document.getElementById('loading-message');
      
      // Game state
      let currentQuestionIndex = 0;
      let score = 0;
      let userAnswers = [];
      let questions = [];
      let originalQuestions = []; // Store the original set of questions
      let lockedAnswers = false; // Flag to track if answers are locked after selection
      let answeredQuestions = []; // Track which questions have been answered
      let currentModule = null;
      
      // Check for development mode
      const isDevMode = new URLSearchParams(window.location.search).has('dev');
      if (isDevMode) {
        // Add dev mode tools to the UI
        const devToolsContainer = document.createElement('div');
        devToolsContainer.className = 'dev-tools fixed top-2 right-2 bg-blue-100 border border-blue-400 rounded p-2 z-50 text-xs';
        devToolsContainer.innerHTML = `
          <div class="font-bold text-blue-800 mb-1">🛠️ Dev Tools</div>
          <button id="dev-random-answers" class="bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-1 px-2 rounded text-xs mb-1 w-full">
            Answer Randomly
          </button>
          <button id="dev-load-user" class="bg-blue-700 hover:bg-blue-800 text-white font-bold py-1 px-2 rounded text-xs mb-1 w-full">
            Load Simulated User
          </button>
          <button id="dev-clear-storage" class="bg-red-700 hover:bg-red-800 text-white font-bold py-1 px-2 rounded text-xs w-full">
            Clear Storage
          </button>
          <div id="dev-user-selector" class="hidden mt-2 pt-2 border-t border-blue-400">
            <div class="font-bold text-blue-800 mb-1">Select User:</div>
            <select id="dev-user-list" class="w-full p-1 text-xs mb-1 border border-blue-400 rounded"></select>
            <button id="dev-load-selected-user" class="bg-green-700 hover:bg-green-800 text-white font-bold py-1 px-2 rounded text-xs w-full">
              Load Selected User
            </button>
          </div>
          <div class="mt-2 pt-2 border-t border-blue-400">
            <a href="dev-tools-help.html" target="_blank" class="bg-green-700 hover:bg-green-800 text-white font-bold py-1 px-2 rounded text-xs w-full inline-block text-center">
              Help Documentation
            </a>
          </div>
        `;
        document.body.appendChild(devToolsContainer);
        
        // Add event listeners for dev tools
        document.getElementById('dev-random-answers').addEventListener('click', () => {
          // Get current session questions
          if (!questions || questions.length === 0) {
            alert('No questions loaded. Select a module first.');
            return;
          }
          
          // Answer questions randomly
          questions.forEach((question, index) => {
            if (userAnswers[index] === null || userAnswers[index] === undefined) {
              const randomAnswer = Math.floor(Math.random() * question.options.length);
              userAnswers[index] = randomAnswer;
              answeredQuestions[index] = true;
              
              if (randomAnswer === question.correctAnswer) {
                if (!hasBeenScored(index)) {
                  score++;
                  markAsScored(index);
                }
              }
            }
          });
          
          // Update UI
          scoreEl.textContent = score;
          showQuestion(currentQuestionIndex);
          alert(`Randomly answered all questions. Score: ${score}/${questions.length}`);
        });
        
        // Load simulated user functionality
        document.getElementById('dev-load-user').addEventListener('click', async () => {
          const userSelectorElem = document.getElementById('dev-user-selector');
          const userListElem = document.getElementById('dev-user-list');
          
          // Toggle visibility
          if (userSelectorElem.classList.contains('hidden')) {
            userSelectorElem.classList.remove('hidden');
            
            // Fetch available users
            try {
              const response = await fetch('/api/dev/users?dev=true');
              const data = await response.json();
              
              // Clear and populate user list
              userListElem.innerHTML = '';
              
              if (data.users && data.users.length > 0) {
                data.users.forEach(user => {
                  const option = document.createElement('option');
                  option.value = user.userId;
                  option.textContent = `${user.userId.substring(0, 10)}... (${user.totalAnswered} answers)`;
                  option.title = `Created: ${new Date(user.createdAt).toLocaleString()}\nAnswers: ${user.totalAnswered} (${user.totalCorrect} correct)\nModules: ${user.moduleCount}`;
                  userListElem.appendChild(option);
                });
              } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No simulated users found';
                option.disabled = true;
                userListElem.appendChild(option);
              }
            } catch (error) {
              console.error('Error fetching simulated users:', error);
              alert('Failed to load simulated users. Check console for details.');
            }
          } else {
            userSelectorElem.classList.add('hidden');
          }
        });
        
        // Load selected user
        document.getElementById('dev-load-selected-user').addEventListener('click', () => {
          const userListElem = document.getElementById('dev-user-list');
          const selectedUserId = userListElem.value;
          
          if (!selectedUserId) {
            alert('Please select a valid user');
            return;
          }
          
          // Set the selected user ID in localStorage
          localStorage.setItem('currentUserId', selectedUserId);
          alert(`User ${selectedUserId} loaded. Reloading page...`);
          window.location.reload();
        });
        
        document.getElementById('dev-clear-storage').addEventListener('click', () => {
          if (confirm('This will clear all local storage data. Continue?')) {
            localStorage.clear();
            alert('Storage cleared. Reloading page...');
            window.location.reload();
          }
        });
      }
      
      // Load modules index
      fetch('/learning/modules/index.json')
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to load modules');
          }
          return response.json();
        })
        .then(data => {
          // Populate module select dropdown
          moduleSelect.innerHTML = '';
          moduleSelect.innerHTML = '<option value="">Select a module...</option>';
          
          data.modules.forEach(module => {
            if (module.questionCount > 0) {
              const option = document.createElement('option');
              option.value = module.moduleId;
              option.textContent = `${module.moduleName} (${module.questionCount} questions)`;
              moduleSelect.appendChild(option);
            }
          });
          
          // Enable start button once modules are loaded
          if (data.modules.length > 0) {
            loadingMessageEl.textContent = 'Select a module to begin';
            moduleSelect.addEventListener('change', handleModuleChange);
          } else {
            loadingMessageEl.textContent = 'No modules available';
          }
        })
        .catch(error => {
          console.error('Error loading modules:', error);
          loadingMessageEl.textContent = 'Error loading modules. Please try refreshing the page.';
        });
      
      // Handle module selection change
      function handleModuleChange() {
        const moduleId = moduleSelect.value;
        
        if (!moduleId) {
          startBtn.disabled = true;
          return;
        }
        
        // Load selected module
        loadingMessageEl.textContent = 'Loading module...';
        
        fetch(`/learning/modules/${moduleId}.json`)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to load module');
            }
            return response.json();
          })
          .then(data => {
            currentModule = data;
            originalQuestions = data.questions || [];
            questions = [...originalQuestions]; // Make a copy to work with
            
            if (originalQuestions.length === 0) {
              loadingMessageEl.textContent = 'This module has no questions.';
              startBtn.disabled = true;
            } else {
              loadingMessageEl.textContent = `Ready to start: ${originalQuestions.length} questions available`;
              startBtn.disabled = false;
            }
          })
          .catch(error => {
            console.error('Error loading module:', error);
            loadingMessageEl.textContent = 'Error loading module. Please try another one.';
            startBtn.disabled = true;
          });
      }
      
      // Initialize the game
      function initGame() {
        // Get the batch size setting
        const batchSizeSelect = document.getElementById('batch-size');
        const batchSize = parseInt(batchSizeSelect.value, 10);
        
        // Get a random subset of questions based on batch size
        if (batchSize && batchSize < originalQuestions.length) {
          // Create a copy of the original questions array and shuffle it
          const shuffledQuestions = [...originalQuestions].sort(() => Math.random() - 0.5);
          // Take only the first 'batchSize' number of questions
          questions = shuffledQuestions.slice(0, batchSize);
        } else {
          // If batch size is greater than available questions, use all questions
          questions = [...originalQuestions];
        }
        
        // Set the total questions count
        totalQuestionsEl.textContent = questions.length;
        maxScoreEl.textContent = questions.length;
        
        // Get the lock answers setting
        lockedAnswers = lockAnswersCheckbox.checked;
        
        // Reset game state
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = Array(questions.length).fill(null);
        answeredQuestions = Array(questions.length).fill(false);
        
        // Update score display
        scoreEl.textContent = score;
        
        // Show the first question
        showQuestion(currentQuestionIndex);
      }
      
      // Show the question at the given index
      function showQuestion(index) {
        const question = questions[index];
        
        // Update current question number
        currentQuestionIndex = index;
        currentQuestionEl.textContent = index + 1;
        
        // Show the question text
        questionTextEl.textContent = question.question;
        
        // Create and show the options
        optionsContainerEl.innerHTML = '';
        question.options.forEach((option, optionIndex) => {
          const optionEl = document.createElement('div');
          optionEl.className = 'option-item';
          
          // Check if this option was previously selected
          const isSelected = userAnswers[index] === optionIndex || 
                            (userAnswers[index] && typeof userAnswers[index] === 'object' && userAnswers[index].value === optionIndex);
          
          // Determine if this option should be disabled
          const isDisabled = lockedAnswers && answeredQuestions[index];
          
          optionEl.innerHTML = `
            <label class="flex items-center p-3 border rounded-lg ${
              isSelected ? 'bg-indigo-100 border-indigo-400' : 'bg-white border-gray-200 hover:bg-gray-50'
            } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} transition-colors">
              <input type="radio" name="question-${index}" value="${optionIndex}" ${
                isSelected ? 'checked' : ''
              } ${isDisabled ? 'disabled' : ''} class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500">
              <span class="ml-2">${option}</span>
            </label>
          `;
          
          // Add event listener for option selection (if not disabled)
          if (!isDisabled) {
            const radioInput = optionEl.querySelector('input');
            radioInput.addEventListener('change', () => {
              // Update user answers
              userAnswers[index] = optionIndex;
              
              // Mark this question as answered
              answeredQuestions[index] = true;
              
              // Update UI to show selected option
              document.querySelectorAll('.option-item label').forEach(label => {
                label.classList.remove('bg-indigo-100', 'border-indigo-400');
                label.classList.add('bg-white', 'border-gray-200', 'hover:bg-gray-50');
              });
              
              optionEl.querySelector('label').classList.remove('bg-white', 'border-gray-200', 'hover:bg-gray-50');
              optionEl.querySelector('label').classList.add('bg-indigo-100', 'border-indigo-400');
              
              // If answers are locked, disable all radio buttons for this question
              if (lockedAnswers) {
                document.querySelectorAll('.option-item input[type="radio"]').forEach(input => {
                  input.disabled = true;
                  input.parentElement.classList.add('opacity-60', 'cursor-not-allowed');
                });
              }
              
              // Enable the next button once an option is selected
              nextBtn.disabled = false;
              
              // Show feedback
              showFeedback(index);
            });
          }
          
          optionsContainerEl.appendChild(optionEl);
        });
        
        // Show feedback if user has already answered this question
        if (userAnswers[index] !== null) {
          showFeedback(index);
          nextBtn.disabled = false;
        } else {
          hideFeedback();
          nextBtn.disabled = true;
        }
        
        // Enable/disable navigation buttons based on current index
        prevBtn.disabled = index === 0;
        
        // Hide feedback initially if moving to a new unanswered question
        if (userAnswers[index] === null) {
          hideFeedback();
        }
      }
      
      // Show feedback for the current question
      function showFeedback(index) {
        const question = questions[index];
        const userAnswer = userAnswers[index];
        let userAnswerValue = userAnswer;
        
        // Handle case where userAnswer is an object from scoring
        if (userAnswer && typeof userAnswer === 'object' && 'value' in userAnswer) {
          userAnswerValue = userAnswer.value;
        }
        
        const correctAnswer = question.correctAnswer;
        
        // Show feedback container
        feedbackContainerEl.classList.remove('hidden');
        
        if (userAnswerValue === correctAnswer) {
          // Correct answer
          feedbackContainerEl.classList.remove('bg-red-100');
          feedbackContainerEl.classList.add('bg-green-100');
          feedbackTextEl.classList.remove('text-red-700');
          feedbackTextEl.classList.add('text-green-700');
          feedbackTextEl.textContent = '✓ Correct!';
          
          // Update score if this is the first time answering correctly
          if (!hasBeenScored(index)) {
            score++;
            scoreEl.textContent = score;
            markAsScored(index);
          }
        } else {
          // Incorrect answer
          feedbackContainerEl.classList.remove('bg-green-100');
          feedbackContainerEl.classList.add('bg-red-100');
          feedbackTextEl.classList.remove('text-green-700');
          feedbackTextEl.classList.add('text-red-700');
          feedbackTextEl.textContent = '✗ Incorrect';
        }
        
        // Show explanation
        explanationTextEl.textContent = question.explanation;
      }
      
      // Check if a question has been scored already
      function hasBeenScored(index) {
        return userAnswers[index] && typeof userAnswers[index] === 'object' && userAnswers[index].hasBeenScored;
      }
      
      // Mark a question as scored
      function markAsScored(index) {
        const value = typeof userAnswers[index] === 'object' ? userAnswers[index].value : userAnswers[index];
        userAnswers[index] = { value, hasBeenScored: true };
      }
      
      // Hide feedback
      function hideFeedback() {
        feedbackContainerEl.classList.add('hidden');
      }
      
      // Show the results screen
      function showResults() {
        // Update final score
        finalScoreEl.textContent = score;
        
        // Show appropriate message based on score
        const percentage = (score / questions.length) * 100;
        let message, bgColor, textColor;
        
        if (percentage >= 90) {
          message = "Outstanding! You're an expert! 🏆";
          bgColor = "bg-green-100";
          textColor = "text-green-800";
        } else if (percentage >= 70) {
          message = "Great job! You know this well! 👍";
          bgColor = "bg-blue-100";
          textColor = "text-blue-800";
        } else if (percentage >= 50) {
          message = "Good effort! You're on your way to understanding this material. 📚";
          bgColor = "bg-yellow-100";
          textColor = "text-yellow-800";
        } else {
          message = "Keep studying! You'll get better with practice. 💪";
          bgColor = "bg-red-100";
          textColor = "text-red-800";
        }
        
        resultMessageEl.className = `p-4 rounded-lg mb-8 ${bgColor}`;
        resultMessageEl.innerHTML = `<p class="text-lg ${textColor} font-medium">${message}</p>`;
        
        // Hide question screen and show results screen
        questionScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
      }
      
      // Show the review screen
      function showReview() {
        // Clear previous content
        reviewContainerEl.innerHTML = '';
        
        // Add each question and the user's answer
        questions.forEach((question, index) => {
          const userAnswer = userAnswers[index];
          let userAnswerValue = userAnswer;
          
          // Handle case where userAnswer is an object from scoring
          if (userAnswer && typeof userAnswer === 'object' && 'value' in userAnswer) {
            userAnswerValue = userAnswer.value;
          }
          
          const isCorrect = userAnswerValue === question.correctAnswer;
          const isAnswered = userAnswerValue !== null && userAnswerValue !== undefined;
          
          const reviewItemEl = document.createElement('div');
          reviewItemEl.className = 'review-item border-b pb-6';
          
          reviewItemEl.innerHTML = `
            <h3 class="text-lg font-medium text-gray-800 mb-2">
              <span class="inline-block w-7 h-7 text-center rounded-full mr-2 ${
                !isAnswered ? 'bg-gray-100 text-gray-700' : (isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')
              }">${!isAnswered ? '?' : (isCorrect ? '✓' : '✗')}</span>
              Question ${index + 1}
            </h3>
            <p class="mb-3">${question.question}</p>
            <div class="mb-3">
              <p class="font-medium text-sm text-gray-500 mb-1">Your answer:</p>
              <p class="${!isAnswered ? 'text-gray-500 italic' : (isCorrect ? 'text-green-600' : 'text-red-600')}">
                ${isAnswered ? question.options[userAnswerValue] : 'Not answered'}
              </p>
            </div>
            ${
              !isCorrect
                ? `
                <div class="mb-3">
                  <p class="font-medium text-sm text-gray-500 mb-1">Correct answer:</p>
                  <p class="text-green-600">${question.options[question.correctAnswer]}</p>
                </div>
                `
                : ''
            }
            <div class="mt-2 text-sm text-gray-600">
              <p class="font-medium text-gray-500 mb-1">Explanation:</p>
              <p>${question.explanation}</p>
            </div>
          `;
          
          reviewContainerEl.appendChild(reviewItemEl);
        });
        
        // Hide results screen and show review screen
        resultsScreen.classList.add('hidden');
        reviewScreen.classList.remove('hidden');
      }
      
      // Event listeners
      startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        questionScreen.classList.remove('hidden');
        initGame();
      });
      
      prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
          showQuestion(currentQuestionIndex - 1);
        }
      });
      
      nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
          // Go to next question
          showQuestion(currentQuestionIndex + 1);
        } else {
          // End of quiz, show results
          showResults();
        }
      });
      
      restartBtn.addEventListener('click', () => {
        // Reset game and go back to start screen
        resultsScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        
        // Restore the original questions from the module
        questions = originalQuestions;
      });
      
      reviewBtn.addEventListener('click', showReview);
      
      backToResultsBtn.addEventListener('click', () => {
        reviewScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
      });
    });
  </script>
  
  <!-- Dev Tools Panel for bottom of screen -->
  <div id="dev-tools-bottom" class="fixed bottom-0 left-0 right-0 bg-blue-700 text-white p-2 flex gap-3 justify-start items-center z-50 font-bold">
    <span>🛠️ Dev Tools</span>
    <button id="dev-answer-randomly" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-1 px-3 rounded">Answer Randomly</button>
    <button id="dev-load-user" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded">Load Simulated User</button>
    <button id="dev-clear-storage" class="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded">Clear Storage</button>
    <a href="user-history.html?dev=true" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded">User History</a>
    <a href="dev-tools-help.html" target="_blank" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded ml-auto">Help</a>
  </div>

  <script>
    // Connect bottom dev tools to functionality
    document.addEventListener('DOMContentLoaded', () => {
      // Only show bottom dev tools in dev mode
      const isDevMode = new URLSearchParams(window.location.search).has('dev');
      const devToolsBottom = document.getElementById('dev-tools-bottom');
      
      if (!isDevMode && devToolsBottom) {
        devToolsBottom.style.display = 'none';
      }
      
      // Connect buttons to existing functionality
      const devAnswerRandomly = document.getElementById('dev-answer-randomly');
      const devLoadUser = document.getElementById('dev-load-user');
      const devClearStorage = document.getElementById('dev-clear-storage');
      
      if (devAnswerRandomly) {
        devAnswerRandomly.addEventListener('click', () => {
          // Get current session questions
          if (!questions || questions.length === 0) {
            alert('No questions loaded. Select a module first.');
            return;
          }
          
          // Answer questions randomly
          questions.forEach((question, index) => {
            if (userAnswers[index] === null || userAnswers[index] === undefined) {
              const randomAnswer = Math.floor(Math.random() * question.options.length);
              userAnswers[index] = randomAnswer;
              answeredQuestions[index] = true;
              
              if (randomAnswer === question.correctAnswer) {
                if (!hasBeenScored(index)) {
                  score++;
                  markAsScored(index);
                }
              }
            }
          });
          
          // Update UI
          scoreEl.textContent = score;
          showQuestion(currentQuestionIndex);
          alert(`Randomly answered all questions. Score: ${score}/${questions.length}`);
        });
      }
      
      if (devLoadUser) {
        devLoadUser.addEventListener('click', () => {
          // Trigger the same action as the top-right dev tools button
          document.getElementById('dev-load-user')?.click();
        });
      }
      
      if (devClearStorage) {
        devClearStorage.addEventListener('click', () => {
          // Trigger the same action as the top-right dev tools button
          document.getElementById('dev-clear-storage')?.click();
        });
      }
    });
  </script>
</body>
</html> ```

### ./src/public/js/shared-assets.js

File path: `./src/public/js/shared-assets.js`

```javascript
/**
 * Shared Assets - Contains assets that can be reused across the application
 */

// AIRE Logo path
const aireLogoPath = '/images/aire-logo.png.jpg';

// Function to insert the logo into an element
function insertAireLogo(elementId, width = 200, height = 60) {
  const element = document.getElementById(elementId);
  if (element) {
    // Create an image element
    const img = document.createElement('img');
    img.src = aireLogoPath;
    img.alt = 'AIRE Logo';
    img.className = 'logo-img';
    
    // Set width and height if provided
    if (width) img.style.width = `${width}px`;
    if (height) img.style.height = 'auto';
    
    // Clear and append
    element.innerHTML = '';
    element.appendChild(img);
  }
}

// Base64 encoded version is no longer used since we're using a JPG file
// This is kept as a placeholder for backward compatibility
const aireLogoBase64 = aireLogoPath;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    aireLogoPath,
    aireLogoBase64,
    insertAireLogo
  };
} ```

### ./src/public/questions.js

File path: `./src/public/questions.js`

```javascript
const questions = [
  {
    id: 1,
    question: "What is the main goal of the Tauros project?",
    options: [
      "To test if the model can answer trivia questions",
      "To train a vision-language model to generate or edit UI code using screenshots and natural language instructions",
      "To design mobile apps from scratch",
      "To create animations and transitions using AI"
    ],
    correctAnswer: 1,
    explanation: "The Tauros project is focused on training a model that can understand screenshots and natural language prompts to generate or edit user interface code, not just answer trivia, design apps from scratch, or create animations."
  },
  {
    id: 2,
    question: "Which of the following is an acceptable prompt format in Tauros?",
    options: [
      "Only text that says 'Make this look good'",
      "Depending on the type, an image and text that says 'write code using Python'",
      "A screenshot and a brief description of any changes that you would like the model to make",
      "A single image with no explanation. The model will replicate the webpage."
    ],
    correctAnswer: 2,
    explanation: "The only acceptable prompt format in Tauros is to provide a screenshot and a brief description of the changes you want. Prompts must be clear, specific, and based on English-language websites."
  },
  {
    id: 3,
    question: "What is the purpose of the rewritten response in a Tauros task?",
    options: [
      "To make small cosmetic changes to the model's reasoning",
      "To improve or correct the model's output so it fully matches the prompt and image",
      "To translate the code into another programming language",
      "To test if the model can guess the correct layout"
    ],
    correctAnswer: 1,
    explanation: "The rewritten response is meant to fix or upgrade the model's output so it aligns perfectly with the prompt and the expected UI, not just make minor tweaks or translations."
  },
  {
    id: 4,
    question: "How many simple visual changes should be requested in a prompt?",
    options: [
      "3",
      "4",
      "5",
      "6"
    ],
    correctAnswer: 2,
    explanation: "According to the prompt guidelines, you should request 5 simple visual changes in your prompt."
  },
  {
    id: 5,
    question: "How many functionality changes should be requested in a prompt?",
    options: [
      "1",
      "2",
      "3",
      "4"
    ],
    correctAnswer: 1,
    explanation: "According to the prompt guidelines, you should request 2 functionality changes in your prompt."
  },
  {
    id: 6,
    question: "How many dynamic/interactive state changes should be requested in a prompt?",
    options: [
      "1",
      "2",
      "3",
      "4"
    ],
    correctAnswer: 1,
    explanation: "According to the prompt guidelines, you should request 2 dynamic/interactive state changes in your prompt."
  },
  {
    id: 7,
    question: "Which of the following is NOT an approved category for prompts?",
    options: [
      "Travel",
      "Finance",
      "Blockchain",
      "Health"
    ],
    correctAnswer: 2,
    explanation: "Blockchain is not listed as an approved category in the MODULE1 materials. The approved categories include Travel, Finance, Health, Education, and many others."
  },
  {
    id: 8,
    question: "What is a characteristic of a strong prompt?",
    options: [
      "Using non-English websites as references",
      "Being too easy for the model to complete",
      "Being unique and challenging",
      "Requesting only visual changes"
    ],
    correctAnswer: 2,
    explanation: "Strong prompts are unique, challenging, and fit the assigned category while using screenshots from modern, English websites."
  },
  {
    id: 9,
    question: "What is a simple visual change?",
    options: [
      "Adding a new section to the website",
      "Implementing a hover effect",
      "Changing the background color",
      "Adding a cart component with state"
    ],
    correctAnswer: 2,
    explanation: "Simple visual changes are small, surface-level tweaks like font changes, background color, and simple text edits."
  },
  {
    id: 10,
    question: "What is a functional change?",
    options: [
      "Changing the font color",
      "Adding a new button or form",
      "Simple text edits",
      "Changing background images"
    ],
    correctAnswer: 1,
    explanation: "Functional changes affect how the site works, such as adding buttons, forms, new sections, and hover effects."
  }
];

// Export the questions array
if (typeof module !== 'undefined' && module.exports) {
  module.exports = questions;
} ```

### ./src/public/style.css

File path: `./src/public/style.css`

```css
/*! tailwindcss v4.1.5 | MIT License | https://tailwindcss.com */
@layer properties;
.visible {
  visibility: visible;
}
.fixed {
  position: fixed;
}
.relative {
  position: relative;
}
.static {
  position: static;
}
.z-50 {
  z-index: 50;
}
.container {
  width: 100%;
}
.mx-auto {
  margin-inline: auto;
}
.-mb-px {
  margin-bottom: -1px;
}
.ml-auto {
  margin-left: auto;
}
.block {
  display: block;
}
.contents {
  display: contents;
}
.flex {
  display: flex;
}
.grid {
  display: grid;
}
.hidden {
  display: none;
}
.inline-block {
  display: inline-block;
}
.inline-flex {
  display: inline-flex;
}
.table {
  display: table;
}
.min-h-screen {
  min-height: 100vh;
}
.w-full {
  width: 100%;
}
.max-w-\[100px\] {
  max-width: 100px;
}
.min-w-full {
  min-width: 100%;
}
.flex-1 {
  flex: 1;
}
.transform {
  transform: var(--tw-rotate-x,) var(--tw-rotate-y,) var(--tw-rotate-z,) var(--tw-skew-x,) var(--tw-skew-y,);
}
.cursor-not-allowed {
  cursor: not-allowed;
}
.cursor-pointer {
  cursor: pointer;
}
.list-inside {
  list-style-position: inside;
}
.list-decimal {
  list-style-type: decimal;
}
.list-disc {
  list-style-type: disc;
}
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.flex-col {
  flex-direction: column;
}
.flex-wrap {
  flex-wrap: wrap;
}
.items-center {
  align-items: center;
}
.items-start {
  align-items: flex-start;
}
.justify-between {
  justify-content: space-between;
}
.justify-center {
  justify-content: center;
}
.justify-end {
  justify-content: flex-end;
}
.justify-start {
  justify-content: flex-start;
}
.divide-y {
  :where(& > :not(:last-child)) {
    --tw-divide-y-reverse: 0;
    border-bottom-style: var(--tw-border-style);
    border-top-style: var(--tw-border-style);
    border-top-width: calc(1px * var(--tw-divide-y-reverse));
    border-bottom-width: calc(1px * calc(1 - var(--tw-divide-y-reverse)));
  }
}
.overflow-x-auto {
  overflow-x: auto;
}
.rounded-full {
  border-radius: calc(infinity * 1px);
}
.border {
  border-style: var(--tw-border-style);
  border-width: 1px;
}
.border-t {
  border-top-style: var(--tw-border-style);
  border-top-width: 1px;
}
.border-b {
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 1px;
}
.border-b-2 {
  border-bottom-style: var(--tw-border-style);
  border-bottom-width: 2px;
}
.border-transparent {
  border-color: transparent;
}
.bg-gradient-to-br {
  --tw-gradient-position: to bottom right in oklab;
  background-image: linear-gradient(var(--tw-gradient-stops));
}
.text-center {
  text-align: center;
}
.text-left {
  text-align: left;
}
.text-right {
  text-align: right;
}
.uppercase {
  text-transform: uppercase;
}
.italic {
  font-style: italic;
}
.opacity-60 {
  opacity: 60%;
}
.filter {
  filter: var(--tw-blur,) var(--tw-brightness,) var(--tw-contrast,) var(--tw-grayscale,) var(--tw-hue-rotate,) var(--tw-invert,) var(--tw-saturate,) var(--tw-sepia,) var(--tw-drop-shadow,);
}
.transition {
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, visibility, content-visibility, overlay, pointer-events;
  transition-timing-function: var(--tw-ease, ease);
  transition-duration: var(--tw-duration, 0s);
}
.transition-colors {
  transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;
  transition-timing-function: var(--tw-ease, ease);
  transition-duration: var(--tw-duration, 0s);
}
.duration-300 {
  --tw-duration: 300ms;
  transition-duration: 300ms;
}
.hover\:underline {
  &:hover {
    @media (hover: hover) {
      text-decoration-line: underline;
    }
  }
}
.disabled\:cursor-not-allowed {
  &:disabled {
    cursor: not-allowed;
  }
}
.disabled\:opacity-50 {
  &:disabled {
    opacity: 50%;
  }
}
@property --tw-rotate-x {
  syntax: "*";
  inherits: false;
}
@property --tw-rotate-y {
  syntax: "*";
  inherits: false;
}
@property --tw-rotate-z {
  syntax: "*";
  inherits: false;
}
@property --tw-skew-x {
  syntax: "*";
  inherits: false;
}
@property --tw-skew-y {
  syntax: "*";
  inherits: false;
}
@property --tw-divide-y-reverse {
  syntax: "*";
  inherits: false;
  initial-value: 0;
}
@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}
@property --tw-blur {
  syntax: "*";
  inherits: false;
}
@property --tw-brightness {
  syntax: "*";
  inherits: false;
}
@property --tw-contrast {
  syntax: "*";
  inherits: false;
}
@property --tw-grayscale {
  syntax: "*";
  inherits: false;
}
@property --tw-hue-rotate {
  syntax: "*";
  inherits: false;
}
@property --tw-invert {
  syntax: "*";
  inherits: false;
}
@property --tw-opacity {
  syntax: "*";
  inherits: false;
}
@property --tw-saturate {
  syntax: "*";
  inherits: false;
}
@property --tw-sepia {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow-color {
  syntax: "*";
  inherits: false;
}
@property --tw-drop-shadow-alpha {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 100%;
}
@property --tw-drop-shadow-size {
  syntax: "*";
  inherits: false;
}
@property --tw-duration {
  syntax: "*";
  inherits: false;
}
@layer properties {
  @supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b)))) {
    *, ::before, ::after, ::backdrop {
      --tw-rotate-x: initial;
      --tw-rotate-y: initial;
      --tw-rotate-z: initial;
      --tw-skew-x: initial;
      --tw-skew-y: initial;
      --tw-divide-y-reverse: 0;
      --tw-border-style: solid;
      --tw-blur: initial;
      --tw-brightness: initial;
      --tw-contrast: initial;
      --tw-grayscale: initial;
      --tw-hue-rotate: initial;
      --tw-invert: initial;
      --tw-opacity: initial;
      --tw-saturate: initial;
      --tw-sepia: initial;
      --tw-drop-shadow: initial;
      --tw-drop-shadow-color: initial;
      --tw-drop-shadow-alpha: 100%;
      --tw-drop-shadow-size: initial;
      --tw-duration: initial;
    }
  }
}
```

### ./src/public/upload.html

File path: `./src/public/upload.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIRE Learning Platform - Upload Content</title>
  <link rel="stylesheet" href="style.css">
  <script src="js/shared-assets.js"></script>
  <style>
    /* Custom styles for the upload page */
    .drag-drop-zone {
      border: 2px dashed #a5b4fc;
      border-radius: 0.5rem;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s ease;
    }
    .drag-drop-zone.highlight {
      border-color: #4f46e5;
      background-color: rgba(79, 70, 229, 0.05);
    }
    .error-message {
      color: #ef4444;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
    
    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .logo-img {
      max-width: 200px;
      margin-bottom: 0.5rem;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-blue-100 to-indigo-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="text-center mb-8">
      <div class="logo-container" id="logo-container">
        <!-- Logo will be inserted by JavaScript -->
      </div>
      <h1 class="text-4xl font-bold text-indigo-800 mb-2">AIRE Learning Platform</h1>
      <p class="text-lg text-gray-600">Upload your real estate learning materials</p>
      
      <nav class="mt-4">
        <a href="index.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Quiz Game</a>
        <a href="flashcards.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Flashcards</a>
        <a href="upload.html" class="text-indigo-600 hover:text-indigo-800 font-bold mr-4">Upload</a>
        <a href="user-history.html" class="text-indigo-600 hover:text-indigo-800">History</a>
      </nav>
    </header>

    <div class="bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
      <h2 class="text-2xl font-semibold text-indigo-700 mb-6">Upload Learning Module</h2>
      
      <!-- Tab navigation -->
      <div class="border-b border-gray-200 mb-6">
        <ul class="flex flex-wrap -mb-px">
          <li class="mr-2">
            <a href="#" class="tab-link inline-block p-4 border-b-2 border-indigo-600 rounded-t-lg active text-indigo-600" 
               data-tab="json-upload">JSON File Upload</a>
          </li>
          <li class="mr-2">
            <a href="#" class="tab-link inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300" 
               data-tab="text-upload">Text To Questions</a>
          </li>
        </ul>
      </div>
      
      <!-- JSON Upload Tab Content -->
      <div id="json-upload" class="tab-content">
        <div class="mb-8">
          <p class="text-gray-600 mb-4">
            Upload your own learning module as a JSON file. The file must follow the required schema.
          </p>
          
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <h3 class="text-lg font-medium text-blue-800 mb-2">Template Info</h3>
            <p class="text-blue-700 mb-2">Your JSON file needs to include:</p>
            <ul class="list-disc list-inside text-blue-700 mb-3">
              <li>moduleId - A unique identifier</li>
              <li>moduleName - A display name</li>
              <li>questions - An array of question objects</li>
            </ul>
            <a href="/learning/templates/example-module.json" download class="inline-flex items-center text-blue-700 hover:underline">
              <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"></path>
              </svg>
              Download Template
            </a>
          </div>
        </div>
        
        <form id="upload-form" class="space-y-6">
          <div>
            <label for="module-file" class="block text-sm font-medium text-gray-700 mb-2">Select Module File (JSON)</label>
            <input type="file" id="module-file" name="module-file" accept=".json" 
                   class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          
          <div id="file-preview" class="hidden">
            <h3 class="text-lg font-medium text-gray-700 mb-2">File Preview</h3>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between">
                <p><strong>Module ID:</strong> <span id="preview-id"></span></p>
                <p><strong>Module Name:</strong> <span id="preview-name"></span></p>
              </div>
              <p class="mt-2"><strong>Questions:</strong> <span id="preview-questions"></span></p>
              <p><strong>Flashcards:</strong> <span id="preview-flashcards"></span></p>
            </div>
          </div>
          
          <div id="validation-results" class="hidden p-4 rounded-lg mb-4">
            <!-- Validation results will be shown here -->
          </div>
          
          <div class="flex justify-end">
            <button type="submit" id="upload-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Upload Module
            </button>
          </div>
        </form>
      </div>
      
      <!-- Text Upload Tab Content -->
      <div id="text-upload" class="tab-content hidden">
        <div class="mb-8">
          <p class="text-gray-600 mb-4">
            Generate a module with automatically created questions from your text content. 
            The system will analyze your text and create relevant quiz questions.
          </p>
          
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <h3 class="text-lg font-medium text-blue-800 mb-2">How It Works</h3>
            <p class="text-blue-700 mb-3">Simply paste your educational text and our system will:</p>
            <ul class="list-disc list-inside text-blue-700">
              <li>Analyze your text using Natural Language Processing</li>
              <li>Identify key concepts and information</li>
              <li>Automatically generate quiz questions</li>
              <li>Create a complete learning module</li>
            </ul>
          </div>
        </div>
        
        <form id="text-form" class="space-y-6">
          <div>
            <label for="creator-name" class="block text-sm font-medium text-gray-700 mb-2">Your Name (Creator)</label>
            <input type="text" id="creator-name" name="creator-name" required
                   placeholder="e.g., John Smith"
                   class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <p class="text-xs text-gray-500 mt-1">This will be used to identify modules you create</p>
          </div>
          
          <div class="border p-4 border-gray-200 rounded-lg">
            <h3 class="text-md font-medium text-gray-700 mb-3">Advanced Options (Optional)</h3>
            
            <div class="mb-4">
              <label for="module-id" class="block text-sm font-medium text-gray-700 mb-2">Custom Module ID</label>
              <input type="text" id="module-id" name="module-id"
                     placeholder="Auto-generated if left empty"
                     class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
              <p class="text-xs text-gray-500 mt-1">Use only letters, numbers, and hyphens. No spaces.</p>
            </div>
            
            <div class="mb-4">
              <label for="module-name" class="block text-sm font-medium text-gray-700 mb-2">Custom Module Name</label>
              <input type="text" id="module-name" name="module-name"
                     placeholder="Auto-generated from your text if left empty"
                     class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            
            <div>
              <label for="max-questions" class="block text-sm font-medium text-gray-700 mb-2">Maximum Questions</label>
              <input type="number" id="max-questions" name="max-questions" min="5" max="200" value="50"
                     class="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
              <p class="text-xs text-gray-500 mt-1">Limit: 5-200 questions</p>
            </div>
          </div>
          
          <div>
            <label for="content-text" class="block text-sm font-medium text-gray-700 mb-2">Educational Content Text</label>
            <textarea id="content-text" name="content-text" rows="12" required
                      placeholder="Paste your educational text content here. The more detailed and structured, the better the questions will be."
                      class="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
            <p class="text-xs text-gray-500 mt-1">Minimum 500 characters recommended for good results</p>
          </div>
          
          <div class="flex justify-end">
            <button type="submit" id="generate-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              Generate Module
            </button>
          </div>
        </form>
        
        <div id="processing-indicator" class="hidden mt-6 p-4 bg-blue-100 text-blue-700 rounded-lg text-center">
          <div class="animate-pulse flex flex-col items-center">
            <svg class="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <p class="font-medium">Processing your text...</p>
            <p class="mt-2">This may take a few moments depending on the text length.</p>
          </div>
        </div>
      </div>
      
      <!-- Shared Success/Error Messages -->
      <div id="upload-success" class="hidden mt-6 p-4 bg-green-100 text-green-700 rounded-lg">
        <p class="font-medium">Module created successfully!</p>
        <p class="mt-2">Your module is now available in the quiz and flashcard sections.</p>
        <p class="mt-4">
          <a href="index.html" id="try-module-link" class="text-green-700 hover:underline font-semibold">
            Try your module now →
          </a>
        </p>
      </div>
      
      <div id="upload-error" class="hidden mt-6 p-4 bg-red-100 text-red-700 rounded-lg">
        <p class="font-medium">Error creating module</p>
        <p id="error-message" class="mt-2"></p>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Insert the logo using the shared asset
      insertAireLogo('logo-container');
      
      // Tab switching functionality
      const tabLinks = document.querySelectorAll('.tab-link');
      const tabContents = document.querySelectorAll('.tab-content');
      
      tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          
          // Remove active class from all tabs
          tabLinks.forEach(l => {
            l.classList.remove('active', 'text-indigo-600', 'border-indigo-600');
            l.classList.add('hover:text-gray-600', 'hover:border-gray-300', 'border-transparent');
          });
          
          // Add active class to clicked tab
          link.classList.add('active', 'text-indigo-600', 'border-indigo-600');
          link.classList.remove('hover:text-gray-600', 'hover:border-gray-300', 'border-transparent');
          
          // Hide all tab contents
          tabContents.forEach(content => {
            content.classList.add('hidden');
          });
          
          // Show the selected tab content
          const tabId = link.getAttribute('data-tab');
          document.getElementById(tabId).classList.remove('hidden');
          
          // Hide any success/error messages when switching tabs
          document.getElementById('upload-success').classList.add('hidden');
          document.getElementById('upload-error').classList.add('hidden');
        });
      });
      
      // JSON Upload functionality
      const uploadForm = document.getElementById('upload-form');
      const moduleFileInput = document.getElementById('module-file');
      const uploadBtn = document.getElementById('upload-btn');
      const filePreview = document.getElementById('file-preview');
      const previewId = document.getElementById('preview-id');
      const previewName = document.getElementById('preview-name');
      const previewQuestions = document.getElementById('preview-questions');
      const previewFlashcards = document.getElementById('preview-flashcards');
      const validationResults = document.getElementById('validation-results');
      const uploadSuccess = document.getElementById('upload-success');
      const uploadError = document.getElementById('upload-error');
      const errorMessage = document.getElementById('error-message');
      const tryModuleLink = document.getElementById('try-module-link');
      
      // Handle file selection for preview
      moduleFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
          filePreview.classList.add('hidden');
          uploadBtn.disabled = true;
          return;
        }
        
        // Read the file and validate it
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = JSON.parse(e.target.result);
            
            // Basic validation
            let isValid = true;
            let errors = [];
            
            if (!content.moduleId) {
              isValid = false;
              errors.push('Missing required field: moduleId');
            }
            
            if (!content.moduleName) {
              isValid = false;
              errors.push('Missing required field: moduleName');
            }
            
            if (!content.questions || !Array.isArray(content.questions) || content.questions.length === 0) {
              isValid = false;
              errors.push('Missing or invalid questions array');
            } else {
              // Validate each question
              content.questions.forEach((q, index) => {
                if (!q.id) errors.push(`Question ${index + 1}: Missing id`);
                if (!q.question) errors.push(`Question ${index + 1}: Missing question text`);
                if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                  errors.push(`Question ${index + 1}: Missing or invalid options array`);
                }
                if (q.correctAnswer === undefined || q.correctAnswer === null) {
                  errors.push(`Question ${index + 1}: Missing correctAnswer`);
                }
              });
            }
            
            // Show validation results
            validationResults.classList.remove('hidden');
            if (errors.length > 0) {
              validationResults.className = 'p-4 bg-red-100 text-red-700 rounded-lg mb-4';
              validationResults.innerHTML = `
                <p class="font-medium">Validation Errors:</p>
                <ul class="list-disc list-inside mt-2">
                  ${errors.map(err => `<li>${err}</li>`).join('')}
                </ul>
              `;
              uploadBtn.disabled = true;
            } else {
              validationResults.className = 'p-4 bg-green-100 text-green-700 rounded-lg mb-4';
              validationResults.innerHTML = '<p class="font-medium">File is valid! Ready to upload.</p>';
              uploadBtn.disabled = false;
              
              // Show preview
              filePreview.classList.remove('hidden');
              previewId.textContent = content.moduleId;
              previewName.textContent = content.moduleName;
              previewQuestions.textContent = content.questions ? content.questions.length : 0;
              previewFlashcards.textContent = content.flashcards ? content.flashcards.length : 0;
            }
          } catch (err) {
            console.error('Error parsing JSON:', err);
            validationResults.classList.remove('hidden');
            validationResults.className = 'p-4 bg-red-100 text-red-700 rounded-lg mb-4';
            validationResults.innerHTML = `
              <p class="font-medium">Invalid JSON format:</p>
              <p class="mt-2">${err.message}</p>
            `;
            uploadBtn.disabled = true;
          }
        };
        reader.readAsText(file);
      });
      
      // Handle JSON form submission
      uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const file = moduleFileInput.files[0];
        if (!file) return;
        
        // Create form data
        const formData = new FormData();
        formData.append('module', file);
        
        try {
          // Reset previous results
          uploadSuccess.classList.add('hidden');
          uploadError.classList.add('hidden');
          
          // Send the file to the server
          const response = await fetch('/api/upload-module', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Update try module link
          tryModuleLink.href = `index.html?module=${result.moduleId}`;
          
          // Show success message
          uploadSuccess.classList.remove('hidden');
          uploadForm.reset();
          filePreview.classList.add('hidden');
          validationResults.classList.add('hidden');
          uploadBtn.disabled = true;
        } catch (err) {
          console.error('Upload error:', err);
          
          // Show error message
          uploadError.classList.remove('hidden');
          errorMessage.textContent = err.message || 'Unknown error occurred';
        }
      });

      // Text Upload functionality
      const textForm = document.getElementById('text-form');
      const creatorNameInput = document.getElementById('creator-name');
      const moduleIdInput = document.getElementById('module-id');
      const moduleNameInput = document.getElementById('module-name');
      const maxQuestionsInput = document.getElementById('max-questions');
      const contentTextArea = document.getElementById('content-text');
      const generateBtn = document.getElementById('generate-btn');
      const processingIndicator = document.getElementById('processing-indicator');
      
      // Validate module ID format (letters, numbers, hyphens only)
      moduleIdInput.addEventListener('input', () => {
        moduleIdInput.value = moduleIdInput.value.replace(/[^a-z0-9-]/gi, '').toLowerCase();
      });
      
      // Generate module ID from text excerpt
      function generateModuleId(text, creatorName) {
        // Take the first 30 characters of text, remove special chars, and append timestamp
        const excerpt = text.substring(0, 30).trim()
          .replace(/[^a-z0-9]/gi, '-')
          .replace(/-+/g, '-')
          .toLowerCase();
        
        // Add creator name as prefix if available
        const prefix = creatorName ? 
          creatorName.trim().toLowerCase().replace(/[^a-z0-9]/gi, '-').substring(0, 15) + '-' : 
          '';
        
        // Add timestamp for uniqueness
        const timestamp = Date.now().toString().substr(-6);
        
        return `${prefix}${excerpt.substring(0, 20)}-${timestamp}`.replace(/-+/g, '-');
      }
      
      // Generate module name from text's first sentence
      function generateModuleName(text) {
        // Find the first sentence (ending with ., ! or ?)
        const match = text.match(/^[^.!?]+[.!?]/);
        
        if (match && match[0]) {
          // Limit to 50 chars and ensure it starts with capital letter
          let title = match[0].trim().substring(0, 50);
          if (title.endsWith('.') || title.endsWith('!') || title.endsWith('?')) {
            title = title.substring(0, title.length - 1);
          }
          return title.charAt(0).toUpperCase() + title.slice(1);
        }
        
        // Fallback to first 50 chars if no sentence found
        return text.substring(0, 50).trim() + '...';
      }
      
      // Handle text form submission
      textForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        // Get form values
        const creatorName = creatorNameInput.value.trim();
        let moduleId = moduleIdInput.value.trim();
        let moduleName = moduleNameInput.value.trim();
        const maxQuestions = parseInt(maxQuestionsInput.value, 10);
        const text = contentTextArea.value.trim();
        
        // Basic validation
        if (!creatorName) {
          alert('Please enter your name');
          creatorNameInput.focus();
          return;
        }
        
        if (!text || text.length < 100) {
          alert('Please enter more text content (minimum 100 characters)');
          contentTextArea.focus();
          return;
        }
        
        // Auto-generate fields if not provided
        if (!moduleId) {
          moduleId = generateModuleId(text, creatorName);
        }
        
        if (!moduleName) {
          moduleName = generateModuleName(text);
        }
        
        // Auto-generate description from text
        const description = `Module created by ${creatorName} from text content`;
        
        try {
          // Reset previous results and show processing indicator
          uploadSuccess.classList.add('hidden');
          uploadError.classList.add('hidden');
          processingIndicator.classList.remove('hidden');
          generateBtn.disabled = true;
          
          // Send the text to the server
          const response = await fetch('/api/generate-module-from-text', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              moduleId,
              moduleName,
              description,
              maxQuestions,
              text
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server returned ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          
          // Update try module link
          tryModuleLink.href = `index.html?module=${result.moduleId}`;
          
          // Show success message
          processingIndicator.classList.add('hidden');
          uploadSuccess.classList.remove('hidden');
          
          // Add question count to success message
          const successMessage = uploadSuccess.querySelector('p.mt-2');
          successMessage.textContent = `Your module with ${result.questionCount} questions is now available in the quiz and flashcard sections.`;
          
          // Reset form
          textForm.reset();
          generateBtn.disabled = false;
        } catch (err) {
          console.error('Text processing error:', err);
          
          // Hide processing and show error
          processingIndicator.classList.add('hidden');
          uploadError.classList.remove('hidden');
          errorMessage.textContent = err.message || 'Unknown error occurred';
          generateBtn.disabled = false;
        }
      });
    });
  </script>
</body>
</html> ```

### ./src/public/user-history.html

File path: `./src/public/user-history.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIRE Learning Platform - Learning History</title>
  <link rel="stylesheet" href="style.css">
  <script src="js/shared-assets.js"></script>
  <style>
    .logo-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .logo-img {
      max-width: 200px;
      margin-bottom: 0.5rem;
    }
    
    .history-card {
      border-left: 4px solid;
      transition: transform 0.2s;
    }
    
    .history-card:hover {
      transform: translateY(-2px);
    }
    
    .score-high {
      border-color: #10b981;
    }
    
    .score-medium {
      border-color: #3b82f6;
    }
    
    .score-low {
      border-color: #ef4444;
    }
    
    .loading-spinner {
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .progress-bar {
      height: 8px;
      border-radius: 4px;
      background-color: #e5e7eb;
      overflow: hidden;
    }
    
    .progress-value {
      height: 100%;
      border-radius: 4px;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-blue-100 to-indigo-200 min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <header class="text-center mb-8">
      <div class="logo-container" id="logo-container">
        <!-- Logo will be inserted by JavaScript -->
      </div>
      <h1 class="text-4xl font-bold text-indigo-800 mb-2">AIRE Learning Platform</h1>
      <p class="text-lg text-gray-600">Track your real estate learning progress</p>
      
      <nav class="mt-4">
        <a href="index.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Quiz Game</a>
        <a href="flashcards.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Flashcards</a>
        <a href="upload.html" class="text-indigo-600 hover:text-indigo-800 mr-4">Upload</a>
        <a href="user-history.html" class="text-indigo-600 hover:text-indigo-800 font-bold">History</a>
      </nav>
    </header>

    <div class="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold text-indigo-700">User History</h2>
        
        <div class="flex items-center space-x-2">
          <div id="user-id-display" class="text-sm font-mono bg-gray-100 p-2 rounded">No user selected</div>
          <button id="refresh-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-4 rounded text-sm">
            Refresh
          </button>
        </div>
      </div>
      
      <!-- Admin Panel - Only visible in dev mode -->
      <div id="admin-panel" class="mb-8 hidden">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-indigo-700">Admin Panel - All Users</h3>
          <div class="flex gap-2">
            <button id="admin-generate-user-btn" class="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded text-sm">
              Generate New User
            </button>
            <button id="admin-refresh-btn" class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-4 rounded text-sm">
              Refresh User List
            </button>
          </div>
        </div>
        
        <div id="admin-loading" class="py-4 text-center">
          <div class="loading-spinner mb-2"></div>
          <p class="text-gray-600">Loading users...</p>
        </div>
        
        <div id="admin-users-empty" class="py-4 text-center hidden">
          <p class="text-gray-600">No simulated users found. Run npm run dev:sim to create some.</p>
        </div>
        
        <div id="admin-users-table" class="hidden overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead class="bg-gray-100">
              <tr>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
                <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-users-list" class="divide-y divide-gray-200">
              <!-- User rows will be inserted here -->
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- User Stats Overview -->
      <div id="user-stats" class="mb-8 p-4 bg-indigo-50 rounded-lg hidden">
        <h3 class="text-lg font-medium text-indigo-700 mb-4">User Overview</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white p-4 rounded shadow-sm">
            <p class="text-sm text-gray-500">Total Questions Answered</p>
            <p id="stat-total-answered" class="text-2xl font-semibold text-indigo-600">0</p>
            <div class="mt-2">
              <p class="text-xs text-gray-500 mb-1">Correct Answers</p>
              <div class="progress-bar">
                <div id="stat-correct-bar" class="progress-value bg-green-500" style="width: 0%"></div>
              </div>
              <p id="stat-correct-percent" class="text-xs text-right mt-1">0%</p>
            </div>
          </div>
          
          <div class="bg-white p-4 rounded shadow-sm">
            <p class="text-sm text-gray-500">Modules Started</p>
            <p id="stat-modules-started" class="text-2xl font-semibold text-indigo-600">0</p>
            <div class="mt-2">
              <p class="text-xs text-gray-500 mb-1">Completed Modules</p>
              <div class="progress-bar">
                <div id="stat-modules-completed-bar" class="progress-value bg-blue-500" style="width: 0%"></div>
              </div>
              <p id="stat-modules-completed-percent" class="text-xs text-right mt-1">0%</p>
            </div>
          </div>
          
          <div class="bg-white p-4 rounded shadow-sm">
            <p class="text-sm text-gray-500">Average Score</p>
            <p id="stat-average-score" class="text-2xl font-semibold text-indigo-600">0%</p>
            <div class="mt-2">
              <p class="text-xs text-gray-500 mb-1">Last Quiz Score</p>
              <div class="progress-bar">
                <div id="stat-last-score-bar" class="progress-value bg-purple-500" style="width: 0%"></div>
              </div>
              <p id="stat-last-score-percent" class="text-xs text-right mt-1">0%</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Module Progress -->
      <div id="module-progress-section" class="mb-8 hidden">
        <h3 class="text-lg font-medium text-indigo-700 mb-4">Module Progress</h3>
        <div id="module-progress-container" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Module progress cards will be inserted here -->
        </div>
      </div>
      
      <!-- Quiz History -->
      <div id="quiz-history-section">
        <h3 class="text-lg font-medium text-indigo-700 mb-4">Quiz History</h3>
        
        <div id="history-loading" class="py-10 text-center">
          <div class="loading-spinner mb-4"></div>
          <p class="text-gray-600">Loading user history...</p>
        </div>
        
        <div id="history-empty" class="py-10 text-center hidden">
          <p class="text-gray-600">No quiz history found for this user.</p>
        </div>
        
        <div id="quiz-history-container" class="space-y-4 hidden">
          <!-- Quiz history items will be inserted here -->
        </div>
      </div>
    </div>
  </div>

  <!-- Modal for generating new user -->
  <div id="generate-user-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium text-indigo-700">Generate Simulated User</h3>
        <button id="modal-close-btn" class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <form id="generate-user-form">
        <div class="mb-4">
          <label for="module-select" class="block text-sm font-medium text-gray-700 mb-1">Module</label>
          <select id="module-select" class="w-full p-2 border border-gray-300 rounded-md" required>
            <option value="">Loading modules...</option>
          </select>
        </div>
        
        <div class="mb-4">
          <label for="question-count" class="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
          <input type="number" id="question-count" class="w-full p-2 border border-gray-300 rounded-md" min="1" max="100" value="10" required>
        </div>
        
        <div class="mb-4">
          <label for="batch-size" class="block text-sm font-medium text-gray-700 mb-1">Batch Size</label>
          <select id="batch-size" class="w-full p-2 border border-gray-300 rounded-md" required>
            <option value="5">5 questions</option>
            <option value="10" selected>10 questions</option>
            <option value="20">20 questions</option>
            <option value="50">50 questions</option>
            <option value="100">100 questions</option>
          </select>
        </div>
        
        <div class="flex justify-end">
          <button type="button" id="modal-cancel-btn" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-300 mr-2">
            Cancel
          </button>
          <button type="submit" id="modal-generate-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition duration-300">
            Generate
          </button>
        </div>
      </form>
      
      <div id="generation-status" class="mt-4 text-center hidden">
        <div class="loading-spinner mb-2 inline-block"></div>
        <p class="text-gray-600">Generating user data...</p>
      </div>
    </div>
  </div>

  <!-- Dev Tools Panel for bottom of screen (only visible in dev mode) -->
  <div id="history-dev-tools" class="fixed bottom-0 left-0 right-0 bg-blue-700 text-white p-2 flex gap-3 justify-start items-center z-50 font-bold hidden">
    <span>🛠️ History Dev Tools</span>
    <select id="dev-user-select" class="bg-white text-blue-900 font-bold py-1 px-3 rounded">
      <option value="">Select User...</option>
    </select>
    <button id="dev-load-user" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded">Load Selected User</button>
    <button id="dev-reload-users" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded">Reload Users</button>
    <a href="dev-tools-help.html" target="_blank" class="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded ml-auto">Help</a>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Insert the logo using the shared asset
      insertAireLogo('logo-container');
      
      // DOM Elements
      const userIdDisplay = document.getElementById('user-id-display');
      const userStatsSection = document.getElementById('user-stats');
      const moduleProgressSection = document.getElementById('module-progress-section');
      const moduleProgressContainer = document.getElementById('module-progress-container');
      const quizHistoryContainer = document.getElementById('quiz-history-container');
      const historyLoadingElement = document.getElementById('history-loading');
      const historyEmptyElement = document.getElementById('history-empty');
      const refreshBtn = document.getElementById('refresh-btn');
      
      // Admin panel elements
      const adminPanel = document.getElementById('admin-panel');
      const adminRefreshBtn = document.getElementById('admin-refresh-btn');
      const adminLoadingElement = document.getElementById('admin-loading');
      const adminUsersEmptyElement = document.getElementById('admin-users-empty');
      const adminUsersTable = document.getElementById('admin-users-table');
      const adminUsersList = document.getElementById('admin-users-list');
      
      // Stats elements
      const statTotalAnswered = document.getElementById('stat-total-answered');
      const statCorrectBar = document.getElementById('stat-correct-bar');
      const statCorrectPercent = document.getElementById('stat-correct-percent');
      const statModulesStarted = document.getElementById('stat-modules-started');
      const statModulesCompletedBar = document.getElementById('stat-modules-completed-bar');
      const statModulesCompletedPercent = document.getElementById('stat-modules-completed-percent');
      const statAverageScore = document.getElementById('stat-average-score');
      const statLastScoreBar = document.getElementById('stat-last-score-bar');
      const statLastScorePercent = document.getElementById('stat-last-score-percent');
      
      // Check for development mode
      const isDevMode = new URLSearchParams(window.location.search).has('dev');
      const historyDevTools = document.getElementById('history-dev-tools');
      
      // Modal elements
      const generateUserModal = document.getElementById('generate-user-modal');
      const generateUserForm = document.getElementById('generate-user-form');
      const moduleSelect = document.getElementById('module-select');
      const questionCount = document.getElementById('question-count');
      const batchSize = document.getElementById('batch-size');
      const generationStatus = document.getElementById('generation-status');
      const modalCloseBtn = document.getElementById('modal-close-btn');
      const modalCancelBtn = document.getElementById('modal-cancel-btn');
      
      if (isDevMode) {
        // Show dev tools
        historyDevTools.classList.remove('hidden');
        adminPanel.classList.remove('hidden');
        
        // Load user dropdown and admin panel
        loadSimulatedUsers();
        loadAdminPanel();
        loadAvailableModules();
        
        // Add reload users button functionality
        document.getElementById('dev-reload-users').addEventListener('click', () => {
          loadSimulatedUsers();
        });
        
        // Add admin refresh button functionality
        adminRefreshBtn.addEventListener('click', () => {
          loadAdminPanel();
        });
        
        // Add generate new user button functionality
        document.getElementById('admin-generate-user-btn').addEventListener('click', () => {
          showGenerateUserModal();
        });
        
        // Add direct selection change event for faster usage
        document.getElementById('dev-user-select').addEventListener('change', (e) => {
          const selectedUserId = e.target.value;
          if (selectedUserId) {
            localStorage.setItem('currentUserId', selectedUserId);
            userIdDisplay.textContent = `User: ${selectedUserId.substring(0, 15)}...`;
            loadUserData(selectedUserId);
          }
        });
        
        // Modal close handlers
        modalCloseBtn.addEventListener('click', hideGenerateUserModal);
        modalCancelBtn.addEventListener('click', hideGenerateUserModal);
        
        // Form submission
        generateUserForm.addEventListener('submit', (e) => {
          e.preventDefault();
          generateSimulatedUser();
        });
      }
      
      // Get current user ID from localStorage
      const currentUserId = localStorage.getItem('currentUserId');
      
      if (currentUserId) {
        userIdDisplay.textContent = `User: ${currentUserId.substring(0, 15)}...`;
        loadUserData(currentUserId);
      } else {
        userIdDisplay.textContent = 'No user selected';
        historyLoadingElement.classList.add('hidden');
        historyEmptyElement.classList.remove('hidden');
      }
      
      // Refresh button
      refreshBtn.addEventListener('click', () => {
        const userId = localStorage.getItem('currentUserId');
        if (userId) {
          loadUserData(userId);
        } else {
          alert('No user selected. Please select a user in dev mode first.');
        }
      });
      
      // Load simulated users for dev mode
      async function loadSimulatedUsers() {
        try {
          const response = await fetch('/api/dev/users?dev=true');
          const data = await response.json();
          
          const devUserSelect = document.getElementById('dev-user-select');
          
          // Clear and populate user list
          devUserSelect.innerHTML = '<option value="">Select User...</option>';
          
          if (data.users && data.users.length > 0) {
            data.users.forEach(user => {
              const option = document.createElement('option');
              option.value = user.userId;
              option.textContent = `${user.userId.substring(0, 15)}... (${user.totalAnswered} answers)`;
              option.title = `Created: ${new Date(user.createdAt).toLocaleString()}\nAnswers: ${user.totalAnswered} (${user.totalCorrect} correct)\nModules: ${user.moduleCount}`;
              devUserSelect.appendChild(option);
            });
            
            // Select current user if available
            if (currentUserId) {
              const currentOption = Array.from(devUserSelect.options).find(opt => opt.value === currentUserId);
              if (currentOption) {
                currentOption.selected = true;
              }
            }
          }
          
          // Load user button
          document.getElementById('dev-load-user').addEventListener('click', () => {
            const selectedUserId = devUserSelect.value;
            
            if (!selectedUserId) {
              alert('Please select a valid user');
              return;
            }
            
            // Set the selected user ID in localStorage
            localStorage.setItem('currentUserId', selectedUserId);
            userIdDisplay.textContent = `User: ${selectedUserId.substring(0, 15)}...`;
            loadUserData(selectedUserId);
          });
        } catch (error) {
          console.error('Error loading simulated users:', error);
        }
      }
      
      // Function to load admin panel with all users
      async function loadAdminPanel() {
        // Show loading state
        adminLoadingElement.classList.remove('hidden');
        adminUsersEmptyElement.classList.add('hidden');
        adminUsersTable.classList.add('hidden');
        adminUsersList.innerHTML = '';
        
        try {
          // Fetch all users
          const response = await fetch('/api/dev/users?dev=true');
          const data = await response.json();
          
          if (!data.users || data.users.length === 0) {
            // No users found
            adminLoadingElement.classList.add('hidden');
            adminUsersEmptyElement.classList.remove('hidden');
            return;
          }
          
          // Sort users by most recent first
          const sortedUsers = [...data.users].sort((a, b) => {
            return new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt);
          });
          
          // Populate the users table
          sortedUsers.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            // Calculate accuracy
            const accuracy = user.totalAnswered > 0 
              ? Math.round((user.totalCorrect / user.totalAnswered) * 100) 
              : 0;
            
            // Format date
            const createdDate = new Date(user.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            row.innerHTML = `
              <td class="py-3 px-4 text-sm font-mono">
                ${user.userId.substring(0, 20)}...
              </td>
              <td class="py-3 px-4 text-sm text-gray-500">
                ${createdDate}
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center">
                  <span class="text-sm font-medium mr-2">${user.totalAnswered}</span>
                  <div class="flex-1 h-2 bg-gray-200 rounded-full max-w-[100px]">
                    <div class="h-2 bg-blue-500 rounded-full" style="width: ${Math.min(100, user.totalAnswered / 3)}%"></div>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center">
                  <span class="text-sm font-medium mr-2">${accuracy}%</span>
                  <div class="flex-1 h-2 bg-gray-200 rounded-full max-w-[100px]">
                    <div class="h-2 ${accuracy >= 80 ? 'bg-green-500' : (accuracy >= 60 ? 'bg-blue-500' : 'bg-red-500')} rounded-full" style="width: ${accuracy}%"></div>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 text-sm">
                ${user.moduleCount}
              </td>
              <td class="py-3 px-4">
                <button class="load-user-btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1 px-2 rounded" data-user-id="${user.userId}">
                  View
                </button>
              </td>
            `;
            
            adminUsersList.appendChild(row);
          });
          
          // Add event listeners to the view buttons
          document.querySelectorAll('.load-user-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const userId = btn.dataset.userId;
              localStorage.setItem('currentUserId', userId);
              userIdDisplay.textContent = `User: ${userId.substring(0, 15)}...`;
              loadUserData(userId);
              
              // Update the dropdown selection
              const devUserSelect = document.getElementById('dev-user-select');
              const option = Array.from(devUserSelect.options).find(opt => opt.value === userId);
              if (option) {
                option.selected = true;
              }
              
              // Scroll to user data
              userStatsSection.scrollIntoView({ behavior: 'smooth' });
            });
          });
          
          // Show the table
          adminLoadingElement.classList.add('hidden');
          adminUsersTable.classList.remove('hidden');
          
        } catch (error) {
          console.error('Error loading admin panel:', error);
          adminLoadingElement.classList.add('hidden');
          adminUsersEmptyElement.classList.remove('hidden');
        }
      }
      
      // Load user data and display
      async function loadUserData(userId) {
        console.log("Loading user data for:", userId);
        // Reset UI state
        historyLoadingElement.classList.remove('hidden');
        historyEmptyElement.classList.add('hidden');
        quizHistoryContainer.classList.add('hidden');
        quizHistoryContainer.innerHTML = '';
        moduleProgressContainer.innerHTML = '';
        userStatsSection.classList.add('hidden');
        moduleProgressSection.classList.add('hidden');
        
        try {
          // Try to load the user progress data
          const response = await fetch(`/data/progress_${userId}.json?dev=true`);
          
          if (!response.ok) {
            throw new Error('Failed to load user data');
          }
          
          const userData = await response.json();
          console.log("Loaded user data:", userData);
          
          // Update stats
          updateUserStats(userData);
          
          // Load module progress
          loadModuleProgress(userData);
          
          // Load quiz history
          loadQuizHistory(userData);
          
          // Show user stats section
          userStatsSection.classList.remove('hidden');
          
        } catch (error) {
          console.error('Error loading user data:', error);
          historyLoadingElement.classList.add('hidden');
          historyEmptyElement.classList.remove('hidden');
          userStatsSection.classList.add('hidden');
          moduleProgressSection.classList.add('hidden');
        }
      }
      
      // Update user stats overview
      function updateUserStats(userData) {
        if (!userData) return;
        
        // Total questions answered
        const totalAnswered = userData.totalAnswered || 0;
        statTotalAnswered.textContent = totalAnswered;
        
        // Correct answers percentage
        const correctAnswers = userData.totalCorrect || 0;
        const correctPercent = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
        statCorrectBar.style.width = `${correctPercent}%`;
        statCorrectPercent.textContent = `${correctPercent}% (${correctAnswers}/${totalAnswered})`;
        
        // Modules
        const modulesStarted = Object.keys(userData.modules || {}).length;
        statModulesStarted.textContent = modulesStarted;
        
        // Completed modules
        const completedModules = Object.values(userData.modules || {}).filter(m => m.completed).length;
        const completedPercent = modulesStarted > 0 ? Math.round((completedModules / modulesStarted) * 100) : 0;
        statModulesCompletedBar.style.width = `${completedPercent}%`;
        statModulesCompletedPercent.textContent = `${completedPercent}% (${completedModules}/${modulesStarted})`;
        
        // Average score
        const quizHistory = userData.quizHistory || [];
        let averageScore = 0;
        if (quizHistory.length > 0) {
          const totalScore = quizHistory.reduce((sum, quiz) => sum + quiz.score, 0);
          averageScore = Math.round(totalScore / quizHistory.length);
        }
        statAverageScore.textContent = `${averageScore}%`;
        
        // Last quiz score
        const lastQuiz = quizHistory[quizHistory.length - 1];
        if (lastQuiz) {
          statLastScoreBar.style.width = `${lastQuiz.score}%`;
          statLastScorePercent.textContent = `${Math.round(lastQuiz.score)}% (${lastQuiz.correctAnswers}/${lastQuiz.totalQuestions})`;
        } else {
          statLastScoreBar.style.width = '0%';
          statLastScorePercent.textContent = 'N/A';
        }
      }
      
      // Load module progress
      function loadModuleProgress(userData) {
        if (!userData || !userData.modules) return;
        
        const modules = userData.modules;
        
        if (Object.keys(modules).length === 0) {
          moduleProgressSection.classList.add('hidden');
          return;
        }
        
        moduleProgressSection.classList.remove('hidden');
        moduleProgressContainer.innerHTML = '';
        
        // Load module names
        fetch('/learning/modules/index.json')
          .then(response => response.json())
          .then(indexData => {
            const moduleMap = {};
            
            // Create a map of module IDs to names
            indexData.modules.forEach(module => {
              moduleMap[module.moduleId] = {
                name: module.moduleName,
                questionCount: module.questionCount
              };
            });
            
            // Create module progress cards
            Object.entries(modules).forEach(([moduleId, moduleData]) => {
              const moduleName = moduleMap[moduleId]?.name || moduleId;
              const totalQuestions = moduleMap[moduleId]?.questionCount || 0;
              
              const card = document.createElement('div');
              card.className = 'bg-white rounded-lg shadow-sm p-4';
              
              const completionPercent = totalQuestions > 0 
                ? Math.round((moduleData.questionsAnswered / totalQuestions) * 100) 
                : 0;
              
              const correctPercent = moduleData.questionsAnswered > 0 
                ? Math.round((moduleData.correctAnswers / moduleData.questionsAnswered) * 100) 
                : 0;
              
              let statusBadge = '';
              if (moduleData.completed) {
                statusBadge = '<span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Completed</span>';
              } else if (moduleData.questionsAnswered > 0) {
                statusBadge = '<span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">In Progress</span>';
              } else {
                statusBadge = '<span class="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Not Started</span>';
              }
              
              card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-medium text-gray-900">${moduleName}</h4>
                  ${statusBadge}
                </div>
                
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Completion</span>
                      <span>${moduleData.questionsAnswered}/${totalQuestions} questions</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-value bg-blue-500" style="width: ${completionPercent}%"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div class="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Accuracy</span>
                      <span>${moduleData.correctAnswers}/${moduleData.questionsAnswered} correct</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-value bg-green-500" style="width: ${correctPercent}%"></div>
                    </div>
                  </div>
                </div>
                
                <div class="mt-3 text-xs text-gray-500">
                  Last answered: ${moduleData.lastAnswered ? new Date(moduleData.lastAnswered).toLocaleString() : 'Never'}
                </div>
              `;
              
              moduleProgressContainer.appendChild(card);
            });
          })
          .catch(error => {
            console.error('Error loading module index:', error);
          });
      }
      
      // Load quiz history
      function loadQuizHistory(userData) {
        if (!userData || !userData.quizHistory) return;
        
        const quizHistory = userData.quizHistory;
        
        if (quizHistory.length === 0) {
          historyLoadingElement.classList.add('hidden');
          historyEmptyElement.classList.remove('hidden');
          return;
        }
        
        // Fetch module names
        fetch('/learning/modules/index.json')
          .then(response => response.json())
          .then(indexData => {
            const moduleMap = {};
            
            // Create a map of module IDs to names
            indexData.modules.forEach(module => {
              moduleMap[module.moduleId] = module.moduleName;
            });
            
            // Clear history container
            quizHistoryContainer.innerHTML = '';
            
            // Create quiz history items (newest first)
            quizHistory.slice().reverse().forEach(quiz => {
              const moduleName = moduleMap[quiz.moduleId] || quiz.moduleId;
              const score = Math.round(quiz.score);
              
              let scoreClass = 'score-low';
              if (score >= 80) {
                scoreClass = 'score-high';
              } else if (score >= 60) {
                scoreClass = 'score-medium';
              }
              
              const quizDate = new Date(quiz.endTime || quiz.startTime).toLocaleString();
              
              const historyItem = document.createElement('div');
              historyItem.className = `history-card bg-white rounded-lg shadow-sm p-4 ${scoreClass}`;
              
              historyItem.innerHTML = `
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium text-gray-900">${moduleName}</h4>
                    <p class="text-sm text-gray-500">${quizDate}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xl font-bold ${score >= 80 ? 'text-green-600' : (score >= 60 ? 'text-blue-600' : 'text-red-600')}">
                      ${score}%
                    </p>
                    <p class="text-sm text-gray-600">${quiz.correctAnswers}/${quiz.totalQuestions} correct</p>
                  </div>
                </div>
                
                <div class="mt-2">
                  <div class="progress-bar">
                    <div class="progress-value ${score >= 80 ? 'bg-green-500' : (score >= 60 ? 'bg-blue-500' : 'bg-red-500')}" 
                         style="width: ${score}%"></div>
                  </div>
                </div>
              `;
              
              quizHistoryContainer.appendChild(historyItem);
            });
            
            // Update UI state
            historyLoadingElement.classList.add('hidden');
            historyEmptyElement.classList.add('hidden');
            quizHistoryContainer.classList.remove('hidden');
          })
          .catch(error => {
            console.error('Error loading module index:', error);
            historyLoadingElement.classList.add('hidden');
            historyEmptyElement.classList.remove('hidden');
          });
      }
      
      // Function to load available modules for the dropdown
      async function loadAvailableModules() {
        try {
          const response = await fetch('/learning/modules/index.json');
          const data = await response.json();
          
          moduleSelect.innerHTML = '';
          
          if (data.modules && data.modules.length > 0) {
            // Add "all modules" option
            const allOption = document.createElement('option');
            allOption.value = "all";
            allOption.textContent = "All Modules";
            moduleSelect.appendChild(allOption);
            
            // Add individual modules
            data.modules.forEach(module => {
              if (module.questionCount > 0) {
                const option = document.createElement('option');
                option.value = module.moduleId;
                option.textContent = `${module.moduleName} (${module.questionCount} questions)`;
                moduleSelect.appendChild(option);
              }
            });
          } else {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No modules available";
            option.disabled = true;
            moduleSelect.appendChild(option);
          }
        } catch (error) {
          console.error('Error loading modules:', error);
          moduleSelect.innerHTML = '<option value="">Error loading modules</option>';
        }
      }
      
      // Function to show the generate user modal
      function showGenerateUserModal() {
        generateUserModal.classList.remove('hidden');
        generationStatus.classList.add('hidden');
        moduleSelect.focus();
      }
      
      // Function to hide the generate user modal
      function hideGenerateUserModal() {
        generateUserModal.classList.add('hidden');
      }
      
      // Function to generate a simulated user
      async function generateSimulatedUser() {
        // Get form values
        const selectedModuleId = moduleSelect.value;
        const selectedQuestionCount = parseInt(questionCount.value, 10);
        const selectedBatchSize = parseInt(batchSize.value, 10);
        
        if (!selectedModuleId) {
          alert('Please select a module.');
          return;
        }
        
        // Show loading status
        generationStatus.classList.remove('hidden');
        document.getElementById('modal-generate-btn').disabled = true;
        
        try {
          // Create a random user ID similar to what the simulator script would create
          const userId = `sim_user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          
          // Get module data
          let moduleData, moduleQuestions;
          
          if (selectedModuleId === 'all') {
            // Get all modules
            const indexResponse = await fetch('/learning/modules/index.json');
            const indexData = await indexResponse.json();
            
            // For simplicity in the browser, we'll just use the first module with questions
            for (const module of indexData.modules) {
              if (module.questionCount > 0) {
                const moduleResponse = await fetch(`/learning/modules/${module.moduleId}.json`);
                moduleData = await moduleResponse.json();
                if (moduleData.questions && moduleData.questions.length > 0) {
                  break;
                }
              }
            }
          } else {
            // Get specific module
            const moduleResponse = await fetch(`/learning/modules/${selectedModuleId}.json`);
            moduleData = await moduleResponse.json();
          }
          
          if (!moduleData || !moduleData.questions || moduleData.questions.length === 0) {
            throw new Error('No questions found in selected module');
          }
          
          // Determine how many questions to use
          let questionsToUse = moduleData.questions;
          
          if (selectedQuestionCount > 0 && selectedQuestionCount < questionsToUse.length) {
            // Shuffle and slice for random subset
            questionsToUse = [...questionsToUse]
              .sort(() => Math.random() - 0.5)
              .slice(0, selectedQuestionCount);
          }
          
          // Limit to batch size if specified
          if (selectedBatchSize > 0 && selectedBatchSize < questionsToUse.length) {
            questionsToUse = questionsToUse.slice(0, selectedBatchSize);
          }
          
          // Create progress data structure
          const now = new Date().toISOString();
          const userProgress = {
            userId,
            modules: {},
            answeredQuestions: {},
            quizHistory: [],
            totalCorrect: 0,
            totalAnswered: 0,
            createdAt: now,
            lastUpdated: now
          };
          
          // Initialize module data
          userProgress.modules[moduleData.moduleId] = {
            started: now,
            questionsAnswered: 0,
            correctAnswers: 0,
            lastAnswered: now,
            completed: false
          };
          
          // Create quiz session
          const quizSession = {
            sessionId: `session_${Date.now()}`,
            moduleId: moduleData.moduleId,
            startTime: now,
            endTime: now,
            totalQuestions: questionsToUse.length,
            correctAnswers: 0,
            score: 0
          };
          
          // Generate random answers
          let correctCount = 0;
          
          questionsToUse.forEach(question => {
            // Random answer
            const randomIndex = Math.floor(Math.random() * question.options.length);
            const isCorrect = randomIndex === question.correctAnswer;
            
            // Store in answered questions
            userProgress.answeredQuestions[question.id] = {
              moduleId: moduleData.moduleId,
              userAnswer: randomIndex,
              correct: isCorrect,
              answeredAt: now,
              attemptCount: 1
            };
            
            // Update module statistics
            userProgress.modules[moduleData.moduleId].questionsAnswered++;
            if (isCorrect) {
              userProgress.modules[moduleData.moduleId].correctAnswers++;
              correctCount++;
            }
            
            // Update overall statistics
            userProgress.totalAnswered++;
            if (isCorrect) {
              userProgress.totalCorrect++;
            }
          });
          
          // Complete the quiz with score
          const score = questionsToUse.length > 0 ? (correctCount / questionsToUse.length) * 100 : 0;
          quizSession.correctAnswers = correctCount;
          quizSession.score = score;
          
          // Add to quiz history
          userProgress.quizHistory.push(quizSession);
          
          // Mark module as completed if score is high enough
          if (score >= 80) {
            userProgress.modules[moduleData.moduleId].completed = true;
            userProgress.modules[moduleData.moduleId].completedAt = now;
          }
          
          // Send user data to server to save
          const saveResponse = await fetch('/api/dev/save-user-progress?dev=true', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(userProgress)
          });
          
          if (!saveResponse.ok) {
            throw new Error('Failed to save user progress');
          }
          
          const result = await saveResponse.json();
          
          if (result.success) {
            // Set as current user
            localStorage.setItem('currentUserId', userId);
            
            // Reload admin panel and user dropdown
            loadAdminPanel();
            loadSimulatedUsers();
            
            // Hide modal
            hideGenerateUserModal();
            
            // Show success message
            alert(`User generated successfully: ${userId}`);
            
            // Load the new user's data
            userIdDisplay.textContent = `User: ${userId.substring(0, 15)}...`;
            loadUserData(userId);
          } else {
            throw new Error(result.message || 'Failed to save user progress');
          }
          
        } catch (error) {
          console.error('Error generating user:', error);
          alert(`Error generating user: ${error.message}`);
          document.getElementById('modal-generate-btn').disabled = false;
          generationStatus.classList.add('hidden');
        }
      }
    });
  </script>
</body>
</html> ```

## Learning Modules

### ./src/learning/modules/index.json

File path: `./src/learning/modules/index.json`

```json
{
  "modules": [
    {
      "moduleId": "intro-to-ai",
      "moduleName": "Introduction to AI",
      "description": "Learn the fundamentals of artificial intelligence",
      "category": "Artificial Intelligence",
      "difficulty": "beginner",
      "tags": ["AI", "fundamentals"],
      "questionCount": 20,
      "flashcardCount": 10,
      "updatedAt": "2023-09-20T10:00:00.000Z"
    },
    {
      "moduleId": "js-basics",
      "moduleName": "JavaScript Basics",
      "description": "Learn the fundamentals of JavaScript programming",
      "category": "Programming",
      "difficulty": "beginner",
      "tags": ["JavaScript", "programming", "web development"],
      "questionCount": 15,
      "flashcardCount": 8,
      "updatedAt": "2023-09-15T10:00:00.000Z"
    },
    {
      "moduleId": "tauros-module1",
      "moduleName": "Tauros Module 1",
      "description": "First module in the Tauros series",
      "category": "Tauros",
      "difficulty": "intermediate",
      "tags": ["Tauros", "module"],
      "questionCount": 12,
      "flashcardCount": 6,
      "updatedAt": "2023-10-01T10:00:00.000Z"
    }
  ]
}```

### ./src/learning/modules/intro-to-ai.json

File path: `./src/learning/modules/intro-to-ai.json`

```json
{
  "moduleId": "intro-to-ai",
  "moduleName": "Introduction to Artificial Intelligence",
  "description": "Learn about the fundamentals of AI, including key concepts, history, types of AI, applications, and ethical considerations.",
  "category": "Computer Science",
  "difficulty": "beginner",
  "tags": [
    "artificial intelligence",
    "machine learning",
    "AI ethics",
    "computer science"
  ],
  "createdAt": "2023-05-20T14:30:00Z",
  "updatedAt": "2025-05-07T20:08:28.425Z",
  "questions": [
    {
      "id": 1,
      "question": "What is Artificial Intelligence (AI)?",
      "options": [
        "A type of computer hardware designed to mimic human brains",
        "The simulation of human intelligence in machines programmed to think and learn like humans",
        "A programming language used to create smart software",
        "Robots that look and act like humans"
      ],
      "correctAnswer": 1,
      "explanation": "Artificial Intelligence refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. It involves creating systems capable of performing tasks that typically require human intelligence."
    },
    {
      "id": 2,
      "question": "When was the term 'Artificial Intelligence' first coined?",
      "options": [
        "1943",
        "1956",
        "1965",
        "1997"
      ],
      "correctAnswer": 1,
      "explanation": "The term 'Artificial Intelligence' was first coined by John McCarthy in 1956 at the Dartmouth Conference, which is widely considered the founding event of AI as a field."
    },
    {
      "id": 3,
      "question": "Which of the following is a type of AI based on capabilities?",
      "options": [
        "Supervised AI",
        "Unsupervised AI",
        "Narrow AI",
        "Reinforcement AI"
      ],
      "correctAnswer": 2,
      "explanation": "Based on capabilities, AI is often categorized as Narrow AI (focused on specific tasks), General AI (broad human-like intelligence), and Superintelligent AI (surpassing human intelligence). Supervised, Unsupervised, and Reinforcement are types of machine learning approaches."
    },
    {
      "id": 4,
      "question": "What is the difference between AI and Machine Learning?",
      "options": [
        "They are completely unrelated technologies",
        "AI is a subset of Machine Learning",
        "Machine Learning is a subset of AI",
        "They are different terms for the same technology"
      ],
      "correctAnswer": 2,
      "explanation": "Machine Learning is a subset of Artificial Intelligence. ML involves training algorithms to learn patterns from data and make predictions or decisions, while AI is the broader concept of machines being able to perform tasks that would require intelligence if done by humans."
    },
    {
      "id": 5,
      "question": "What is the 'Turing Test' in AI?",
      "options": [
        "A test to measure a computer's processing speed",
        "A test to determine if a machine can exhibit human-like intelligence",
        "A test to check if AI systems are free from programming errors",
        "A test to verify if an AI can operate autonomously"
      ],
      "correctAnswer": 1,
      "explanation": "The Turing Test, proposed by Alan Turing in 1950, is a test of a machine's ability to exhibit intelligent behavior equivalent to, or indistinguishable from, that of a human. It involves a human evaluator who attempts to distinguish between responses from a human and an AI."
    },
    {
      "id": 6,
      "question": "Which of the following is NOT a common application of AI?",
      "options": [
        "Natural Language Processing",
        "Computer Vision",
        "Manual Data Entry",
        "Autonomous Vehicles"
      ],
      "correctAnswer": 2,
      "explanation": "Manual Data Entry is not an AI application but rather a task that AI systems can automate. Natural Language Processing, Computer Vision, and Autonomous Vehicles are all significant applications of AI technology."
    },
    {
      "id": 7,
      "question": "What does 'Deep Learning' refer to in AI?",
      "options": [
        "Learning that happens in deep space environments",
        "Learning that takes a long time to complete",
        "A subset of machine learning using neural networks with many layers",
        "The deepest level of AI understanding humans have achieved"
      ],
      "correctAnswer": 2,
      "explanation": "Deep Learning is a subset of machine learning that uses neural networks with multiple (deep) layers. These deep neural networks can automatically discover representations needed for detection or classification from raw data."
    },
    {
      "id": 8,
      "question": "What is a primary concern in AI ethics?",
      "options": [
        "Making AI systems that are too intelligent",
        "Ensuring AI systems don't use too much electrical power",
        "Privacy and surveillance concerns with AI systems",
        "Preventing AI systems from being too expensive"
      ],
      "correctAnswer": 2,
      "explanation": "Privacy and surveillance are major ethical concerns in AI development. Other key concerns include bias and discrimination, transparency, accountability, job displacement, and the potential for autonomous systems to cause harm."
    },
    {
      "id": 9,
      "question": "What is a neural network in AI?",
      "options": [
        "A physical network of computers designed to mimic the human brain",
        "A model inspired by the human brain that consists of interconnected nodes (neurons)",
        "A network of AI researchers collaborating on projects",
        "The hardware components that power AI systems"
      ],
      "correctAnswer": 1,
      "explanation": "A neural network is a computational model inspired by the human brain's structure. It consists of interconnected nodes (artificial neurons) organized in layers that can learn to recognize patterns in data through a process of training and adjustment."
    },
    {
      "id": 10,
      "question": "What is 'Computer Vision' in AI?",
      "options": [
        "Software that helps computers display better visuals",
        "The field of AI that enables computers to interpret and understand visual information from the world",
        "Special monitors designed for AI systems",
        "The way computers visualize data in graphs"
      ],
      "correctAnswer": 1,
      "explanation": "Computer Vision is the field of AI that enables computers to interpret and understand visual information from the world. It involves training computers to identify and process images and videos in a human-like manner."
    },
    {
      "id": 11,
      "question": "Which of these is an example of Natural Language Processing (NLP)?",
      "options": [
        "A robot that can walk autonomously",
        "A system that can identify objects in images",
        "A chatbot that can understand and respond to text messages",
        "A program that plays chess at a professional level"
      ],
      "correctAnswer": 2,
      "explanation": "Natural Language Processing (NLP) involves AI systems that can understand, interpret, and generate human language. A chatbot that can understand and respond to text messages is a classic example of NLP in action."
    },
    {
      "id": 12,
      "question": "What is 'reinforcement learning' in AI?",
      "options": [
        "Learning by being reinforced with additional hardware",
        "A technique where AI systems learn by receiving rewards or penalties for actions",
        "Learning that reinforces existing knowledge without adding new information",
        "A learning method that requires human reinforcement at every step"
      ],
      "correctAnswer": 1,
      "explanation": "Reinforcement learning is a machine learning technique where an agent learns to make decisions by performing actions and receiving rewards or penalties in response. The agent learns to maximize rewards over time through trial and error."
    },
    {
      "id": 13,
      "question": "Which company's AI system defeated the world champion in the game of Go in 2016?",
      "options": [
        "Microsoft",
        "IBM",
        "Google (DeepMind)",
        "OpenAI"
      ],
      "correctAnswer": 2,
      "explanation": "AlphaGo, developed by Google's DeepMind, defeated world champion Lee Sedol in the complex board game Go in 2016. This was considered a major breakthrough in AI, as Go has significantly more possible positions than chess and requires intuition."
    },
    {
      "id": 14,
      "question": "What does AGI stand for in AI?",
      "options": [
        "Advanced Graphics Intelligence",
        "Automated General Integration",
        "Artificial General Intelligence",
        "Algorithmic Growth Index"
      ],
      "correctAnswer": 2,
      "explanation": "AGI stands for Artificial General Intelligence, which refers to a hypothetical AI that has the ability to understand, learn, and apply knowledge across a wide range of tasks at a level equal to or beyond human intelligence."
    },
    {
      "id": 15,
      "question": "Which of these is NOT a common type of machine learning?",
      "options": [
        "Supervised learning",
        "Unsupervised learning",
        "Reinforcement learning",
        "Superseded learning"
      ],
      "correctAnswer": 3,
      "explanation": "Superseded learning is not a recognized type of machine learning. The main types are supervised learning (training with labeled data), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through rewards and penalties)."
    },
    {
      "id": 16,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Machine Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Machine Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 17,
      "question": "What problem does regularization solve in Neural Networks models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Neural Networks adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 18,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 19,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 20,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 21,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 22,
      "question": "Which early AI program, developed in the mid-1960s, could engage in conversation with humans about psychological problems?",
      "options": [
        "SHRDLU",
        "MYCIN",
        "ELIZA",
        "Deep Blue"
      ],
      "correctAnswer": 2,
      "explanation": "ELIZA was an early natural language processing program created by Joseph Weizenbaum in the mid-1960s that simulated a psychotherapist by using pattern matching and substitution methods."
    },
    {
      "id": 23,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 24,
      "question": "What is an Deep Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Deep Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 25,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Reinforcement Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Reinforcement Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 26,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 27,
      "question": "How is AI currently being used in Healthcare?",
      "options": [
        "To completely replace human workers in Healthcare",
        "For administrative tasks only in Healthcare",
        "To automate routine tasks and assist professionals in Healthcare",
        "AI is not yet applicable to Healthcare"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Healthcare to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 28,
      "question": "What is a major challenge for AI implementation in Finance?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Finance is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 29,
      "question": "Which type of AI technology has shown the most promise in Transportation?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Transportation due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 30,
      "question": "How is AI currently being used in Education?",
      "options": [
        "To completely replace human workers in Education",
        "For administrative tasks only in Education",
        "To automate routine tasks and assist professionals in Education",
        "AI is not yet applicable to Education"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Education to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 31,
      "question": "What is a major challenge for AI implementation in Entertainment?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Entertainment is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 32,
      "question": "Which type of AI technology has shown the most promise in Agriculture?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Agriculture due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 33,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 34,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 35,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 36,
      "question": "What is a Machine Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Machine Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 37,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Neural Networks?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Neural Networks, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 38,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 39,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 40,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 41,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 42,
      "question": "Who published the paper 'Computing Machinery and Intelligence' which proposed the Turing Test?",
      "options": [
        "John McCarthy",
        "Alan Turing",
        "Marvin Minsky",
        "Claude Shannon"
      ],
      "correctAnswer": 1,
      "explanation": "Alan Turing published the paper 'Computing Machinery and Intelligence' in 1950, which introduced what later became known as the Turing Test."
    },
    {
      "id": 43,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 44,
      "question": "What problem does regularization solve in Deep Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Deep Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 45,
      "question": "What is an Reinforcement Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Reinforcement Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 46,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 47,
      "question": "Which type of AI technology has shown the most promise in Healthcare?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Healthcare due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 48,
      "question": "How is AI currently being used in Finance?",
      "options": [
        "To completely replace human workers in Finance",
        "For administrative tasks only in Finance",
        "To automate routine tasks and assist professionals in Finance",
        "AI is not yet applicable to Finance"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Finance to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 49,
      "question": "What is a major challenge for AI implementation in Transportation?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Transportation is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 50,
      "question": "Which type of AI technology has shown the most promise in Education?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Education due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 51,
      "question": "How is AI currently being used in Entertainment?",
      "options": [
        "To completely replace human workers in Entertainment",
        "For administrative tasks only in Entertainment",
        "To automate routine tasks and assist professionals in Entertainment",
        "AI is not yet applicable to Entertainment"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Entertainment to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 52,
      "question": "What is a major challenge for AI implementation in Agriculture?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Agriculture is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 53,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 54,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 55,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 56,
      "question": "What problem does regularization solve in Machine Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Machine Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 57,
      "question": "What is an Neural Networks algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Neural Networks that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 58,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 59,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 60,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 61,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 62,
      "question": "What period in AI history is often referred to as the 'AI Winter'?",
      "options": [
        "The 1950s when AI research first began",
        "The periods in the 1970s and 1980s-90s when funding and interest in AI decreased",
        "The early 2000s before deep learning became popular",
        "The current period of AI development"
      ],
      "correctAnswer": 1,
      "explanation": "The term 'AI Winter' refers to periods (particularly in the 1970s and late 1980s through the 1990s) when funding and interest in AI research decreased due to disillusionment after initial high expectations weren't met."
    },
    {
      "id": 63,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 64,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Deep Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Deep Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 65,
      "question": "What problem does regularization solve in Reinforcement Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Reinforcement Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 66,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 67,
      "question": "What is a major challenge for AI implementation in Healthcare?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Healthcare is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 68,
      "question": "Which type of AI technology has shown the most promise in Finance?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Finance due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 69,
      "question": "How is AI currently being used in Transportation?",
      "options": [
        "To completely replace human workers in Transportation",
        "For administrative tasks only in Transportation",
        "To automate routine tasks and assist professionals in Transportation",
        "AI is not yet applicable to Transportation"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Transportation to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 70,
      "question": "What is a major challenge for AI implementation in Education?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Education is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 71,
      "question": "Which type of AI technology has shown the most promise in Entertainment?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Entertainment due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 72,
      "question": "How is AI currently being used in Agriculture?",
      "options": [
        "To completely replace human workers in Agriculture",
        "For administrative tasks only in Agriculture",
        "To automate routine tasks and assist professionals in Agriculture",
        "AI is not yet applicable to Agriculture"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Agriculture to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 73,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 74,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 75,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 76,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Machine Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Machine Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 77,
      "question": "What problem does regularization solve in Neural Networks models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Neural Networks adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 78,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 79,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 80,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 81,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 82,
      "question": "Which early AI program, developed in the mid-1960s, could engage in conversation with humans about psychological problems?",
      "options": [
        "SHRDLU",
        "MYCIN",
        "ELIZA",
        "Deep Blue"
      ],
      "correctAnswer": 2,
      "explanation": "ELIZA was an early natural language processing program created by Joseph Weizenbaum in the mid-1960s that simulated a psychotherapist by using pattern matching and substitution methods."
    },
    {
      "id": 83,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 84,
      "question": "What is an Deep Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Deep Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 85,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Reinforcement Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Reinforcement Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 86,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 87,
      "question": "How is AI currently being used in Healthcare?",
      "options": [
        "To completely replace human workers in Healthcare",
        "For administrative tasks only in Healthcare",
        "To automate routine tasks and assist professionals in Healthcare",
        "AI is not yet applicable to Healthcare"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Healthcare to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 88,
      "question": "What is a major challenge for AI implementation in Finance?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Finance is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 89,
      "question": "Which type of AI technology has shown the most promise in Transportation?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Transportation due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 90,
      "question": "How is AI currently being used in Education?",
      "options": [
        "To completely replace human workers in Education",
        "For administrative tasks only in Education",
        "To automate routine tasks and assist professionals in Education",
        "AI is not yet applicable to Education"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Education to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 91,
      "question": "What is a major challenge for AI implementation in Entertainment?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Entertainment is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 92,
      "question": "Which type of AI technology has shown the most promise in Agriculture?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Agriculture due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 93,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 94,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 95,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 96,
      "question": "What is a Machine Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Machine Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 97,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Neural Networks?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Neural Networks, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 98,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 99,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 100,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 101,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 102,
      "question": "Who published the paper 'Computing Machinery and Intelligence' which proposed the Turing Test?",
      "options": [
        "John McCarthy",
        "Alan Turing",
        "Marvin Minsky",
        "Claude Shannon"
      ],
      "correctAnswer": 1,
      "explanation": "Alan Turing published the paper 'Computing Machinery and Intelligence' in 1950, which introduced what later became known as the Turing Test."
    },
    {
      "id": 103,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 104,
      "question": "What problem does regularization solve in Deep Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Deep Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 105,
      "question": "What is an Reinforcement Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Reinforcement Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 106,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 107,
      "question": "Which type of AI technology has shown the most promise in Healthcare?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Healthcare due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 108,
      "question": "How is AI currently being used in Finance?",
      "options": [
        "To completely replace human workers in Finance",
        "For administrative tasks only in Finance",
        "To automate routine tasks and assist professionals in Finance",
        "AI is not yet applicable to Finance"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Finance to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 109,
      "question": "What is a major challenge for AI implementation in Transportation?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Transportation is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 110,
      "question": "Which type of AI technology has shown the most promise in Education?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Education due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 111,
      "question": "How is AI currently being used in Entertainment?",
      "options": [
        "To completely replace human workers in Entertainment",
        "For administrative tasks only in Entertainment",
        "To automate routine tasks and assist professionals in Entertainment",
        "AI is not yet applicable to Entertainment"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Entertainment to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 112,
      "question": "What is a major challenge for AI implementation in Agriculture?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Agriculture is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 113,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 114,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 115,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 116,
      "question": "What problem does regularization solve in Machine Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Machine Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 117,
      "question": "What is an Neural Networks algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Neural Networks that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 118,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 119,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 120,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 121,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 122,
      "question": "What period in AI history is often referred to as the 'AI Winter'?",
      "options": [
        "The 1950s when AI research first began",
        "The periods in the 1970s and 1980s-90s when funding and interest in AI decreased",
        "The early 2000s before deep learning became popular",
        "The current period of AI development"
      ],
      "correctAnswer": 1,
      "explanation": "The term 'AI Winter' refers to periods (particularly in the 1970s and late 1980s through the 1990s) when funding and interest in AI research decreased due to disillusionment after initial high expectations weren't met."
    },
    {
      "id": 123,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 124,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Deep Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Deep Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 125,
      "question": "What problem does regularization solve in Reinforcement Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Reinforcement Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 126,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 127,
      "question": "What is a major challenge for AI implementation in Healthcare?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Healthcare is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 128,
      "question": "Which type of AI technology has shown the most promise in Finance?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Finance due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 129,
      "question": "How is AI currently being used in Transportation?",
      "options": [
        "To completely replace human workers in Transportation",
        "For administrative tasks only in Transportation",
        "To automate routine tasks and assist professionals in Transportation",
        "AI is not yet applicable to Transportation"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Transportation to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 130,
      "question": "What is a major challenge for AI implementation in Education?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Education is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 131,
      "question": "Which type of AI technology has shown the most promise in Entertainment?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Entertainment due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 132,
      "question": "How is AI currently being used in Agriculture?",
      "options": [
        "To completely replace human workers in Agriculture",
        "For administrative tasks only in Agriculture",
        "To automate routine tasks and assist professionals in Agriculture",
        "AI is not yet applicable to Agriculture"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Agriculture to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 133,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 134,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 135,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 136,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Machine Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Machine Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 137,
      "question": "What problem does regularization solve in Neural Networks models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Neural Networks adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 138,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 139,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 140,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 141,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 142,
      "question": "Which early AI program, developed in the mid-1960s, could engage in conversation with humans about psychological problems?",
      "options": [
        "SHRDLU",
        "MYCIN",
        "ELIZA",
        "Deep Blue"
      ],
      "correctAnswer": 2,
      "explanation": "ELIZA was an early natural language processing program created by Joseph Weizenbaum in the mid-1960s that simulated a psychotherapist by using pattern matching and substitution methods."
    },
    {
      "id": 143,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 144,
      "question": "What is an Deep Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Deep Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 145,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Reinforcement Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Reinforcement Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 146,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 147,
      "question": "How is AI currently being used in Healthcare?",
      "options": [
        "To completely replace human workers in Healthcare",
        "For administrative tasks only in Healthcare",
        "To automate routine tasks and assist professionals in Healthcare",
        "AI is not yet applicable to Healthcare"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Healthcare to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 148,
      "question": "What is a major challenge for AI implementation in Finance?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Finance is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 149,
      "question": "Which type of AI technology has shown the most promise in Transportation?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Transportation due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 150,
      "question": "How is AI currently being used in Education?",
      "options": [
        "To completely replace human workers in Education",
        "For administrative tasks only in Education",
        "To automate routine tasks and assist professionals in Education",
        "AI is not yet applicable to Education"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Education to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 151,
      "question": "What is a major challenge for AI implementation in Entertainment?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Entertainment is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 152,
      "question": "Which type of AI technology has shown the most promise in Agriculture?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Agriculture due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 153,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 154,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 155,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 156,
      "question": "What is a Machine Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Machine Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 157,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Neural Networks?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Neural Networks, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 158,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 159,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 160,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 161,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 162,
      "question": "Who published the paper 'Computing Machinery and Intelligence' which proposed the Turing Test?",
      "options": [
        "John McCarthy",
        "Alan Turing",
        "Marvin Minsky",
        "Claude Shannon"
      ],
      "correctAnswer": 1,
      "explanation": "Alan Turing published the paper 'Computing Machinery and Intelligence' in 1950, which introduced what later became known as the Turing Test."
    },
    {
      "id": 163,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 164,
      "question": "What problem does regularization solve in Deep Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Deep Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 165,
      "question": "What is an Reinforcement Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Reinforcement Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 166,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 167,
      "question": "Which type of AI technology has shown the most promise in Healthcare?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Healthcare due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 168,
      "question": "How is AI currently being used in Finance?",
      "options": [
        "To completely replace human workers in Finance",
        "For administrative tasks only in Finance",
        "To automate routine tasks and assist professionals in Finance",
        "AI is not yet applicable to Finance"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Finance to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 169,
      "question": "What is a major challenge for AI implementation in Transportation?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Transportation is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 170,
      "question": "Which type of AI technology has shown the most promise in Education?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Education due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 171,
      "question": "How is AI currently being used in Entertainment?",
      "options": [
        "To completely replace human workers in Entertainment",
        "For administrative tasks only in Entertainment",
        "To automate routine tasks and assist professionals in Entertainment",
        "AI is not yet applicable to Entertainment"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Entertainment to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 172,
      "question": "What is a major challenge for AI implementation in Agriculture?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Agriculture is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 173,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 174,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 175,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 176,
      "question": "What problem does regularization solve in Machine Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Machine Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 177,
      "question": "What is an Neural Networks algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Neural Networks that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 178,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 179,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 180,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 181,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 182,
      "question": "What period in AI history is often referred to as the 'AI Winter'?",
      "options": [
        "The 1950s when AI research first began",
        "The periods in the 1970s and 1980s-90s when funding and interest in AI decreased",
        "The early 2000s before deep learning became popular",
        "The current period of AI development"
      ],
      "correctAnswer": 1,
      "explanation": "The term 'AI Winter' refers to periods (particularly in the 1970s and late 1980s through the 1990s) when funding and interest in AI research decreased due to disillusionment after initial high expectations weren't met."
    },
    {
      "id": 183,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 184,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Deep Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Deep Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 185,
      "question": "What problem does regularization solve in Reinforcement Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Reinforcement Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 186,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 187,
      "question": "What is a major challenge for AI implementation in Healthcare?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Healthcare is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 188,
      "question": "Which type of AI technology has shown the most promise in Finance?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Finance due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 189,
      "question": "How is AI currently being used in Transportation?",
      "options": [
        "To completely replace human workers in Transportation",
        "For administrative tasks only in Transportation",
        "To automate routine tasks and assist professionals in Transportation",
        "AI is not yet applicable to Transportation"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Transportation to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 190,
      "question": "What is a major challenge for AI implementation in Education?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Education is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 191,
      "question": "Which type of AI technology has shown the most promise in Entertainment?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Entertainment due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 192,
      "question": "How is AI currently being used in Agriculture?",
      "options": [
        "To completely replace human workers in Agriculture",
        "For administrative tasks only in Agriculture",
        "To automate routine tasks and assist professionals in Agriculture",
        "AI is not yet applicable to Agriculture"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Agriculture to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 193,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 194,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 195,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 196,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Machine Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Machine Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 197,
      "question": "What problem does regularization solve in Neural Networks models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Neural Networks adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 198,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 199,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 200,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 201,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 202,
      "question": "Which early AI program, developed in the mid-1960s, could engage in conversation with humans about psychological problems?",
      "options": [
        "SHRDLU",
        "MYCIN",
        "ELIZA",
        "Deep Blue"
      ],
      "correctAnswer": 2,
      "explanation": "ELIZA was an early natural language processing program created by Joseph Weizenbaum in the mid-1960s that simulated a psychotherapist by using pattern matching and substitution methods."
    },
    {
      "id": 203,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 204,
      "question": "What is an Deep Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Deep Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 205,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Reinforcement Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Reinforcement Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 206,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 207,
      "question": "How is AI currently being used in Healthcare?",
      "options": [
        "To completely replace human workers in Healthcare",
        "For administrative tasks only in Healthcare",
        "To automate routine tasks and assist professionals in Healthcare",
        "AI is not yet applicable to Healthcare"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Healthcare to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 208,
      "question": "What is a major challenge for AI implementation in Finance?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Finance is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 209,
      "question": "Which type of AI technology has shown the most promise in Transportation?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Transportation due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 210,
      "question": "How is AI currently being used in Education?",
      "options": [
        "To completely replace human workers in Education",
        "For administrative tasks only in Education",
        "To automate routine tasks and assist professionals in Education",
        "AI is not yet applicable to Education"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Education to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 211,
      "question": "What is a major challenge for AI implementation in Entertainment?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Entertainment is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 212,
      "question": "Which type of AI technology has shown the most promise in Agriculture?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Agriculture due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 213,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 214,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 215,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 216,
      "question": "What is a Machine Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Machine Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 217,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Neural Networks?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Neural Networks, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 218,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 219,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 220,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 221,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 222,
      "question": "Who published the paper 'Computing Machinery and Intelligence' which proposed the Turing Test?",
      "options": [
        "John McCarthy",
        "Alan Turing",
        "Marvin Minsky",
        "Claude Shannon"
      ],
      "correctAnswer": 1,
      "explanation": "Alan Turing published the paper 'Computing Machinery and Intelligence' in 1950, which introduced what later became known as the Turing Test."
    },
    {
      "id": 223,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 224,
      "question": "What problem does regularization solve in Deep Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Deep Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 225,
      "question": "What is an Reinforcement Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Reinforcement Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 226,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 227,
      "question": "Which type of AI technology has shown the most promise in Healthcare?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Healthcare due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 228,
      "question": "How is AI currently being used in Finance?",
      "options": [
        "To completely replace human workers in Finance",
        "For administrative tasks only in Finance",
        "To automate routine tasks and assist professionals in Finance",
        "AI is not yet applicable to Finance"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Finance to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 229,
      "question": "What is a major challenge for AI implementation in Transportation?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Transportation is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 230,
      "question": "Which type of AI technology has shown the most promise in Education?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Education due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 231,
      "question": "How is AI currently being used in Entertainment?",
      "options": [
        "To completely replace human workers in Entertainment",
        "For administrative tasks only in Entertainment",
        "To automate routine tasks and assist professionals in Entertainment",
        "AI is not yet applicable to Entertainment"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Entertainment to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 232,
      "question": "What is a major challenge for AI implementation in Agriculture?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Agriculture is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 233,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 234,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 235,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 236,
      "question": "What problem does regularization solve in Machine Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Machine Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 237,
      "question": "What is an Neural Networks algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Neural Networks that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 238,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 239,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 240,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 241,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 242,
      "question": "What period in AI history is often referred to as the 'AI Winter'?",
      "options": [
        "The 1950s when AI research first began",
        "The periods in the 1970s and 1980s-90s when funding and interest in AI decreased",
        "The early 2000s before deep learning became popular",
        "The current period of AI development"
      ],
      "correctAnswer": 1,
      "explanation": "The term 'AI Winter' refers to periods (particularly in the 1970s and late 1980s through the 1990s) when funding and interest in AI research decreased due to disillusionment after initial high expectations weren't met."
    },
    {
      "id": 243,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 244,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Deep Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Deep Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 245,
      "question": "What problem does regularization solve in Reinforcement Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Reinforcement Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 246,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 247,
      "question": "What is a major challenge for AI implementation in Healthcare?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Healthcare is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 248,
      "question": "Which type of AI technology has shown the most promise in Finance?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Finance due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 249,
      "question": "How is AI currently being used in Transportation?",
      "options": [
        "To completely replace human workers in Transportation",
        "For administrative tasks only in Transportation",
        "To automate routine tasks and assist professionals in Transportation",
        "AI is not yet applicable to Transportation"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Transportation to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 250,
      "question": "What is a major challenge for AI implementation in Education?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Education is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 251,
      "question": "Which type of AI technology has shown the most promise in Entertainment?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Entertainment due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 252,
      "question": "How is AI currently being used in Agriculture?",
      "options": [
        "To completely replace human workers in Agriculture",
        "For administrative tasks only in Agriculture",
        "To automate routine tasks and assist professionals in Agriculture",
        "AI is not yet applicable to Agriculture"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Agriculture to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 253,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 254,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 255,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 256,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Machine Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Machine Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 257,
      "question": "What problem does regularization solve in Neural Networks models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Neural Networks adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 258,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 259,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 260,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 261,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 262,
      "question": "Which early AI program, developed in the mid-1960s, could engage in conversation with humans about psychological problems?",
      "options": [
        "SHRDLU",
        "MYCIN",
        "ELIZA",
        "Deep Blue"
      ],
      "correctAnswer": 2,
      "explanation": "ELIZA was an early natural language processing program created by Joseph Weizenbaum in the mid-1960s that simulated a psychotherapist by using pattern matching and substitution methods."
    },
    {
      "id": 263,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 264,
      "question": "What is an Deep Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Deep Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 265,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Reinforcement Learning?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Reinforcement Learning, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 266,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 267,
      "question": "How is AI currently being used in Healthcare?",
      "options": [
        "To completely replace human workers in Healthcare",
        "For administrative tasks only in Healthcare",
        "To automate routine tasks and assist professionals in Healthcare",
        "AI is not yet applicable to Healthcare"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Healthcare to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 268,
      "question": "What is a major challenge for AI implementation in Finance?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Finance is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 269,
      "question": "Which type of AI technology has shown the most promise in Transportation?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Transportation due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 270,
      "question": "How is AI currently being used in Education?",
      "options": [
        "To completely replace human workers in Education",
        "For administrative tasks only in Education",
        "To automate routine tasks and assist professionals in Education",
        "AI is not yet applicable to Education"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Education to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 271,
      "question": "What is a major challenge for AI implementation in Entertainment?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Entertainment is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 272,
      "question": "Which type of AI technology has shown the most promise in Agriculture?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Agriculture due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 273,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 274,
      "question": "What is 'AI alignment' referring to?",
      "options": [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      "correctAnswer": 0,
      "explanation": "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      "id": 275,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 276,
      "question": "What is a Machine Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Machine Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 277,
      "question": "Which evaluation metric is most appropriate for imbalanced datasets in Neural Networks?",
      "options": [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      "correctAnswer": 1,
      "explanation": "For imbalanced datasets in Neural Networks, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed."
    },
    {
      "id": 278,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 279,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 280,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 281,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 282,
      "question": "Who published the paper 'Computing Machinery and Intelligence' which proposed the Turing Test?",
      "options": [
        "John McCarthy",
        "Alan Turing",
        "Marvin Minsky",
        "Claude Shannon"
      ],
      "correctAnswer": 1,
      "explanation": "Alan Turing published the paper 'Computing Machinery and Intelligence' in 1950, which introduced what later became known as the Turing Test."
    },
    {
      "id": 283,
      "question": "AI Applications: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 284,
      "question": "What problem does regularization solve in Deep Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Deep Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 285,
      "question": "What is an Reinforcement Learning algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Reinforcement Learning that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 286,
      "question": "Expert Systems: What is the difference between supervised and unsupervised learning?",
      "options": [
        "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
        "Supervised learning is faster than unsupervised learning",
        "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
        "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
      ],
      "correctAnswer": 0,
      "explanation": "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
    },
    {
      "id": 287,
      "question": "Which type of AI technology has shown the most promise in Healthcare?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Healthcare due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 288,
      "question": "How is AI currently being used in Finance?",
      "options": [
        "To completely replace human workers in Finance",
        "For administrative tasks only in Finance",
        "To automate routine tasks and assist professionals in Finance",
        "AI is not yet applicable to Finance"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Finance to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 289,
      "question": "What is a major challenge for AI implementation in Transportation?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Transportation is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 290,
      "question": "Which type of AI technology has shown the most promise in Education?",
      "options": [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      "correctAnswer": 1,
      "explanation": "Machine learning algorithms have shown the most promise in Education due to their ability to analyze large datasets, identify patterns, and continuously improve over time."
    },
    {
      "id": 291,
      "question": "How is AI currently being used in Entertainment?",
      "options": [
        "To completely replace human workers in Entertainment",
        "For administrative tasks only in Entertainment",
        "To automate routine tasks and assist professionals in Entertainment",
        "AI is not yet applicable to Entertainment"
      ],
      "correctAnswer": 2,
      "explanation": "AI is being used in Entertainment to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely."
    },
    {
      "id": 292,
      "question": "What is a major challenge for AI implementation in Agriculture?",
      "options": [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      "correctAnswer": 1,
      "explanation": "A major challenge for AI implementation in Agriculture is data privacy and security concerns, as these applications often handle sensitive information that must be protected."
    },
    {
      "id": 293,
      "question": "What ethical concern is raised by AI-generated deepfakes?",
      "options": [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      "correctAnswer": 1,
      "explanation": "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    },
    {
      "id": 294,
      "question": "What is the 'black box problem' in AI ethics?",
      "options": [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      "correctAnswer": 1,
      "explanation": "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      "id": 295,
      "question": "Future of AI: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    },
    {
      "id": 296,
      "question": "What problem does regularization solve in Machine Learning models?",
      "options": [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      "correctAnswer": 1,
      "explanation": "Regularization in Machine Learning adds a penalty term to the loss function to prevent overfitting by discouraging complex models."
    },
    {
      "id": 297,
      "question": "What is an Neural Networks algorithm commonly used for classification tasks?",
      "options": [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      "correctAnswer": 2,
      "explanation": "Random Forest is a popular classification algorithm in Neural Networks that builds multiple decision trees and merges their predictions."
    },
    {
      "id": 298,
      "question": "Natural Language Processing: What is an activation function in neural networks?",
      "options": [
        "A function that initializes the neural network",
        "A function that determines whether a neuron should be active or not",
        "A function that transforms the output of a neuron, introducing non-linearity",
        "A function that activates the training process"
      ],
      "correctAnswer": 2,
      "explanation": "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
    },
    {
      "id": 299,
      "question": "Computer Vision: What is tokenization in NLP?",
      "options": [
        "Converting text into numerical tokens for machine learning models",
        "Breaking text into smaller units like words, phrases, or characters",
        "The process of securing text data using encryption tokens",
        "Removing punctuation and special characters from text"
      ],
      "correctAnswer": 1,
      "explanation": "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
    },
    {
      "id": 300,
      "question": "Robotics: What is algorithmic bias in AI?",
      "options": [
        "A programming error in the algorithm",
        "A deliberate feature to make AI systems more efficient",
        "When AI systems systematically and unfairly discriminate against certain individuals or groups",
        "The tendency of AI to prefer certain algorithms over others"
      ],
      "correctAnswer": 2,
      "explanation": "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
    }
  ],
  "flashcards": [
    {
      "id": 1,
      "front": "What is Artificial Intelligence?",
      "back": "The simulation of human intelligence in machines that are programmed to think and learn like humans."
    },
    {
      "id": 2,
      "front": "What's the difference between narrow AI and general AI?",
      "back": "Narrow AI is designed for a specific task (like facial recognition), while general AI would have broad human-like intelligence across many domains."
    },
    {
      "id": 3,
      "front": "What is Machine Learning?",
      "back": "A subset of AI that enables systems to learn and improve from experience without being explicitly programmed."
    },
    {
      "id": 4,
      "front": "What is the Turing Test?",
      "back": "A test proposed by Alan Turing in 1950 to determine if a machine can exhibit intelligent behavior indistinguishable from a human."
    },
    {
      "id": 5,
      "front": "What is a neural network?",
      "back": "A computational model inspired by the human brain, consisting of layers of interconnected nodes (neurons) that can learn patterns in data."
    },
    {
      "id": 6,
      "front": "What does 'training' mean in machine learning?",
      "back": "The process of feeding data to an algorithm so it can learn patterns and relationships, adjusting its internal parameters to improve performance."
    },
    {
      "id": 7,
      "front": "What is Natural Language Processing (NLP)?",
      "back": "The branch of AI that focuses on enabling computers to understand, interpret, generate, and respond to human language in a valuable way."
    },
    {
      "id": 8,
      "front": "What is Computer Vision?",
      "back": "The field of AI that enables computers to interpret and understand visual information from the world, such as images and videos."
    },
    {
      "id": 9,
      "front": "What is the primary goal of supervised learning?",
      "back": "To train a model on labeled data so it can learn to predict or classify new, unseen data accurately."
    },
    {
      "id": 10,
      "front": "What is a key ethical concern in AI development?",
      "back": "Several key concerns exist, including: bias and discrimination, privacy and surveillance, transparency, accountability, job displacement, and safety."
    }
  ]
}```

### ./src/learning/modules/js-basics.json

File path: `./src/learning/modules/js-basics.json`

```json
{
  "moduleId": "js-basics",
  "moduleName": "JavaScript Fundamentals",
  "description": "Learn the basics of modern JavaScript programming including variables, data types, functions, and control structures.",
  "category": "Programming",
  "difficulty": "beginner",
  "tags": ["javascript", "programming", "web development"],
  "createdAt": "2023-05-15T12:00:00Z",
  "updatedAt": "2023-05-15T12:00:00Z",
  "questions": [
    {
      "id": 1,
      "question": "Which keyword is used to declare a variable in modern JavaScript that can be reassigned?",
      "options": ["const", "var", "let", "function"],
      "correctAnswer": 2,
      "explanation": "The 'let' keyword declares a block-scoped variable that can be reassigned. 'const' variables cannot be reassigned, and 'var' is the older way to declare variables with function scope."
    },
    {
      "id": 2,
      "question": "Which of the following is NOT a primitive data type in JavaScript?",
      "options": ["string", "boolean", "array", "number"],
      "correctAnswer": 2,
      "explanation": "Array is not a primitive data type; it's a complex data type (object). The primitive data types in JavaScript are: string, number, boolean, null, undefined, symbol, and bigint."
    },
    {
      "id": 3,
      "question": "What is the output of: console.log(typeof []);",
      "options": ["array", "object", "undefined", "null"],
      "correctAnswer": 1,
      "explanation": "In JavaScript, arrays are actually objects, so typeof [] returns 'object'. This is one of JavaScript's quirks."
    },
    {
      "id": 4,
      "question": "How do you declare an arrow function that takes two parameters?",
      "options": [
        "function(a, b) => { return a + b; }",
        "(a, b) => { return a + b; }",
        "a, b => a + b",
        "=> (a, b) { return a + b; }"
      ],
      "correctAnswer": 1,
      "explanation": "Arrow functions are declared using the syntax: (parameters) => { function body }. For a single expression that's returned, you can omit the braces and 'return' keyword: (a, b) => a + b"
    },
    {
      "id": 5,
      "question": "What is the correct way to check if two variables have the same value and type?",
      "options": ["==", "===", "equals()", "is()"],
      "correctAnswer": 1,
      "explanation": "The strict equality operator (===) checks both value and type. The loose equality operator (==) only checks value and performs type conversion."
    },
    {
      "id": 6,
      "question": "What will console.log(2 + '2') output?",
      "options": ["4", "22", "NaN", "TypeError"],
      "correctAnswer": 1,
      "explanation": "When adding a number and a string, JavaScript converts the number to a string and performs string concatenation, resulting in '22'."
    },
    {
      "id": 7,
      "question": "Which method is used to add elements to the end of an array?",
      "options": ["push()", "pop()", "shift()", "unshift()"],
      "correctAnswer": 0,
      "explanation": "The push() method adds elements to the end of an array. pop() removes from the end, shift() removes from the beginning, and unshift() adds to the beginning."
    },
    {
      "id": 8,
      "question": "What's the purpose of the 'async' keyword in a function declaration?",
      "options": [
        "Makes the function run faster",
        "Indicates the function returns a Promise",
        "Prevents the function from being called",
        "Makes the function run in a separate thread"
      ],
      "correctAnswer": 1,
      "explanation": "The 'async' keyword indicates that a function returns a Promise. It allows the use of 'await' inside the function to pause execution until a Promise resolves."
    },
    {
      "id": 9,
      "question": "Which method is used to execute code after a specified delay?",
      "options": ["setTimeout()", "setInterval()", "wait()", "delay()"],
      "correctAnswer": 0,
      "explanation": "setTimeout() executes code once after a specified delay. setInterval() executes code repeatedly at specified intervals."
    },
    {
      "id": 10,
      "question": "How do you convert a JSON string to a JavaScript object?",
      "options": ["JSON.stringify()", "JSON.parse()", "JSON.toObject()", "JSON.decode()"],
      "correctAnswer": 1,
      "explanation": "JSON.parse() converts a JSON string to a JavaScript object. JSON.stringify() does the opposite, converting an object to a JSON string."
    },
    {
      "id": 11,
      "question": "What will be the value of x? let x = 10; x += 5;",
      "options": ["10", "5", "15", "undefined"],
      "correctAnswer": 2,
      "explanation": "The += operator adds the right operand to the left operand and assigns the result to the left operand. So x += 5 is equivalent to x = x + 5, resulting in 15."
    },
    {
      "id": 12,
      "question": "Which statement is used to stop the execution of a loop?",
      "options": ["stop", "exit", "return", "break"],
      "correctAnswer": 3,
      "explanation": "The 'break' statement is used to exit a loop immediately. 'return' exits the entire function, and 'exit' and 'stop' are not valid JavaScript statements for this purpose."
    },
    {
      "id": 13,
      "question": "What is a closure in JavaScript?",
      "options": [
        "A way to close browser windows",
        "A function that has access to variables in its outer lexical environment",
        "A method to end program execution",
        "A security feature that prevents code injection"
      ],
      "correctAnswer": 1,
      "explanation": "A closure is a function that has access to variables from its outer (enclosing) scope, even after the outer function has returned."
    },
    {
      "id": 14,
      "question": "What is the output of: console.log(1 == '1')?",
      "options": ["true", "false", "undefined", "TypeError"],
      "correctAnswer": 0,
      "explanation": "The loose equality operator (==) performs type conversion. When comparing a number and a string, it converts the string to a number, so 1 == '1' evaluates to true."
    },
    {
      "id": 15,
      "question": "What is the purpose of the 'this' keyword in JavaScript?",
      "options": [
        "To reference the current file",
        "To reference the current function",
        "To reference the current object",
        "To reference a variable named 'this'"
      ],
      "correctAnswer": 2,
      "explanation": "The 'this' keyword refers to the object it belongs to or the object that's currently calling the method. Its value depends on how a function is called."
    }
  ],
  "flashcards": [
    {
      "id": 1,
      "front": "What are the primitive data types in JavaScript?",
      "back": "string, number, boolean, null, undefined, symbol, and bigint"
    },
    {
      "id": 2,
      "front": "What's the difference between let and const?",
      "back": "let declares variables that can be reassigned, while const declares variables that cannot be reassigned after initialization."
    },
    {
      "id": 3,
      "front": "What is an arrow function?",
      "back": "A shorthand way to write functions in JavaScript, introduced in ES6. Syntax: (params) => { statements }"
    },
    {
      "id": 4,
      "front": "What is the difference between == and ===?",
      "back": "== compares values after type conversion (loose equality), while === compares both values and types without conversion (strict equality)."
    },
    {
      "id": 5,
      "front": "What is a Promise in JavaScript?",
      "back": "An object representing the eventual completion or failure of an asynchronous operation, allowing you to handle the result when it becomes available."
    },
    {
      "id": 6,
      "front": "How do you handle errors in JavaScript?",
      "back": "Using try/catch blocks: try { // code that might throw an error } catch (error) { // handle the error }"
    },
    {
      "id": 7,
      "front": "What is the DOM?",
      "back": "The Document Object Model (DOM) is a programming interface for web documents. It represents the page as nodes and objects that can be manipulated with JavaScript."
    },
    {
      "id": 8,
      "front": "What is a JavaScript callback function?",
      "back": "A function passed as an argument to another function, to be executed later or after some event or condition occurs."
    },
    {
      "id": 9,
      "front": "What is JSON?",
      "back": "JavaScript Object Notation (JSON) is a lightweight data-interchange format. It's a text format that's easy for humans to read and write and easy for machines to parse and generate."
    },
    {
      "id": 10,
      "front": "What does the 'use strict' directive do?",
      "back": "It enables strict mode, which catches common coding mistakes and prevents some unsafe actions. It helps write cleaner code and prevents the use of undeclared variables."
    },
    {
      "id": 11,
      "front": "How do you add an element to the beginning of an array?",
      "back": "Using the unshift() method: array.unshift(element)"
    },
    {
      "id": 12,
      "front": "What is hoisting in JavaScript?",
      "back": "A behavior where variable and function declarations are moved to the top of their containing scope during compilation, allowing them to be used before they're actually declared in the code."
    }
  ]
} ```

### ./src/learning/modules/tauros-module1.json

File path: `./src/learning/modules/tauros-module1.json`

```json
{
  "moduleId": "tauros-module1",
  "moduleName": "Tauros Module 1: Project Basics",
  "description": "Learn the fundamentals of the Tauros project, including goals, prompt formats, and requirements.",
  "category": "Tauros",
  "difficulty": "beginner",
  "tags": ["tauros", "introduction", "prompts"],
  "coverImage": "/assets/tauros-logo.jpg",
  "createdAt": "2025-05-07T19:30:00Z",
  "updatedAt": "2025-05-07T19:30:00Z",
  "questions": [
    {
      "id": 1,
      "question": "What is the main goal of the Tauros project?",
      "options": [
        "To test if the model can answer trivia questions",
        "To train a vision-language model to generate or edit UI code using screenshots and natural language instructions",
        "To design mobile apps from scratch",
        "To create animations and transitions using AI"
      ],
      "correctAnswer": 1,
      "explanation": "The Tauros project is focused on training a model that can understand screenshots and natural language prompts to generate or edit user interface code, not just answer trivia, design apps from scratch, or create animations.",
      "type": "multiple-choice",
      "difficulty": "easy",
      "tags": ["project-goal", "basics"]
    },
    {
      "id": 2,
      "question": "Which of the following is an acceptable prompt format in Tauros?",
      "options": [
        "Only text that says 'Make this look good'",
        "Depending on the type, an image and text that says 'write code using Python'",
        "A screenshot and a brief description of any changes that you would like the model to make",
        "A single image with no explanation. The model will replicate the webpage."
      ],
      "correctAnswer": 2,
      "explanation": "The only acceptable prompt format in Tauros is to provide a screenshot and a brief description of the changes you want. Prompts must be clear, specific, and based on English-language websites.",
      "type": "multiple-choice",
      "difficulty": "easy",
      "tags": ["prompts", "format"]
    },
    {
      "id": 3,
      "question": "What is the purpose of the rewritten response in a Tauros task?",
      "options": [
        "To make small cosmetic changes to the model's reasoning",
        "To improve or correct the model's output so it fully matches the prompt and image",
        "To translate the code into another programming language",
        "To test if the model can guess the correct layout"
      ],
      "correctAnswer": 1,
      "explanation": "The rewritten response is meant to fix or upgrade the model's output so it aligns perfectly with the prompt and the expected UI, not just make minor tweaks or translations.",
      "type": "multiple-choice",
      "difficulty": "medium",
      "tags": ["response", "methodology"]
    },
    {
      "id": 4,
      "question": "How many simple visual changes should be requested in a prompt?",
      "options": [
        "3",
        "4",
        "5",
        "6"
      ],
      "correctAnswer": 2,
      "explanation": "According to the prompt guidelines, you should request 5 simple visual changes in your prompt.",
      "type": "multiple-choice",
      "difficulty": "easy",
      "tags": ["prompts", "guidelines"]
    },
    {
      "id": 5,
      "question": "How many functionality changes should be requested in a prompt?",
      "options": [
        "1",
        "2",
        "3",
        "4"
      ],
      "correctAnswer": 1,
      "explanation": "According to the prompt guidelines, you should request 2 functionality changes in your prompt.",
      "type": "multiple-choice",
      "difficulty": "easy",
      "tags": ["prompts", "guidelines"]
    },
    {
      "id": 6,
      "question": "How many dynamic/interactive state changes should be requested in a prompt?",
      "options": [
        "1",
        "2",
        "3",
        "4"
      ],
      "correctAnswer": 1,
      "explanation": "According to the prompt guidelines, you should request 2 dynamic/interactive state changes in your prompt.",
      "type": "multiple-choice",
      "difficulty": "easy",
      "tags": ["prompts", "guidelines"]
    },
    {
      "id": 7,
      "question": "Which of the following is NOT an approved category for prompts?",
      "options": [
        "Travel",
        "Finance",
        "Blockchain",
        "Health"
      ],
      "correctAnswer": 2,
      "explanation": "Blockchain is not listed as an approved category in the MODULE1 materials. The approved categories include Travel, Finance, Health, Education, and many others.",
      "type": "multiple-choice",
      "difficulty": "medium",
      "tags": ["categories", "guidelines"]
    },
    {
      "id": 8,
      "question": "What is a characteristic of a strong prompt?",
      "options": [
        "Using non-English websites as references",
        "Being too easy for the model to complete",
        "Being unique and challenging",
        "Requesting only visual changes"
      ],
      "correctAnswer": 2,
      "explanation": "Strong prompts are unique, challenging, and fit the assigned category while using screenshots from modern, English websites.",
      "type": "multiple-choice",
      "difficulty": "medium",
      "tags": ["prompts", "quality"]
    },
    {
      "id": 9,
      "question": "What is a simple visual change?",
      "options": [
        "Adding a new section to the website",
        "Implementing a hover effect",
        "Changing the background color",
        "Adding a cart component with state"
      ],
      "correctAnswer": 2,
      "explanation": "Simple visual changes are small, surface-level tweaks like font changes, background color, and simple text edits.",
      "type": "multiple-choice",
      "difficulty": "easy",
      "tags": ["prompts", "changes"]
    },
    {
      "id": 10,
      "question": "What is a functional change?",
      "options": [
        "Changing the font color",
        "Adding a new button or form",
        "Simple text edits",
        "Changing background images"
      ],
      "correctAnswer": 1,
      "explanation": "Functional changes affect how the site works, such as adding buttons, forms, new sections, and hover effects.",
      "type": "multiple-choice",
      "difficulty": "easy",
      "tags": ["prompts", "changes"]
    }
  ],
  "flashcards": [
    {
      "id": 1,
      "front": "What is the main goal of the Tauros project?",
      "back": "To train a vision-language model to generate or edit UI code using screenshots and natural language instructions.",
      "tags": ["project-goal", "basics"]
    },
    {
      "id": 2,
      "front": "What is the acceptable prompt format in Tauros?",
      "back": "A screenshot and a brief description of any changes that you would like the model to make.",
      "tags": ["prompts", "format"]
    },
    {
      "id": 3,
      "front": "How many simple visual changes should be requested in a prompt?",
      "back": "5 simple visual changes",
      "tags": ["prompts", "guidelines"]
    },
    {
      "id": 4,
      "front": "How many functionality changes should be requested in a prompt?",
      "back": "2 functionality changes",
      "tags": ["prompts", "guidelines"]
    },
    {
      "id": 5,
      "front": "How many dynamic/interactive state changes should be requested in a prompt?",
      "back": "2 dynamic/interactive state changes",
      "tags": ["prompts", "guidelines"]
    },
    {
      "id": 6,
      "front": "What is a simple visual change?",
      "back": "Small, surface-level tweaks like font changes, background color, and simple text edits.",
      "tags": ["prompts", "changes"]
    },
    {
      "id": 7,
      "front": "What is a functional change?",
      "back": "Changes that affect how the site works, such as adding buttons, forms, new sections, and hover effects.",
      "tags": ["prompts", "changes"]
    },
    {
      "id": 8,
      "front": "What is a strong prompt?",
      "back": "A prompt that is unique, challenging, fits the assigned category, and uses screenshots from modern, English websites.",
      "tags": ["prompts", "quality"]
    }
  ]
} ```

### ./src/learning/schema.json

File path: `./src/learning/schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Learning Module Schema",
  "description": "Schema for learning modules in the study app",
  "type": "object",
  "required": ["moduleId", "moduleName", "questions"],
  "properties": {
    "moduleId": {
      "type": "string",
      "description": "Unique identifier for the module"
    },
    "moduleName": {
      "type": "string",
      "description": "Display name for the module"
    },
    "description": {
      "type": "string",
      "description": "Brief description of the module content"
    },
    "category": {
      "type": "string",
      "description": "Category to group related modules"
    },
    "difficulty": {
      "type": "string",
      "enum": ["beginner", "intermediate", "advanced"],
      "description": "Difficulty level of the module"
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Tags for search and categorization"
    },
    "coverImage": {
      "type": "string",
      "description": "Path to the module's cover image (optional)"
    },
    "questions": {
      "type": "array",
      "description": "List of questions for this module (required)",
      "minItems": 1,
      "items": {
        "type": "object",
        "required": ["id", "question", "options", "correctAnswer"],
        "properties": {
          "id": {
            "type": "integer",
            "description": "Unique identifier for the question"
          },
          "question": {
            "type": "string",
            "description": "The question text"
          },
          "options": {
            "type": "array",
            "description": "List of possible answers",
            "minItems": 2,
            "items": {
              "type": "string"
            }
          },
          "correctAnswer": {
            "type": "integer",
            "description": "Index of the correct answer in the options array (0-based)"
          },
          "explanation": {
            "type": "string",
            "description": "Explanation of the correct answer (optional but recommended)"
          },
          "image": {
            "type": "string",
            "description": "Path to an image associated with this question (optional)"
          },
          "difficulty": {
            "type": "string",
            "enum": ["easy", "medium", "hard"],
            "description": "Difficulty level of this specific question (optional)"
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Tags specific to this question (optional)"
          },
          "type": {
            "type": "string",
            "enum": ["multiple-choice", "true-false", "fill-in"],
            "default": "multiple-choice",
            "description": "Type of question (defaults to multiple-choice)"
          }
        }
      }
    },
    "flashcards": {
      "type": "array",
      "description": "List of flashcards for this module (optional)",
      "items": {
        "type": "object",
        "required": ["id", "front", "back"],
        "properties": {
          "id": {
            "type": "integer",
            "description": "Unique identifier for the flashcard"
          },
          "front": {
            "type": "string",
            "description": "Content for the front of the flashcard"
          },
          "back": {
            "type": "string",
            "description": "Content for the back of the flashcard"
          },
          "image": {
            "type": "string",
            "description": "Path to an image associated with this flashcard (optional)"
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Tags specific to this flashcard (optional)"
          }
        }
      }
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Creation date of the module"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Last update date of the module"
    }
  }
} ```

### ./src/learning/templates/example-module.json

File path: `./src/learning/templates/example-module.json`

```json
{
  "moduleId": "example-module",
  "moduleName": "Example Module - Getting Started",
  "description": "A simple example module showing the minimum required fields.",
  "category": "Examples",
  "difficulty": "beginner",
  "tags": ["example", "tutorial"],
  "questions": [
    {
      "id": 1,
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Madrid"],
      "correctAnswer": 1,
      "explanation": "Paris is the capital and most populous city of France."
    },
    {
      "id": 2,
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "22"],
      "correctAnswer": 1,
      "explanation": "The sum of 2 and 2 is 4."
    },
    {
      "id": 3,
      "question": "Which planet is known as the Red Planet?",
      "options": ["Venus", "Jupiter", "Mars", "Saturn"],
      "correctAnswer": 2,
      "explanation": "Mars is often called the Red Planet due to its reddish appearance."
    }
  ],
  "flashcards": [
    {
      "id": 1,
      "front": "What is the capital of France?",
      "back": "Paris"
    },
    {
      "id": 2,
      "front": "What is 2 + 2?",
      "back": "4"
    },
    {
      "id": 3,
      "front": "Which planet is known as the Red Planet?",
      "back": "Mars"
    }
  ]
}
```

### ./src/learning/templates/module-template.json

File path: `./src/learning/templates/module-template.json`

```json
{
  "moduleId": "your-module-id",
  "moduleName": "Your Module Name",
  "description": "A brief description of this module and what it covers.",
  "category": "Category Name",
  "difficulty": "beginner",
  "tags": ["tag1", "tag2", "tag3"],
  "coverImage": "/assets/your-cover-image.jpg",
  "questions": [
    {
      "id": 1,
      "question": "Your first question goes here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Explanation for why Option 1 is correct.",
      "type": "multiple-choice",
      "difficulty": "easy",
      "tags": ["concept1", "basics"]
    },
    {
      "id": 2,
      "question": "Your second question goes here?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 1,
      "explanation": "Explanation for why Option 2 is correct.",
      "type": "multiple-choice",
      "difficulty": "medium",
      "tags": ["concept2"]
    }
  ],
  "flashcards": [
    {
      "id": 1,
      "front": "Question or concept on front side",
      "back": "Answer or explanation on back side",
      "tags": ["concept1", "basics"]
    },
    {
      "id": 2,
      "front": "Another question or concept",
      "back": "Another answer or explanation",
      "tags": ["concept2"]
    }
  ]
}
```

## Utility Scripts

### ./src/scripts/dev-simulator.js

File path: `./src/scripts/dev-simulator.js`

```javascript
#!/usr/bin/env node

/**
 * Development Simulator
 * 
 * This script simulates user activity by:
 * 1. Generating random user IDs
 * 2. Randomly answering questions from selected modules
 * 3. Creating simulated quiz sessions
 * 
 * This helps quickly populate the system with test data for development purposes.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Paths
const MODULES_DIR = path.join(__dirname, '..', 'learning', 'modules');
const MODULES_INDEX = path.join(MODULES_DIR, 'index.json');

// Helper function to read JSON file
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// Helper function to save JSON file
function saveJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

// Generate a random user ID
function generateRandomUserId() {
  return `sim_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Randomly answer a question
function answerRandomly(question) {
  const randomIndex = Math.floor(Math.random() * question.options.length);
  const isCorrect = randomIndex === question.correctAnswer;
  return {
    userAnswer: randomIndex,
    correct: isCorrect
  };
}

// Simulate a quiz session for a module
function simulateQuizSession(moduleId, userId, options = {}) {
  const modulePath = path.join(MODULES_DIR, `${moduleId}.json`);
  const moduleData = readJsonFile(modulePath);
  
  if (!moduleData || !moduleData.questions || moduleData.questions.length === 0) {
    console.error(`No questions found in module ${moduleId}`);
    return null;
  }

  // Initialize user progress data if it doesn't exist
  const userProgressFile = path.join(__dirname, '..', 'data', `progress_${userId}.json`);
  let userProgress;

  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(userProgressFile)) {
      userProgress = readJsonFile(userProgressFile);
    } else {
      userProgress = {
        userId,
        modules: {},
        answeredQuestions: {},
        quizHistory: [],
        totalCorrect: 0,
        totalAnswered: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error initializing user progress:', error);
    userProgress = {
      userId,
      modules: {},
      answeredQuestions: {},
      quizHistory: [],
      totalCorrect: 0,
      totalAnswered: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }

  // Initialize module tracking if it doesn't exist
  if (!userProgress.modules[moduleId]) {
    userProgress.modules[moduleId] = {
      started: new Date().toISOString(),
      questionsAnswered: 0,
      correctAnswers: 0,
      lastAnswered: null,
      completed: false
    };
  }

  // Get questions to answer
  let questionsToAnswer = moduleData.questions;
  
  // If questionCount is specified, pick that many random questions
  if (options.questionCount && options.questionCount < questionsToAnswer.length) {
    questionsToAnswer = [...questionsToAnswer]
      .sort(() => Math.random() - 0.5)
      .slice(0, options.questionCount);
  }
  
  // Explicitly handle batch size if specified (for testing batch limits)
  if (options.batchSize && options.batchSize > 0) {
    // If specific batch size is provided, use that instead
    if (questionsToAnswer.length > options.batchSize) {
      questionsToAnswer = questionsToAnswer.slice(0, options.batchSize);
      console.log(`Applied batch size limit: ${options.batchSize} questions`);
    }
  }

  // Create session object
  const quizSession = {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    moduleId: moduleId,
    startTime: new Date().toISOString(),
    questions: questionsToAnswer,
    totalQuestions: questionsToAnswer.length,
    answers: {},
    completed: false
  };

  // Answer all questions randomly
  let correctCount = 0;

  console.log(`\nSimulating answers for ${questionsToAnswer.length} questions in module ${moduleData.moduleName}:`);
  questionsToAnswer.forEach((question, index) => {
    const answer = answerRandomly(question);
    
    // Store answer in session
    quizSession.answers[question.id] = {
      questionId: question.id,
      userAnswer: answer.userAnswer,
      correct: answer.correct,
      answeredAt: new Date().toISOString()
    };

    // Update user progress
    userProgress.answeredQuestions[question.id] = {
      moduleId,
      userAnswer: answer.userAnswer,
      correct: answer.correct,
      answeredAt: new Date().toISOString(),
      attemptCount: (userProgress.answeredQuestions[question.id]?.attemptCount || 0) + 1
    };

    // Update module statistics
    const moduleStats = userProgress.modules[moduleId];
    moduleStats.questionsAnswered++;
    if (answer.correct) {
      moduleStats.correctAnswers++;
      correctCount++;
    }
    moduleStats.lastAnswered = new Date().toISOString();

    // Update overall statistics
    userProgress.totalAnswered++;
    if (answer.correct) {
      userProgress.totalCorrect++;
    }

    // Log progress
    process.stdout.write(`${index + 1}/${questionsToAnswer.length} ${answer.correct ? '✓' : '✗'} `);
    if ((index + 1) % 10 === 0) process.stdout.write('\n');
  });
  
  // Mark quiz as completed
  quizSession.completed = true;
  quizSession.endTime = new Date().toISOString();
  
  // Calculate score
  const score = (correctCount / questionsToAnswer.length) * 100;
  
  // Create quiz history entry
  const quizRecord = {
    sessionId: quizSession.sessionId,
    moduleId: moduleId,
    startTime: quizSession.startTime,
    endTime: quizSession.endTime,
    totalQuestions: questionsToAnswer.length,
    correctAnswers: correctCount,
    score: score
  };
  
  // Add to quiz history
  userProgress.quizHistory.push(quizRecord);
  
  // Check if module is completed (80% or more correct answers)
  if (score >= 80) {
    userProgress.modules[moduleId].completed = true;
    userProgress.modules[moduleId].completedAt = new Date().toISOString();
  }
  
  // Update last updated timestamp
  userProgress.lastUpdated = new Date().toISOString();
  
  // Save user progress
  saveJsonFile(userProgressFile, userProgress);
  
  console.log(`\n\nQuiz session completed for user ${userId}:`);
  console.log(`- Module: ${moduleData.moduleName}`);
  console.log(`- Questions: ${questionsToAnswer.length}`);
  console.log(`- Correct answers: ${correctCount}`);
  console.log(`- Score: ${score.toFixed(2)}%`);
  console.log(`- Progress saved to: ${userProgressFile}`);
  
  return userProgress;
}

// List all available modules
function listAvailableModules() {
  const indexData = readJsonFile(MODULES_INDEX);
  
  if (!indexData || !indexData.modules || indexData.modules.length === 0) {
    console.error('No modules found');
    return [];
  }
  
  console.log('\nAvailable modules:');
  indexData.modules.forEach((module, index) => {
    console.log(`${index + 1}. ${module.moduleName} (${module.moduleId}) - ${module.questionCount} questions`);
  });
  
  return indexData.modules;
}

// Main function to run the simulator
async function runSimulator() {
  console.log('📚 Study Game - Development Simulator 🧪\n');
  
  const modules = listAvailableModules();
  
  if (modules.length === 0) {
    console.error('No modules available to simulate');
    process.exit(1);
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Ask which module to simulate
  const askModule = () => {
    return new Promise((resolve) => {
      rl.question('\nEnter the number of the module to simulate (or "all" for all modules): ', (answer) => {
        if (answer.toLowerCase() === 'all') {
          resolve('all');
        } else {
          const moduleIndex = parseInt(answer, 10) - 1;
          if (isNaN(moduleIndex) || moduleIndex < 0 || moduleIndex >= modules.length) {
            console.log('Invalid selection. Please try again.');
            resolve(askModule());
          } else {
            resolve(modules[moduleIndex].moduleId);
          }
        }
      });
    });
  };
  
  // Ask how many questions to simulate
  const askQuestionCount = (moduleId) => {
    return new Promise((resolve) => {
      let maxQuestions;
      
      if (moduleId === 'all') {
        maxQuestions = modules.reduce((sum, module) => sum + module.questionCount, 0);
      } else {
        const selectedModule = modules.find(m => m.moduleId === moduleId);
        maxQuestions = selectedModule.questionCount;
      }
      
      rl.question(`\nHow many questions to simulate? (1-${maxQuestions}, "all" for all questions): `, (answer) => {
        if (answer.toLowerCase() === 'all') {
          resolve(0); // 0 means all questions
        } else {
          const count = parseInt(answer, 10);
          if (isNaN(count) || count < 1 || count > maxQuestions) {
            console.log(`Invalid number. Please enter a number between 1 and ${maxQuestions}.`);
            resolve(askQuestionCount(moduleId));
          } else {
            resolve(count);
          }
        }
      });
    });
  };
  
  // Ask for batch size to simulate
  const askBatchSize = () => {
    return new Promise((resolve) => {
      rl.question('\nSpecify batch size to simulate? (5, 10, 20, etc. or "0" for no batch limit): ', (answer) => {
        const batchSize = parseInt(answer, 10);
        if (isNaN(batchSize) || batchSize < 0) {
          console.log('Invalid batch size. Please enter a number greater than or equal to 0.');
          resolve(askBatchSize());
        } else {
          resolve(batchSize);
        }
      });
    });
  };
  
  // Execute simulation
  try {
    const moduleId = await askModule();
    const questionCount = await askQuestionCount(moduleId);
    const batchSize = await askBatchSize();
    
    // Generate a random user ID
    const userId = generateRandomUserId();
    console.log(`\nSimulating with user ID: ${userId}`);
    
    if (moduleId === 'all') {
      // Simulate all modules
      for (const module of modules) {
        // Calculate per-module question count
        let moduleQuestionCount = 0;
        if (questionCount > 0) {
          // Distribute questions proportionally across modules
          const proportion = module.questionCount / modules.reduce((sum, m) => sum + m.questionCount, 0);
          moduleQuestionCount = Math.max(1, Math.round(questionCount * proportion));
        }
        
        await simulateQuizSession(module.moduleId, userId, { 
          questionCount: moduleQuestionCount,
          batchSize: batchSize
        });
      }
    } else {
      // Simulate single module
      await simulateQuizSession(moduleId, userId, { 
        questionCount: questionCount || 0,
        batchSize: batchSize
      });
    }
    
    console.log('\nSimulation completed successfully!');
    console.log('\nTo use this simulated user data:');
    console.log(`1. Open the browser console and run: localStorage.setItem('currentUserId', '${userId}')`);
    console.log('2. Refresh the page to see the simulated progress');
    console.log('\nFor more information, see scripts/DEV_TOOLS_README.md for detailed instructions.');
  } catch (error) {
    console.error('Error during simulation:', error);
  } finally {
    rl.close();
  }
}

// Run the simulator
runSimulator(); ```

### ./src/scripts/generate-ai-questions.js

File path: `./src/scripts/generate-ai-questions.js`

```javascript
#!/usr/bin/env node

/**
 * Script to generate additional AI questions and append them to the intro-to-ai.json module
 * 
 * This script generates a set of predefined questions about AI concepts
 * and appends them to the existing intro-to-ai.json file to reach 300 questions.
 */

const fs = require('fs');
const path = require('path');

// Path to the module file
const modulePath = path.join(__dirname, '..', 'learning', 'modules', 'intro-to-ai.json');

// Check if the module file exists
if (!fs.existsSync(modulePath)) {
  console.error('Error: intro-to-ai.json module file not found!');
  process.exit(1);
}

// Read the existing module file
let moduleData;
try {
  const fileContent = fs.readFileSync(modulePath, 'utf8');
  moduleData = JSON.parse(fileContent);
} catch (error) {
  console.error('Error reading or parsing the module file:', error);
  process.exit(1);
}

// Get the current number of questions
const currentQuestionCount = moduleData.questions ? moduleData.questions.length : 0;
console.log(`Current question count: ${currentQuestionCount}`);

// Define how many more questions we need
const targetQuestionCount = 300;
const questionsToAdd = targetQuestionCount - currentQuestionCount;

if (questionsToAdd <= 0) {
  console.log('The module already has the target number of questions.');
  process.exit(0);
}

console.log(`Generating ${questionsToAdd} additional questions...`);

// Template questions about different AI topics
const questionTemplates = [
  // Machine Learning basics
  {
    question: "What is the difference between supervised and unsupervised learning?",
    options: [
      "Supervised learning requires labeled data, while unsupervised learning works with unlabeled data",
      "Supervised learning is faster than unsupervised learning",
      "Supervised learning uses neural networks, while unsupervised learning uses decision trees",
      "Supervised learning is for classification tasks only, while unsupervised learning is for regression tasks only"
    ],
    correctAnswer: 0,
    explanation: "Supervised learning algorithms are trained using labeled data, where the desired output is known. Unsupervised learning algorithms work with unlabeled data and try to find patterns or structure in the data without predefined outputs."
  },
  {
    question: "What is overfitting in machine learning?",
    options: [
      "When a model performs perfectly on all datasets",
      "When a model learns the training data too well, including noise and outliers, reducing its performance on new data",
      "When a model is too complex to be trained efficiently",
      "When a model is trained for too many iterations"
    ],
    correctAnswer: 1,
    explanation: "Overfitting occurs when a model learns the training data too well, capturing noise and outliers rather than just the underlying pattern. This reduces its ability to generalize to new, unseen data."
  },
  // Neural Networks
  {
    question: "What is an activation function in neural networks?",
    options: [
      "A function that initializes the neural network",
      "A function that determines whether a neuron should be active or not",
      "A function that transforms the output of a neuron, introducing non-linearity",
      "A function that activates the training process"
    ],
    correctAnswer: 2,
    explanation: "An activation function in neural networks transforms the weighted sum of inputs into an output value. It introduces non-linearity, allowing the network to learn complex patterns and relationships in the data."
  },
  // Natural Language Processing
  {
    question: "What is tokenization in NLP?",
    options: [
      "Converting text into numerical tokens for machine learning models",
      "Breaking text into smaller units like words, phrases, or characters",
      "The process of securing text data using encryption tokens",
      "Removing punctuation and special characters from text"
    ],
    correctAnswer: 1,
    explanation: "Tokenization is the process of breaking text into smaller units called tokens, such as words, phrases, symbols, or other elements, to facilitate text analysis and processing in NLP."
  },
  // AI Ethics
  {
    question: "What is algorithmic bias in AI?",
    options: [
      "A programming error in the algorithm",
      "A deliberate feature to make AI systems more efficient",
      "When AI systems systematically and unfairly discriminate against certain individuals or groups",
      "The tendency of AI to prefer certain algorithms over others"
    ],
    correctAnswer: 2,
    explanation: "Algorithmic bias occurs when an AI system systematically and unfairly discriminates against certain individuals or groups. This can happen due to biased training data, flawed algorithm design, or inappropriate use of AI systems."
  }
];

// Generate the additional questions
const newQuestions = [];
let nextId = currentQuestionCount + 1;

// Categories for generating diverse questions
const categories = [
  "Machine Learning",
  "Neural Networks",
  "Natural Language Processing",
  "Computer Vision",
  "Robotics",
  "AI Ethics",
  "AI History",
  "AI Applications",
  "Deep Learning",
  "Reinforcement Learning",
  "Expert Systems",
  "AI in Healthcare",
  "AI in Finance",
  "AI in Transportation",
  "AI in Education",
  "AI in Entertainment",
  "AI in Agriculture",
  "AI and Privacy",
  "AI and Security",
  "Future of AI"
];

// Functions to generate AI-related questions
function generateMLQuestion(id, category) {
  const questions = [
    {
      question: `What is ${category === "Machine Learning" ? "a" : "an"} ${category} algorithm commonly used for classification tasks?`,
      options: [
        "K-means",
        "Linear Regression",
        "Random Forest",
        "Principal Component Analysis"
      ],
      correctAnswer: 2,
      explanation: `Random Forest is a popular classification algorithm in ${category} that builds multiple decision trees and merges their predictions.`
    },
    {
      question: `Which evaluation metric is most appropriate for imbalanced datasets in ${category}?`,
      options: [
        "Accuracy",
        "Precision-Recall curve",
        "Mean Squared Error",
        "R-squared"
      ],
      correctAnswer: 1,
      explanation: `For imbalanced datasets in ${category}, precision-recall curves are more informative than accuracy, as accuracy can be misleading when class distributions are skewed.`
    },
    {
      question: `What problem does regularization solve in ${category} models?`,
      options: [
        "Underfitting",
        "Overfitting",
        "Slow convergence",
        "Model interpretability"
      ],
      correctAnswer: 1,
      explanation: `Regularization in ${category} adds a penalty term to the loss function to prevent overfitting by discouraging complex models.`
    }
  ];
  
  const selectedQuestion = questions[id % questions.length];
  return {
    id,
    question: selectedQuestion.question,
    options: selectedQuestion.options,
    correctAnswer: selectedQuestion.correctAnswer,
    explanation: selectedQuestion.explanation
  };
}

function generateEthicsQuestion(id) {
  const questions = [
    {
      question: "What is the 'black box problem' in AI ethics?",
      options: [
        "When an AI system crashes unexpectedly",
        "When AI algorithms make decisions that cannot be easily explained or understood by humans",
        "When AI systems are developed using proprietary technology",
        "When AI systems have security vulnerabilities"
      ],
      correctAnswer: 1,
      explanation: "The 'black box problem' refers to the lack of transparency in AI systems where their decision-making processes are not easily explainable or interpretable by humans."
    },
    {
      question: "What is 'AI alignment' referring to?",
      options: [
        "Making sure AI systems' objectives and values align with human objectives and values",
        "Aligning multiple AI systems to work together",
        "Ensuring AI code follows programming standards",
        "Correcting hardware alignment in AI systems"
      ],
      correctAnswer: 0,
      explanation: "AI alignment refers to ensuring that AI systems' objectives and values align with human objectives and values, to prevent unintended consequences from misaligned goals."
    },
    {
      question: "What ethical concern is raised by AI-generated deepfakes?",
      options: [
        "High computational requirements",
        "Potential for misinformation and manipulation",
        "Copyright violations",
        "Lack of artistic quality"
      ],
      correctAnswer: 1,
      explanation: "Deepfakes raise serious ethical concerns about misinformation, as they can be used to create convincing fake content of real people, potentially damaging reputations or spreading false information."
    }
  ];
  
  const selectedQuestion = questions[id % questions.length];
  return {
    id,
    question: selectedQuestion.question,
    options: selectedQuestion.options,
    correctAnswer: selectedQuestion.correctAnswer,
    explanation: selectedQuestion.explanation
  };
}

function generateHistoryQuestion(id) {
  const questions = [
    {
      question: "Who published the paper 'Computing Machinery and Intelligence' which proposed the Turing Test?",
      options: [
        "John McCarthy",
        "Alan Turing",
        "Marvin Minsky",
        "Claude Shannon"
      ],
      correctAnswer: 1,
      explanation: "Alan Turing published the paper 'Computing Machinery and Intelligence' in 1950, which introduced what later became known as the Turing Test."
    },
    {
      question: "Which early AI program, developed in the mid-1960s, could engage in conversation with humans about psychological problems?",
      options: [
        "SHRDLU",
        "MYCIN",
        "ELIZA",
        "Deep Blue"
      ],
      correctAnswer: 2,
      explanation: "ELIZA was an early natural language processing program created by Joseph Weizenbaum in the mid-1960s that simulated a psychotherapist by using pattern matching and substitution methods."
    },
    {
      question: "What period in AI history is often referred to as the 'AI Winter'?",
      options: [
        "The 1950s when AI research first began",
        "The periods in the 1970s and 1980s-90s when funding and interest in AI decreased",
        "The early 2000s before deep learning became popular",
        "The current period of AI development"
      ],
      correctAnswer: 1,
      explanation: "The term 'AI Winter' refers to periods (particularly in the 1970s and late 1980s through the 1990s) when funding and interest in AI research decreased due to disillusionment after initial high expectations weren't met."
    }
  ];
  
  const selectedQuestion = questions[id % questions.length];
  return {
    id,
    question: selectedQuestion.question,
    options: selectedQuestion.options,
    correctAnswer: selectedQuestion.correctAnswer,
    explanation: selectedQuestion.explanation
  };
}

function generateApplicationQuestion(id, field) {
  const questions = [
    {
      question: `How is AI currently being used in ${field}?`,
      options: [
        `To completely replace human workers in ${field}`,
        `For administrative tasks only in ${field}`,
        `To automate routine tasks and assist professionals in ${field}`,
        `AI is not yet applicable to ${field}`
      ],
      correctAnswer: 2,
      explanation: `AI is being used in ${field} to automate routine tasks, analyze large datasets, and provide decision support for professionals, enhancing productivity rather than replacing humans entirely.`
    },
    {
      question: `What is a major challenge for AI implementation in ${field}?`,
      options: [
        "The cost of hardware",
        "Data privacy and security concerns",
        "Lack of internet connectivity",
        "Resistance from software developers"
      ],
      correctAnswer: 1,
      explanation: `A major challenge for AI implementation in ${field} is data privacy and security concerns, as these applications often handle sensitive information that must be protected.`
    },
    {
      question: `Which type of AI technology has shown the most promise in ${field}?`,
      options: [
        "Expert systems",
        "Machine learning algorithms",
        "Quantum computing",
        "Blockchain technology"
      ],
      correctAnswer: 1,
      explanation: `Machine learning algorithms have shown the most promise in ${field} due to their ability to analyze large datasets, identify patterns, and continuously improve over time.`
    }
  ];
  
  const selectedQuestion = questions[id % questions.length];
  return {
    id,
    question: selectedQuestion.question,
    options: selectedQuestion.options,
    correctAnswer: selectedQuestion.correctAnswer,
    explanation: selectedQuestion.explanation
  };
}

// Generate the required number of questions
for (let i = 0; i < questionsToAdd; i++) {
  // Cycle through different types of questions
  const category = categories[i % categories.length];
  let question;
  
  if (category === "Machine Learning" || category === "Neural Networks" || 
      category === "Deep Learning" || category === "Reinforcement Learning") {
    question = generateMLQuestion(nextId, category);
  } else if (category === "AI Ethics" || category === "AI and Privacy" || category === "AI and Security") {
    question = generateEthicsQuestion(nextId);
  } else if (category === "AI History") {
    question = generateHistoryQuestion(nextId);
  } else if (category.includes("AI in")) {
    const field = category.replace("AI in ", "");
    question = generateApplicationQuestion(nextId, field);
  } else {
    // Use a template question for other categories
    const template = questionTemplates[i % questionTemplates.length];
    question = {
      id: nextId,
      question: `${category}: ${template.question}`,
      options: [...template.options],
      correctAnswer: template.correctAnswer,
      explanation: template.explanation
    };
  }
  
  newQuestions.push(question);
  nextId++;
}

// Add the new questions to the module
moduleData.questions = moduleData.questions.concat(newQuestions);

// Update the updated timestamp
moduleData.updatedAt = new Date().toISOString();

// Write the updated module back to the file
try {
  fs.writeFileSync(modulePath, JSON.stringify(moduleData, null, 2), 'utf8');
  console.log(`Successfully added ${questionsToAdd} questions. The module now has ${moduleData.questions.length} questions.`);
} catch (error) {
  console.error('Error writing to the module file:', error);
  process.exit(1);
}

// Update the index.json file with the new question count
const indexPath = path.join(__dirname, '..', 'learning', 'modules', 'index.json');
try {
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  // Find and update the intro-to-ai module information
  const moduleIndex = indexData.modules.findIndex(m => m.moduleId === 'intro-to-ai');
  if (moduleIndex !== -1) {
    indexData.modules[moduleIndex].questionCount = moduleData.questions.length;
    indexData.modules[moduleIndex].updatedAt = moduleData.updatedAt;
    
    // Write the updated index back to the file
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
    console.log('Successfully updated the module index file.');
  } else {
    console.warn('Could not find the intro-to-ai module in the index file.');
  }
} catch (error) {
  console.error('Error updating the index file:', error);
} ```

### ./src/scripts/generate-module-from-text.js

File path: `./src/scripts/generate-module-from-text.js`

```javascript
#!/usr/bin/env node

/**
 * Natural Language Module Generator
 * 
 * This script takes natural language text input and generates a study module with questions.
 * It uses wink-nlp for natural language processing and extraction of key information.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { promisify } = require('util');
const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);
const its = nlp.its;
const as = nlp.as;

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// Configuration
const MODULES_DIR = path.join(__dirname, '..', 'learning', 'modules');
const MIN_SENTENCE_LENGTH = 30; // Minimum sentence length to consider for questions
const DEFAULT_OPTIONS_COUNT = 4; // Default number of options for each question

/**
 * Extract key sentences from text that can be used as the basis for questions
 * @param {string} text - Input text
 * @param {number} maxQuestions - Maximum number of questions to generate
 * @returns {Array} - Array of candidate sentences
 */
function extractKeyContentSentences(text, maxQuestions = 100) {
  // Process the text with winkNLP
  const doc = nlp.readDoc(text);
  
  // Extract sentences and filter by criteria
  const candidates = doc.sentences()
    .filter(sentence => {
      // The sentence should be substantive
      const tokenCount = sentence.tokens().length;
      return tokenCount >= 5 && 
             sentence.out().length >= MIN_SENTENCE_LENGTH &&
             // Filter out questions and sentences without key information
             !sentence.out().includes('?') &&
             sentence.tokens().filter(t => t.out(its.pos) === 'NOUN' || t.out(its.pos) === 'VERB').length >= 3;
    })
    .out();
  
  // Limit the number of candidates
  return candidates.slice(0, maxQuestions);
}

/**
 * Extract keywords from a sentence for creating distractors
 * @param {string} sentence - Input sentence
 * @returns {Array} - Array of keywords
 */
function extractKeywords(sentence) {
  const doc = nlp.readDoc(sentence);
  
  // Extract nouns, verbs, and adjectives as these make good keyword candidates
  return doc.tokens()
    .filter(token => 
      ['NOUN', 'VERB', 'ADJ'].includes(token.out(its.pos)) && 
      token.out(its.stopWordFlag) === false &&
      token.out().length > 3)
    .out();
}

/**
 * Generate a question from a sentence
 * @param {string} sentence - Input sentence
 * @param {Array} allSentences - All sentences for context
 * @param {number} id - Question ID
 * @returns {Object} - Question object
 */
function generateQuestion(sentence, allSentences, id) {
  // Create a document from the sentence
  const doc = nlp.readDoc(sentence);
  
  // Extract entities and key terms
  const entities = doc.entities().out();
  const keywords = extractKeywords(sentence);
  
  // Generate the question text
  let questionText = '';
  let correctAnswer = 0;
  let options = [];
  
  // Identify what type of question to create
  if (keywords.length > 1) {
    // Create a fill-in-the-blank question by removing a keyword
    const keywordToRemove = keywords[Math.floor(Math.random() * keywords.length)];
    
    // Replace the keyword with a blank
    questionText = sentence.replace(
      new RegExp(`\\b${keywordToRemove}\\b`, 'i'), 
      '________'
    );
    
    // Add a prefix to make it a question
    questionText = `Which word correctly completes this statement: "${questionText}"`;
    
    // Set the correct answer
    options.push(keywordToRemove);
    
    // Generate distractors (wrong answers)
    // Find similar words from other sentences
    const otherKeywords = allSentences
      .filter(s => s !== sentence)
      .flatMap(s => extractKeywords(s))
      .filter(k => 
        k !== keywordToRemove && 
        k.length > 3 && 
        !options.includes(k) &&
        k.charAt(0).toLowerCase() === keywordToRemove.charAt(0).toLowerCase()
      );
    
    // Add unique distractors
    const uniqueDistractors = [...new Set(otherKeywords)];
    for (let i = 0; i < DEFAULT_OPTIONS_COUNT - 1 && i < uniqueDistractors.length; i++) {
      options.push(uniqueDistractors[i]);
    }
    
    // If we don't have enough distractors, add some generic ones
    while (options.length < DEFAULT_OPTIONS_COUNT) {
      const randomKeyword = keywords.find(k => k !== keywordToRemove && !options.includes(k));
      if (randomKeyword) {
        options.push(randomKeyword);
      } else {
        // Fallback to default distractor
        options.push(`not_${keywordToRemove}`);
      }
    }
  } else {
    // Create a true/false question based on the sentence
    questionText = `True or False: "${sentence}"`;
    
    // For true/false, we only need two options
    options = ['True', 'False'];
    correctAnswer = 0; // 'True' is correct
  }
  
  // Shuffle options (keeping track of the correct answer)
  const correctOption = options[correctAnswer];
  options = options.sort(() => Math.random() - 0.5);
  correctAnswer = options.indexOf(correctOption);
  
  // Create explanation
  const explanation = `The correct answer is "${options[correctAnswer]}". ${sentence}`;
  
  // Return the question object
  return {
    id: `q_${id}`,
    question: questionText,
    options: options,
    correctAnswer: correctAnswer,
    explanation: explanation,
    difficulty: "beginner"
  };
}

/**
 * Process text and generate a module with questions
 * @param {string} text - Input text
 * @param {string} moduleId - Module ID
 * @param {string} moduleName - Module name
 * @param {string} description - Module description
 * @param {number} maxQuestions - Maximum number of questions
 * @returns {Object} - Module object
 */
function generateModuleFromText(text, moduleId, moduleName, description, maxQuestions = 100) {
  // Extract candidate sentences for questions
  const sentences = extractKeyContentSentences(text, maxQuestions);
  
  // Generate questions
  const questions = sentences.slice(0, maxQuestions).map((sentence, index) => 
    generateQuestion(sentence, sentences, index)
  );
  
  // Create module structure
  const module = {
    moduleId: moduleId,
    moduleName: moduleName,
    description: description,
    category: "Generated",
    difficulty: "beginner",
    tags: ["generated", "wink-nlp"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: questions,
    flashcards: [] // Flashcards could be added later
  };
  
  return module;
}

/**
 * Save module to file
 * @param {Object} module - Module object
 * @returns {Promise} - Promise resolving to file path
 */
async function saveModule(module) {
  try {
    // Ensure modules directory exists
    if (!fs.existsSync(MODULES_DIR)) {
      fs.mkdirSync(MODULES_DIR, { recursive: true });
    }
    
    // Format the module data
    const moduleData = JSON.stringify(module, null, 2);
    const filePath = path.join(MODULES_DIR, `${module.moduleId}.json`);
    
    // Write the file
    await writeFile(filePath, moduleData, 'utf8');
    
    // Update the modules index
    await updateModuleIndex(module);
    
    return filePath;
  } catch (error) {
    console.error('Error saving module:', error);
    throw error;
  }
}

/**
 * Update the module index file
 * @param {Object} moduleData - Module data
 * @returns {Promise} - Promise
 */
async function updateModuleIndex(moduleData) {
  const indexPath = path.join(MODULES_DIR, 'index.json');
  let index = { modules: [] };
  
  // Read existing index if it exists
  if (fs.existsSync(indexPath)) {
    try {
      index = JSON.parse(await readFile(indexPath, 'utf8'));
    } catch (error) {
      console.warn('Warning: Could not read module index. Creating a new one.');
    }
  }
  
  // Remove existing module entry if any
  index.modules = index.modules.filter(m => m.moduleId !== moduleData.moduleId);
  
  // Add new module entry
  index.modules.push({
    moduleId: moduleData.moduleId,
    moduleName: moduleData.moduleName,
    description: moduleData.description || '',
    category: moduleData.category || 'Uncategorized',
    difficulty: moduleData.difficulty || 'beginner',
    tags: moduleData.tags || [],
    coverImage: moduleData.coverImage || '',
    questionCount: moduleData.questions ? moduleData.questions.length : 0,
    flashcardCount: moduleData.flashcards ? moduleData.flashcards.length : 0,
    updatedAt: moduleData.updatedAt
  });
  
  // Sort modules by category and name
  index.modules.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.moduleName.localeCompare(b.moduleName);
  });
  
  // Write the index file
  await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf8');
}

/**
 * Main function to run the script interactively
 */
async function run() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  try {
    console.log('📚 Natural Language Module Generator 🤖\n');
    
    // Get module information
    const moduleId = await question('Enter module ID (e.g., nlp-intro): ');
    const moduleName = await question('Enter module name: ');
    const description = await question('Enter module description: ');
    const maxQuestions = parseInt(await question('Maximum number of questions to generate (default: 50): ') || '50', 10);
    
    console.log('\nNow enter or paste your content text. Press Ctrl+D (Unix) or Ctrl+Z (Windows) followed by Enter when done:\n');
    
    let contentText = '';
    rl.on('line', (line) => {
      contentText += line + '\n';
    });
    
    // Wait for end of input
    await new Promise((resolve) => {
      rl.on('close', resolve);
    });
    
    if (!contentText.trim()) {
      console.error('Error: No content text provided!');
      process.exit(1);
    }
    
    console.log('\nProcessing text and generating questions...');
    
    // Generate the module
    const module = generateModuleFromText(contentText, moduleId, moduleName, description, maxQuestions);
    
    // Save the module
    const filePath = await saveModule(module);
    
    console.log(`\nModule created successfully with ${module.questions.length} questions!`);
    console.log(`Saved to: ${filePath}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// If this script is run directly
if (require.main === module) {
  run();
}

// Export functions for use in other scripts
module.exports = {
  generateModuleFromText,
  saveModule,
  extractKeyContentSentences
}; ```

### ./src/utils/questionUtils.js

File path: `./src/utils/questionUtils.js`

```javascript
/**
 * Utility functions for handling questions in the learning platform
 * Provides methods for selecting random questions, creating question batches,
 * and other question manipulation operations.
 */

/**
 * Select a random subset of questions from a larger question set
 * 
 * @param {Array} questions - The full array of questions
 * @param {Number} count - Number of questions to select
 * @returns {Array} A random subset of questions
 */
function getRandomQuestions(questions, count) {
  // Make a copy of the questions array to avoid modifying the original
  const questionsCopy = [...questions];
  const result = [];
  
  // Handle edge cases
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return [];
  }
  
  // If count is greater than or equal to the length of questions, return all questions
  if (count >= questionsCopy.length) {
    return questionsCopy;
  }
  
  // Randomly select questions
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * questionsCopy.length);
    result.push(questionsCopy[randomIndex]);
    questionsCopy.splice(randomIndex, 1);
  }
  
  return result;
}

/**
 * Get questions that haven't been answered correctly yet
 * 
 * @param {Array} questions - The full array of questions
 * @param {Object} userProgress - User's progress object containing answered questions
 * @returns {Array} Questions that haven't been answered correctly
 */
function getUnansweredQuestions(questions, userProgress) {
  if (!userProgress || !userProgress.answeredQuestions) {
    return questions;
  }
  
  // Filter out questions that have been answered correctly
  return questions.filter(question => {
    const questionId = question.id;
    return !userProgress.answeredQuestions[questionId] || 
           !userProgress.answeredQuestions[questionId].correct;
  });
}

/**
 * Get questions based on difficulty
 * 
 * @param {Array} questions - The full array of questions
 * @param {String} difficulty - Difficulty level: 'easy', 'medium', or 'hard'
 * @returns {Array} Questions filtered by difficulty
 */
function getQuestionsByDifficulty(questions, difficulty) {
  if (!difficulty) {
    return questions;
  }
  
  return questions.filter(question => 
    question.difficulty && question.difficulty.toLowerCase() === difficulty.toLowerCase()
  );
}

/**
 * Get questions by tags
 * 
 * @param {Array} questions - The full array of questions
 * @param {Array} tags - Array of tags to filter by
 * @returns {Array} Questions that contain at least one of the specified tags
 */
function getQuestionsByTags(questions, tags) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) {
    return questions;
  }
  
  return questions.filter(question => {
    if (!question.tags || !Array.isArray(question.tags)) {
      return false;
    }
    
    // Check if any of the question's tags match the specified tags
    return question.tags.some(tag => tags.includes(tag));
  });
}

/**
 * Create a quiz session with a specific number of questions
 * 
 * @param {Array} questions - The full array of questions
 * @param {Number} count - Number of questions for the session
 * @param {Object} options - Additional options like difficulty, tags, etc.
 * @returns {Object} A quiz session object
 */
function createQuizSession(questions, count, options = {}) {
  let filteredQuestions = [...questions];
  
  // Apply filters based on options
  if (options.difficulty) {
    filteredQuestions = getQuestionsByDifficulty(filteredQuestions, options.difficulty);
  }
  
  if (options.tags) {
    filteredQuestions = getQuestionsByTags(filteredQuestions, options.tags);
  }
  
  if (options.userProgress && options.showOnlyUnanswered) {
    filteredQuestions = getUnansweredQuestions(filteredQuestions, options.userProgress);
  }
  
  // Get a random subset of the filtered questions
  const sessionQuestions = getRandomQuestions(filteredQuestions, count);
  
  // Create and return the session object
  return {
    sessionId: generateSessionId(),
    startTime: new Date().toISOString(),
    questions: sessionQuestions,
    totalQuestions: sessionQuestions.length,
    currentQuestion: 0,
    answers: {},
    completed: false
  };
}

/**
 * Generate a unique session ID
 * 
 * @returns {String} A unique session ID
 */
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Split questions into batches for pagination
 * 
 * @param {Array} questions - The array of questions
 * @param {Number} batchSize - Number of questions per batch
 * @returns {Array} An array of question batches
 */
function createQuestionBatches(questions, batchSize = 10) {
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return [];
  }
  
  const batches = [];
  for (let i = 0; i < questions.length; i += batchSize) {
    batches.push(questions.slice(i, i + batchSize));
  }
  
  return batches;
}

module.exports = {
  getRandomQuestions,
  getUnansweredQuestions,
  getQuestionsByDifficulty,
  getQuestionsByTags,
  createQuizSession,
  createQuestionBatches
}; ```

### ./src/utils/userProgressUtils.js

File path: `./src/utils/userProgressUtils.js`

```javascript
/**
 * Utility functions for tracking user progress in the learning platform
 * Provides methods for managing user data, tracking progress, and analyzing performance.
 */

/**
 * Initialize or retrieve a user's progress record
 * 
 * @param {String} userId - Unique identifier for the user
 * @returns {Object} User progress object
 */
function getUserProgress(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // Try to get existing user progress from localStorage
  let userProgress;
  try {
    const storedProgress = localStorage.getItem(`progress_${userId}`);
    userProgress = storedProgress ? JSON.parse(storedProgress) : null;
  } catch (error) {
    console.error('Error retrieving user progress:', error);
    userProgress = null;
  }
  
  // If no existing progress, initialize a new progress object
  if (!userProgress) {
    userProgress = {
      userId,
      modules: {},
      answeredQuestions: {},
      quizHistory: [],
      totalCorrect: 0,
      totalAnswered: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    saveUserProgress(userId, userProgress);
  }
  
  return userProgress;
}

/**
 * Save user progress to localStorage
 * 
 * @param {String} userId - Unique identifier for the user
 * @param {Object} progressData - User progress data to save
 * @returns {Boolean} True if save was successful
 */
function saveUserProgress(userId, progressData) {
  if (!userId || !progressData) {
    return false;
  }
  
  try {
    // Update the last updated timestamp
    progressData.lastUpdated = new Date().toISOString();
    
    // Save to localStorage
    localStorage.setItem(`progress_${userId}`, JSON.stringify(progressData));
    return true;
  } catch (error) {
    console.error('Error saving user progress:', error);
    return false;
  }
}

/**
 * Record a user's answer to a question
 * 
 * @param {String} userId - Unique identifier for the user
 * @param {String} moduleId - ID of the module
 * @param {Number} questionId - ID of the question
 * @param {Number} userAnswer - The user's answer (index of selected option)
 * @param {Boolean} isCorrect - Whether the answer was correct
 * @returns {Object} Updated user progress
 */
function recordAnswer(userId, moduleId, questionId, userAnswer, isCorrect) {
  const userProgress = getUserProgress(userId);
  
  // Initialize module tracking if it doesn't exist
  if (!userProgress.modules[moduleId]) {
    userProgress.modules[moduleId] = {
      started: new Date().toISOString(),
      questionsAnswered: 0,
      correctAnswers: 0,
      lastAnswered: null,
      completed: false
    };
  }
  
  // Update module statistics
  const moduleStats = userProgress.modules[moduleId];
  moduleStats.questionsAnswered++;
  if (isCorrect) {
    moduleStats.correctAnswers++;
  }
  moduleStats.lastAnswered = new Date().toISOString();
  
  // Record this specific answer
  userProgress.answeredQuestions[questionId] = {
    moduleId,
    userAnswer,
    correct: isCorrect,
    answeredAt: new Date().toISOString(),
    attemptCount: (userProgress.answeredQuestions[questionId]?.attemptCount || 0) + 1
  };
  
  // Update overall statistics
  userProgress.totalAnswered++;
  if (isCorrect) {
    userProgress.totalCorrect++;
  }
  
  // Save the updated progress
  saveUserProgress(userId, userProgress);
  
  return userProgress;
}

/**
 * Record the completion of a quiz session
 * 
 * @param {String} userId - Unique identifier for the user
 * @param {Object} quizSession - The quiz session object
 * @returns {Object} Updated user progress
 */
function recordQuizCompletion(userId, quizSession) {
  if (!quizSession || !quizSession.questions || !quizSession.answers) {
    throw new Error('Invalid quiz session data');
  }
  
  const userProgress = getUserProgress(userId);
  
  // Calculate quiz results
  const totalQuestions = quizSession.questions.length;
  let correctAnswers = 0;
  
  for (const questionId in quizSession.answers) {
    const answer = quizSession.answers[questionId];
    if (answer.correct) {
      correctAnswers++;
    }
  }
  
  // Create quiz history entry
  const quizRecord = {
    sessionId: quizSession.sessionId,
    moduleId: quizSession.moduleId,
    startTime: quizSession.startTime,
    endTime: new Date().toISOString(),
    totalQuestions,
    correctAnswers,
    score: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
  };
  
  // Add to quiz history
  userProgress.quizHistory.push(quizRecord);
  
  // Check if module is completed (80% or more correct answers)
  if (quizSession.moduleId && userProgress.modules[quizSession.moduleId]) {
    const moduleStats = userProgress.modules[quizSession.moduleId];
    const moduleQuestions = quizSession.questions.filter(q => q.moduleId === quizSession.moduleId).length;
    
    if (moduleQuestions > 0 && (moduleStats.correctAnswers / moduleQuestions) >= 0.8) {
      moduleStats.completed = true;
      moduleStats.completedAt = new Date().toISOString();
    }
  }
  
  // Save updated progress
  saveUserProgress(userId, userProgress);
  
  return userProgress;
}

/**
 * Get statistics for a user across all modules
 * 
 * @param {String} userId - Unique identifier for the user
 * @returns {Object} User statistics
 */
function getUserStats(userId) {
  const userProgress = getUserProgress(userId);
  
  // Calculate overall statistics
  const totalAnswered = userProgress.totalAnswered || 0;
  const totalCorrect = userProgress.totalCorrect || 0;
  const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;
  
  // Count completed modules
  const moduleIds = Object.keys(userProgress.modules || {});
  const completedModules = moduleIds.filter(id => userProgress.modules[id].completed).length;
  
  // Calculate average score from quiz history
  const quizHistory = userProgress.quizHistory || [];
  const totalQuizzes = quizHistory.length;
  const averageScore = totalQuizzes > 0 
    ? quizHistory.reduce((sum, quiz) => sum + quiz.score, 0) / totalQuizzes 
    : 0;
  
  // Get recent quizzes
  const recentQuizzes = quizHistory
    .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))
    .slice(0, 5);
  
  return {
    userId: userProgress.userId,
    totalModules: moduleIds.length,
    completedModules,
    totalAnswered,
    totalCorrect,
    accuracy,
    totalQuizzes,
    averageScore,
    recentQuizzes,
    createdAt: userProgress.createdAt,
    lastUpdated: userProgress.lastUpdated
  };
}

/**
 * Generate a unique user ID if one doesn't exist
 * 
 * @returns {String} A unique user ID
 */
function generateUserId() {
  // Check if there's an existing user ID in localStorage
  let userId = localStorage.getItem('currentUserId');
  
  if (!userId) {
    // Generate a new user ID
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('currentUserId', userId);
  }
  
  return userId;
}

/**
 * Reset progress for a specific module
 * 
 * @param {String} userId - Unique identifier for the user
 * @param {String} moduleId - ID of the module to reset
 * @returns {Object} Updated user progress
 */
function resetModuleProgress(userId, moduleId) {
  const userProgress = getUserProgress(userId);
  
  if (userProgress.modules[moduleId]) {
    // Remove module progress
    delete userProgress.modules[moduleId];
    
    // Remove answers for questions in this module
    for (const questionId in userProgress.answeredQuestions) {
      if (userProgress.answeredQuestions[questionId].moduleId === moduleId) {
        delete userProgress.answeredQuestions[questionId];
      }
    }
    
    // Recalculate totals
    let totalCorrect = 0;
    let totalAnswered = 0;
    
    for (const questionId in userProgress.answeredQuestions) {
      totalAnswered++;
      if (userProgress.answeredQuestions[questionId].correct) {
        totalCorrect++;
      }
    }
    
    userProgress.totalCorrect = totalCorrect;
    userProgress.totalAnswered = totalAnswered;
    
    // Save updated progress
    saveUserProgress(userId, userProgress);
  }
  
  return userProgress;
}

module.exports = {
  getUserProgress,
  saveUserProgress,
  recordAnswer,
  recordQuizCompletion,
  getUserStats,
  generateUserId,
  resetModuleProgress
}; ```

