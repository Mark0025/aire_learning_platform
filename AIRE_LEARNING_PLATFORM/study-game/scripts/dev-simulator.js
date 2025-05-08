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
runSimulator(); 