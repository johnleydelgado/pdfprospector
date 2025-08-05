# Project Structure

## Recommended Directory Structure
```
project-name/
├── frontend/          # React application
├── backend/           # Node.js API (or serverless functions)
├── README.md          # Framework and approach
├── EXTRACTION_LOGIC.md # Explain your steps
├── DEPLOYMENT.md      # Deployment configuration details
├── package.json       # Dependencies
└── docker-compose.yml # Optional: containerized setup
```

## Required Documentation Files
- **README.md**: Implementation approach, framework, and setup/usage instructions
- **EXTRACTION_LOGIC.md**: Detailed explanation of steps to achieve accurate extraction
- **TESTING.md**: How accuracy was validated with the EPA documents
- **DEPLOYMENT.md**: How the live demo is configured and deployed

## Environment Variables
```env
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here  
NODE_ENV=production
```

Note: Do not include actual API keys in submitted code - evaluators will use their own keys.