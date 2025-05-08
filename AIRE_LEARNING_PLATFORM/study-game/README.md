# Tauros Study Game

A simple web-based quiz game to help you study the content from Tauros Module 1.

## Features

- Interactive quiz with 10 questions about Tauros Module 1
- Immediate feedback for correct/incorrect answers with explanations
- Score tracking
- Review answers at the end of the quiz
- Mobile-friendly design with Tailwind CSS-like styling
- Uses JSON format for question data
- Option to lock answers after selection (for real testing scenarios)
- Versatile study tool that can be adapted for any subject

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
  - `style.css` - CSS with Tailwind-like utility classes
  - `module1.json` - Questions data in JSON format
  - `game.js` - Game logic
- `server.js` - Simple Express server to serve the application

## Adding More Modules

You can add more modules by creating new JSON files following the same structure as module1.json. The format is:

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
- Create your own module JSON files for different subjects
- Review your answers at the end to understand areas that need more focus

## License

This project is open-source and available for educational purposes. 