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
}; 