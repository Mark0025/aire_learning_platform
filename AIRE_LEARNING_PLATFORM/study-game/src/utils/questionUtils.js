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
}; 