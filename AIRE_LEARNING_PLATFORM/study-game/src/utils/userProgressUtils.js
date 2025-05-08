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
}; 