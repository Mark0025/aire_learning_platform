# AIRE Learning Platform Codebase Documentation

## Project Structure

The AIRE Learning Platform is built with Node.js and Express. Below is the high-level structure of the project:

```
study-game/
├── index.js                # Main entry point
├── package.json            # Project dependencies and scripts
├── vercel.json             # Vercel deployment configuration
├── src/
│   ├── server.js           # Express server configuration
│   ├── public/             # Static files (HTML, CSS, JS)
│   ├── learning/           # Learning modules and related files
│   │   ├── modules/        # JSON module files
│   │   ├── assets/         # Module-related assets
│   │   ├── uploads/        # Temporary upload directory
│   │   └── schema.json     # Module validation schema
│   ├── data/               # User progress data
│   └── scripts/            # Utility scripts
```

## Key Components

### 1. Express Server

The application uses Express.js to serve static files and handle API requests. The server configuration is in `src/server.js`.

### 2. Learning Modules

Learning modules are stored as JSON files in the `src/learning/modules/` directory. Each module contains:
- Module metadata (ID, name, description, etc.)
- Questions with options and correct answers
- Flashcards with front and back content

### 3. User Interface

The user interface consists of:
- Quiz game interface (`src/public/index.html`)
- Flashcard interface (`src/public/flashcards.html`)
- Module upload interface (`src/public/upload.html`)

### 4. Module Generation

The application includes a natural language processing tool to generate questions from text content. This is implemented in `src/scripts/generate-module-from-text.js`.

## API Endpoints

The server exposes several API endpoints:

- `POST /api/upload-module`: Upload a new learning module
- `POST /api/generate-module-from-text`: Generate a module from text content
- `GET /api/dev/users`: List simulated users (development only)
- `POST /api/dev/save-user-progress`: Save user progress (development only)

## Deployment

The application is configured for deployment on Vercel using the serverless functions approach. The `vercel.json` file contains the necessary configuration for routing requests through the Express application.
