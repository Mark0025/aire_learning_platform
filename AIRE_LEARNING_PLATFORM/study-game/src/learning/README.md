# Learning Directory

This directory contains all the learning modules, assets, and scripts for the study application.

## Directory Structure

- `modules/` - Contains all the learning modules in JSON format
- `assets/` - Contains images and other assets used by the modules
- `scripts/` - Contains utility scripts for managing modules
- `templates/` - Contains template files for creating new modules
- `schema.json` - Defines the schema for module files

## Module Schema

Each module must follow the schema defined in `schema.json`. The required fields are:

- `moduleId` (string) - Unique identifier for the module
- `moduleName` (string) - Display name for the module
- `questions` (array) - List of questions for this module

Optional fields include:
- `description` - Brief description of the module content
- `category` - Category to group related modules
- `difficulty` - Difficulty level (beginner, intermediate, advanced)
- `tags` - Tags for search and categorization
- `coverImage` - Path to the module's cover image
- `flashcards` - List of flashcards for this module

## Adding a New Module

### Option 1: Using the Web Upload Interface

1. Navigate to the Upload page in the web interface
2. Click "Download Template" to get an example module format
3. Modify the template with your own content
4. Upload the file through the web interface
5. Your module will be immediately available in the Quiz Game and Flashcards sections

### Option 2: Using the Import Script

1. Create a JSON file following the schema format
2. Run the import script:

```bash
npm run import-module path/to/your/module.json
```

The script will:
- Validate the module against the schema
- Copy any referenced images to the assets directory
- Update the module index file

### Option 3: Manual Creation

1. Create a JSON file in the `modules/` directory, naming it with your `moduleId`
2. Add any images to the `assets/` directory
3. Update the `modules/index.json` file to include your module

## Managing Modules

### Listing Modules

To see all available modules, run:

```bash
npm run list-modules
```

### Updating a Module

To update a module, simply run the import script again with the updated module file:

```bash
npm run import-module path/to/your/updated-module.json
```

## Module Content Guidelines

### Questions

- Each question should have a clear, unambiguous answer
- Include an explanation for each answer
- Tag questions appropriately to allow for filtered study sessions
- Use images where helpful to illustrate concepts

### Flashcards

- Keep front side (question) concise
- Provide a clear, complete answer on the back
- Use images to reinforce visual concepts
- Group related flashcards with consistent tags

## Image Assets

- Place all images in the `assets/` directory
- Reference images using relative paths `/assets/image-name.jpg`
- Keep image sizes reasonable (< 500KB recommended)
- Use descriptive filenames that relate to the content 