# AIRE Learning Platform - Study Game

![AIRE Logo](public/images/aire-logo.svg)

A comprehensive web-based quiz game designed to help real estate investors and professionals master essential concepts and strategies through interactive learning.

## Features

- Interactive quizzes covering various real estate investment topics and strategies
- Immediate feedback for correct/incorrect answers with detailed explanations
- Score tracking and performance analytics
- Review answers to reinforce learning
- Mobile-friendly design with modern styling
- Uses JSON format for question data, enabling easy content updates
- Option to lock answers after selection (for real testing scenarios)
- Versatile study tool that can be adapted for any real estate investing subject
- Custom SVG logo reflecting the AIRE branding

## Getting Started

### Prerequisites

- Node.js installed on your machine

### Installation

1. Clone this repository or download the files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

Start the application with:

```bash
npm start
```

The application will be available at http://localhost:3000

## How to Play

1. Choose your game settings:
   - Check "Lock answers after selection" if you want to simulate a real test (can't change answers)
   - Leave it unchecked if you want to be able to revise your answers
2. Click the "Start Quiz" button to begin
3. Read each question carefully and select the answer you believe is correct
4. You'll receive immediate feedback on your answer with an explanation
5. Navigate through questions using the "Next" and "Previous" buttons
6. At the end of the quiz, you'll see your final score and can review your answers

## Project Structure

- `public/` - Contains the front-end files
  - `index.html` - Main HTML file
  - `style.css` - CSS with modern styling
  - `images/` - Contains logos and images
  - `game.js` - Game logic
- `data/` - Contains question data files
- `server.js` - Express server to serve the application

## Adding More Modules

You can add more modules by creating new JSON files following the same structure. The format is:

```json
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0, // Index of the correct option (0-based)
      "explanation": "Explanation for the answer"
    },
    // more questions...
  ]
}
```

## Tips for Using as a Study Tool

- **Practice Mode**: Leave "Lock answers" unchecked to learn the material
- **Test Mode**: Check "Lock answers" to simulate a real test environment
- Create your own module JSON files for different real estate investment topics
- Review your answers at the end to understand areas that need more focus

## About AIRE

AIRE (AI Real Estate) is revolutionizing the real estate investing landscape with cutting-edge AI technology. Our mission is to empower investors with the knowledge, tools, and strategies needed to succeed in today's competitive market.

Visit [aireinvestor.com](https://aireinvestor.com) to learn more about our services and products.

## License

This project is proprietary software owned by AIRE. All rights reserved. 