#!/usr/bin/env node

/**
 * Module Import Script
 * 
 * This script validates and imports learning modules into the application.
 * Usage: node import-module.js path/to/your/module.json
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const Ajv = require('../../$node_modules/ajv/dist/ajv.js');
const addFormats = require('../../$node_modules/ajv-formats/dist/index.js');

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);

// Get the module file path from command line arguments
const moduleFilePath = process.argv[2];

if (!moduleFilePath) {
  console.error('Error: Please provide a path to a module JSON file.');
  console.error('Usage: node import-module.js path/to/your/module.json');
  process.exit(1);
}

// Main function
async function importModule() {
  try {
    // Read the schema file
    const schemaPath = path.resolve(__dirname, '../schema.json');
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));

    // Read the module file
    const modulePath = path.resolve(process.cwd(), moduleFilePath);
    const moduleData = JSON.parse(await readFile(modulePath, 'utf8'));

    // Validate the module against the schema
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const valid = validate(moduleData);

    if (!valid) {
      console.error('Error: The module file is not valid according to the schema:');
      console.error(JSON.stringify(validate.errors, null, 2));
      process.exit(1);
    }

    // Process and import the module
    await processModule(moduleData);

    console.log(`Module "${moduleData.moduleName}" imported successfully!`);
  } catch (error) {
    console.error('Error importing module:', error.message);
    process.exit(1);
  }
}

// Process and import the module
async function processModule(moduleData) {
  const moduleId = moduleData.moduleId;
  const modulesDir = path.resolve(__dirname, '../modules');
  const assetsDir = path.resolve(__dirname, '../assets');

  // Ensure directories exist
  await mkdir(modulesDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });
  
  // Check if module already exists
  const moduleFilePath = path.join(modulesDir, `${moduleId}.json`);
  if (fs.existsSync(moduleFilePath)) {
    const overwrite = await promptYesNo(`Module "${moduleId}" already exists. Overwrite?`);
    if (!overwrite) {
      console.log('Import canceled.');
      process.exit(0);
    }
  }

  // Process images if any
  if (moduleData.coverImage && moduleData.coverImage.startsWith('/')) {
    // Handle cover image
    const imagePath = moduleData.coverImage.replace(/^\/assets\//, '');
    const sourceImagePath = path.resolve(path.dirname(process.argv[2]), imagePath);
    const targetImagePath = path.join(assetsDir, path.basename(imagePath));
    
    if (fs.existsSync(sourceImagePath)) {
      await copyFile(sourceImagePath, targetImagePath);
      moduleData.coverImage = `/assets/${path.basename(imagePath)}`;
    } else {
      console.warn(`Warning: Cover image "${sourceImagePath}" not found.`);
    }
  }

  // Process question images
  if (moduleData.questions) {
    for (const question of moduleData.questions) {
      if (question.image && question.image.startsWith('/')) {
        const imagePath = question.image.replace(/^\/assets\//, '');
        const sourceImagePath = path.resolve(path.dirname(process.argv[2]), imagePath);
        const targetImagePath = path.join(assetsDir, path.basename(imagePath));
        
        if (fs.existsSync(sourceImagePath)) {
          await copyFile(sourceImagePath, targetImagePath);
          question.image = `/assets/${path.basename(imagePath)}`;
        } else {
          console.warn(`Warning: Question image "${sourceImagePath}" not found.`);
        }
      }
    }
  }

  // Process flashcard images
  if (moduleData.flashcards) {
    for (const card of moduleData.flashcards) {
      if (card.image && card.image.startsWith('/')) {
        const imagePath = card.image.replace(/^\/assets\//, '');
        const sourceImagePath = path.resolve(path.dirname(process.argv[2]), imagePath);
        const targetImagePath = path.join(assetsDir, path.basename(imagePath));
        
        if (fs.existsSync(sourceImagePath)) {
          await copyFile(sourceImagePath, targetImagePath);
          card.image = `/assets/${path.basename(imagePath)}`;
        } else {
          console.warn(`Warning: Flashcard image "${sourceImagePath}" not found.`);
        }
      }
    }
  }

  // Update timestamps
  const now = new Date().toISOString();
  if (!moduleData.createdAt) {
    moduleData.createdAt = now;
  }
  moduleData.updatedAt = now;

  // Write the module file
  await writeFile(moduleFilePath, JSON.stringify(moduleData, null, 2), 'utf8');
  
  console.log(`Module saved to ${moduleFilePath}`);
  
  // Update the module index
  await updateModuleIndex(moduleData);
}

// Update the module index file
async function updateModuleIndex(moduleData) {
  const indexPath = path.resolve(__dirname, '../modules/index.json');
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
    description: moduleData.description,
    category: moduleData.category,
    difficulty: moduleData.difficulty,
    tags: moduleData.tags,
    coverImage: moduleData.coverImage,
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
  console.log('Module index updated.');
}

// Helper function to prompt for yes/no
async function promptYesNo(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(`${question} (y/n) `, answer => {
      readline.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run the main function
importModule().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1); 