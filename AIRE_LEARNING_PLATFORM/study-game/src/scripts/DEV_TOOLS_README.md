# Study Game Dev Tools Guide

This documentation explains how to use the development tools included in the Study Game platform.

## Enabling Dev Mode

To enable the development tools, add `?dev=true` to the URL:
```
http://localhost:3000/?dev=true
```

This will activate both the floating dev panel in the top-right corner and the fixed dev toolbar at the bottom of the screen.

## Available Dev Tools

### 1. Answer Randomly

**Purpose:** Automatically answers all questions in the current quiz session with random selections.

**How to use:**
1. Select a module and start a quiz
2. Click "Answer Randomly" in either dev panel
3. The system will instantly select random answers for all questions
4. A notification will show your final score (e.g., "Randomly answered all questions. Score: 2/10")

**Notes:**
- This tool is useful for quickly testing quiz completion flow
- The score will vary as answers are selected randomly
- You can still navigate through questions to review the randomly selected answers

### 2. Load Simulated User

**Purpose:** Load progress data from previously simulated users created via the simulation script.

**How to use:**
1. Click "Load Simulated User" in either dev panel
2. A dropdown will appear with available simulated users
3. Select a user from the list
4. Click "Load Selected User"
5. The page will reload with the selected user's progress data

**Notes:**
- Simulated users are created by running `npm run dev:sim`
- Each simulated user has their own history, progress, and statistics
- You can use this to test the UI with different progress states

### 3. Clear Storage

**Purpose:** Reset all local storage data to start with a clean state.

**How to use:**
1. Click "Clear Storage" in either dev panel
2. Confirm the action in the alert dialog
3. The page will reload with all local storage data cleared

**Notes:**
- This is useful when you want to reset your testing environment
- All progress, settings, and user data will be removed from the browser

## Creating Simulated User Data

To generate simulated user data for testing:

1. Run the simulation script:
```bash
npm run dev:sim
```

2. Follow the prompts to select modules and number of questions
3. The script will create a simulated user with random answers
4. Load this user with the "Load Simulated User" tool

## Testing Multiple Questions

When testing question batches:

1. Make sure to set the desired batch size in the settings (5, 10, 20, etc.)
2. Start the quiz with a module containing enough questions
3. If you need to answer quickly, use the "Answer Randomly" tool

## Troubleshooting

**Issue:** Dev tools aren't visible
**Solution:** Make sure you have `?dev=true` in your URL

**Issue:** Can't load simulated users
**Solution:** Run the simulation script first: `npm run dev:sim`

**Issue:** Random answers not working
**Solution:** Ensure you've selected a module and started a quiz

**Issue:** Only seeing a subset of questions
**Solution:** Check your batch size setting - it limits the number of questions per session

## Best Practices

1. Use simulated users for testing user progress features
2. Use random answers for quickly testing quiz completion
3. Clear storage between major test scenarios
4. Use different batch sizes to test the quiz with varying question counts 