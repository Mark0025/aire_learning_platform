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
} 