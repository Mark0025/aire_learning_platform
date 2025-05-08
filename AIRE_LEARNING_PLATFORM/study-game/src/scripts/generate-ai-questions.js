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
} 