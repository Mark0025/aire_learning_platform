const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { promisify } = require('util');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const mime = require('mime');
const marked = require('marked');
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

// Serve the dev-documentation.html file
app.get('/dev-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dev-documentation.html'));
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

// Documentation endpoint - serve markdown files as HTML
app.get('/docs/:file', async (req, res) => {
  try {
    // Only allow access if dev parameter is present in the query string
    if (req.query.dev === undefined) {
      return res.status(403).send('Access denied. Add ?dev to the URL to view documentation.');
    }
    
    const file = req.params.file || 'AIRE_LEARNING_PLATFORM-documentation';
    const filePath = path.join(__dirname, 'public', 'docs', `${file}.md`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send(`Documentation file ${file}.md not found.`);
    }
    
    const mdContent = await readFile(filePath, 'utf8');
    const htmlContent = marked.parse(mdContent);
    
    // Simple HTML template with some basic styling
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AIRE Learning Platform - Documentation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #0070f3;
          }
          
          h1 { font-size: 2.5rem; border-bottom: 2px solid #eaeaea; padding-bottom: 0.5rem; }
          h2 { font-size: 2rem; border-bottom: 1px solid #eaeaea; padding-bottom: 0.3rem; }
          
          pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 16px;
            overflow: auto;
          }
          
          code {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            background-color: #f6f8fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 85%;
          }
          
          pre code {
            background-color: transparent;
            padding: 0;
          }
          
          blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1rem;
            color: #666;
            margin: 1rem 0;
          }
          
          img {
            max-width: 100%;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
          }
          
          table, th, td {
            border: 1px solid #ddd;
          }
          
          th, td {
            padding: 8px 12px;
            text-align: left;
          }
          
          th {
            background-color: #f6f8fa;
          }

          .doc-nav {
            background-color: #f6f8fa;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 2rem;
          }
          
          .doc-nav a {
            margin-right: 1rem;
            color: #0070f3;
            text-decoration: none;
          }
          
          .doc-nav a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="doc-nav">
          <a href="/docs/AIRE_LEARNING_PLATFORM-documentation?dev">Main Documentation</a>
          <a href="/docs/AIRE_LEARNING_PLATFORM-codebase?dev">Codebase Documentation</a>
        </div>
        ${htmlContent}
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error serving documentation:', error);
    res.status(500).send('Error serving documentation: ' + error.message);
  }
});

// Add a default documentation route
app.get('/docs', async (req, res) => {
  try {
    // Only allow access if dev parameter is present in the query string
    if (req.query.dev === undefined) {
      return res.status(403).send('Access denied. Add ?dev to the URL to view documentation.');
    }
    
    const file = 'AIRE_LEARNING_PLATFORM-documentation';
    const filePath = path.join(__dirname, 'public', 'docs', `${file}.md`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).send(`Documentation file ${file}.md not found.`);
    }
    
    const mdContent = await readFile(filePath, 'utf8');
    const htmlContent = marked.parse(mdContent);
    
    // Simple HTML template with some basic styling
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AIRE Learning Platform - Documentation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          h1, h2, h3, h4, h5, h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: #0070f3;
          }
          
          h1 { font-size: 2.5rem; border-bottom: 2px solid #eaeaea; padding-bottom: 0.5rem; }
          h2 { font-size: 2rem; border-bottom: 1px solid #eaeaea; padding-bottom: 0.3rem; }
          
          pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 16px;
            overflow: auto;
          }
          
          code {
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            background-color: #f6f8fa;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-size: 85%;
          }
          
          pre code {
            background-color: transparent;
            padding: 0;
          }
          
          blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1rem;
            color: #666;
            margin: 1rem 0;
          }
          
          img {
            max-width: 100%;
          }
          
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
          }
          
          table, th, td {
            border: 1px solid #ddd;
          }
          
          th, td {
            padding: 8px 12px;
            text-align: left;
          }
          
          th {
            background-color: #f6f8fa;
          }

          .doc-nav {
            background-color: #f6f8fa;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 2rem;
          }
          
          .doc-nav a {
            margin-right: 1rem;
            color: #0070f3;
            text-decoration: none;
          }
          
          .doc-nav a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="doc-nav">
          <a href="/docs/AIRE_LEARNING_PLATFORM-documentation?dev">Main Documentation</a>
          <a href="/docs/AIRE_LEARNING_PLATFORM-codebase?dev">Codebase Documentation</a>
        </div>
        ${htmlContent}
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('Error serving documentation:', error);
    res.status(500).send('Error serving documentation: ' + error.message);
  }
});

// Don't export directly - we'll use a separate file as entry point
module.exports = app; 