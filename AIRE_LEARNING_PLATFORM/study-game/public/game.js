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
}); 