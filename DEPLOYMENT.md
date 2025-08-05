# Deployment Guide

## 🚀 Overview
This guide covers deployment strategies for PDFProspector, including local development, staging, and production environments.

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher  
- **Memory**: Minimum 2GB RAM (4GB recommended for production)
- **Storage**: 1GB free space for dependencies and temporary files

### Required API Keys
At least one of the following:
- **OpenAI API Key**: From https://platform.openai.com/api-keys
- **Anthropic API Key**: From https://console.anthropic.com/

## 💻 Local Development

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd PDFProspector

# Install backend dependencies
cd apps/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
Create `.env` file in `apps/backend/`:
```env
# API Keys - Add your actual keys
OPENAI_API_KEY=sk-proj-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Server Configuration
NODE_ENV=development
PORT=5001
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=104857600
UPLOAD_DIR=./uploads
TEMP_DIR=./temp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### 3. Start Development Servers
```bash
# Terminal 1 - Backend API (Port 5001)
cd apps/backend
npm run dev

# Terminal 2 - Frontend Dev Server (Port 3000)
cd apps/frontend
npm run dev
```

### 4. Verify Setup
- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:5001/api/health
- **Test Endpoint**: http://localhost:5001/api/extract/test

## 🌐 Production Deployment

### Option 1: Netlify (Frontend) + Railway (Backend)

#### Backend Deployment to Railway
1. **Connect Repository**
   ```bash
   # Push code to GitHub
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Railway Configuration**
   - Connect GitHub repository
   - Set root directory to `apps/backend`
   - Configure environment variables:
     ```
     OPENAI_API_KEY=your_key_here
     NODE_ENV=production
     PORT=5001
     CORS_ORIGIN=https://your-frontend-domain.netlify.app
     ```

3. **Build Configuration**
   ```json
   // In apps/backend/package.json
   "scripts": {
     "build": "tsc",
     "start": "node dist/index.js"
   }
   ```

#### Frontend Deployment to Netlify
1. **Build Configuration**
   ```bash
   cd apps/frontend
   npm run build
   ```

2. **Netlify Configuration**
   Create `netlify.toml` in project root:
   ```toml
   [build]
     publish = "apps/frontend/dist"
     command = "cd apps/frontend && npm install && npm run build"

   [build.environment]
     NODE_VERSION = "18"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend-domain.railway.app/api
   ```

### Option 2: Vercel (Full-Stack)

#### Frontend Configuration
```json
// vercel.json
{
  "builds": [
    {
      "src": "apps/frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "apps/backend/dist/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "apps/frontend/dist/index.html"
    }
  ]
}
```

#### Backend Serverless Configuration
```typescript
// apps/backend/api/index.ts (for Vercel serverless)
import { app } from '../src/app';
export default app;
```

### Option 3: Docker Deployment

#### Multi-Stage Dockerfile
```dockerfile
# Build stage for backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY apps/backend/package*.json ./
RUN npm ci --only=production
COPY apps/backend/src ./src
COPY apps/backend/tsconfig.json ./
RUN npm run build

# Build stage for frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY apps/frontend/package*.json ./
RUN npm ci
COPY apps/frontend ./
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Copy backend
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/

# Copy frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Install serve for frontend
RUN npm install -g serve

# Create startup script
RUN echo '#!/bin/sh\nserve -s /app/frontend/dist -p 3000 &\ncd /app/backend && node dist/index.js' > /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3000 5001
CMD ["/app/start.sh"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  pdfprospector:
    build: .
    ports:
      - "3000:3000"
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./uploads:/app/backend/uploads
      - ./temp:/app/backend/temp
```

## 🔧 Environment Configuration

### Backend Environment Variables
```env
# Required
OPENAI_API_KEY=sk-proj-...          # OpenAI API key
ANTHROPIC_API_KEY=sk-ant-...        # Anthropic API key (alternative)

# Server Configuration
NODE_ENV=production                  # Environment mode
PORT=5001                           # Server port
CORS_ORIGIN=https://yourdomain.com  # Frontend URL

# File Processing
MAX_FILE_SIZE=104857600             # 100MB upload limit
UPLOAD_DIR=./uploads                # Upload directory
TEMP_DIR=./temp                     # Temporary files

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000         # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100         # Requests per window

# Logging
LOG_LEVEL=info                      # Log verbosity

# Optional Model Override
OPENAI_MODEL=gpt-4o-mini           # Default OpenAI model
ANTHROPIC_MODEL=claude-3-haiku-20240307  # Default Anthropic model
```

### Frontend Environment Variables
```env
# API Configuration
VITE_API_URL=https://api.yourdomain.com/api  # Backend API URL

# Optional Configuration
VITE_APP_NAME=PDFProspector                  # Application name
VITE_VERSION=1.0.0                          # Version number
```

## 📊 Performance Optimization

### Backend Optimizations
```typescript
// Enable compression
app.use(compression());

// Optimize file processing
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Connection pooling for APIs
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 second timeout
  maxRetries: 2   // Retry failed requests
});
```

### Frontend Optimizations
```typescript
// Lazy loading for components
const Dashboard = lazy(() => import('./components/Dashboard'));

// API request optimization
const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 minutes for large PDF processing
});
```

## 🔒 Security Configuration

### Production Security Checklist
- [ ] **API Keys**: Store in environment variables, never in code
- [ ] **CORS**: Configure specific origins, avoid wildcards
- [ ] **Rate Limiting**: Implement request throttling
- [ ] **File Validation**: Strict PDF-only uploads
- [ ] **Size Limits**: Enforce maximum file sizes
- [ ] **HTTPS**: Use SSL certificates for production
- [ ] **Environment**: Set NODE_ENV=production

### Security Headers
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
```

## 🧪 Testing & Validation

### Pre-Deployment Testing
```bash
# Backend tests
cd apps/backend
npm run test
npm run lint
npm run type-check

# Frontend tests  
cd apps/frontend
npm run test
npm run lint
npm run type-check
npm run build
```

### Health Check Endpoints
- **Basic**: `GET /api/health`
- **Detailed**: `GET /api/health/detailed`

### Load Testing
```bash
# Test with multiple concurrent uploads
ab -n 10 -c 2 -T 'multipart/form-data' -p test.pdf http://localhost:5001/api/extract
```

## 📈 Monitoring & Logging

### Application Monitoring
```typescript
// Custom metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});
```

### Error Tracking
```typescript
// Production error handling
if (process.env.NODE_ENV === 'production') {
  // Integrate with error tracking service
  // Sentry, LogRocket, etc.
}
```

## 🚨 Troubleshooting

### Common Issues
1. **CORS Errors**: Check CORS_ORIGIN environment variable
2. **API Key Issues**: Verify keys are properly set and valid
3. **File Upload Failures**: Check MAX_FILE_SIZE setting
4. **Build Failures**: Ensure Node.js version compatibility
5. **Port Conflicts**: Verify ports 3000 and 5001 are available

### Debug Commands
```bash
# Check environment variables
cd apps/backend && node -e "console.log(process.env)"

# Test API connectivity
curl http://localhost:5001/api/health

# View application logs
cd apps/backend && npm run dev 2>&1 | tee app.log
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Verify all environment variables are correctly set
3. Ensure API keys have sufficient quotas
4. Review server logs for specific error messages

This deployment guide provides multiple options for hosting PDFProspector in production environments with proper security, monitoring, and performance optimizations.