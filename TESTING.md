# Testing & Validation Guide

## 🎯 Overview
This document outlines the comprehensive testing strategy for PDFProspector, including accuracy validation, performance testing, and quality assurance procedures.

## 📊 Accuracy Requirements

### Target Metrics (Per Assessment Requirements)
- **≥75% accuracy** in identifying main goals, BMPs, and activities  
- **≥75% accuracy** in extracting quantitative metrics
- **Zero false positives** for exact copied content
- **Proper categorization** of different content types

### Test Data Sources
- **Primary**: Mississippi Watershed Plans from [MS DEQ](https://www.mdeq.ms.gov/wp-content/uploads/SurfaceWaterBasinMgtNonPointSourceBranch/Watershed_Plans/MS_Watershed_Plans.htm)
- **Secondary**: Additional agricultural/environmental reports
- **Edge Cases**: Corrupted, password-protected, and unusual format PDFs

## 🧪 Testing Framework

### 1. Unit Testing

#### Backend Services Testing
```typescript
// Example: PDF Processor Tests
describe('PDFProcessor', () => {
  const processor = new PDFProcessor();

  test('should validate PDF magic number', () => {
    const validPDF = Buffer.from('%PDF-1.4...', 'binary');
    const invalidFile = Buffer.from('Not a PDF', 'utf8');
    
    expect(processor.validatePDF(validPDF)).toBe(true);
    expect(processor.validatePDF(invalidFile)).toBe(false);
  });

  test('should extract text from PDF', async () => {
    const mockRequest = {
      fileName: 'test.pdf',
      fileSize: 1024,
      buffer: validPDFBuffer
    };
    
    const result = await processor.extractText(mockRequest);
    expect(result.text).toBeDefined();
    expect(result.pages).toBeGreaterThan(0);
  });
});
```

#### LLM Service Testing
```typescript
describe('LLMService', () => {
  const llmService = new LLMService();

  test('should handle provider fallback', async () => {
    // Mock OpenAI failure
    jest.spyOn(llmService, 'extractWithOpenAI').mockRejectedValue(new Error('API Error'));
    
    const result = await llmService.extractData(mockPDFContent, 'test.pdf', 1024);
    expect(result).toBeDefined();
    expect(result.metadata.processingMethod).toContain('Anthropic');
  });

  test('should structure response correctly', () => {
    const mockData = { goals: [], bmps: [] };
    const result = llmService.structureResponse(mockData, 'test.pdf', 1024, 2000, 'openai');
    
    expect(result.summary).toBeDefined();
    expect(result.goals).toEqual([]);
    expect(result.metadata.fileName).toBe('test.pdf');
  });
});
```

#### Frontend Component Testing
```typescript
// Example: Dashboard Component Tests
import { render, screen } from '@testing-library/react';
import Dashboard from '../components/Dashboard';

describe('Dashboard', () => {
  const mockData = {
    summary: { totalGoals: 5, totalBMPs: 3, completionRate: 60 },
    goals: [{ id: '1', title: 'Test Goal', status: 'in-progress' }],
    // ... other mock data
  };

  test('renders summary cards correctly', () => {
    render(<Dashboard data={mockData} />);
    
    expect(screen.getByText('5')).toBeInTheDocument(); // Total Goals
    expect(screen.getByText('3')).toBeInTheDocument(); // Total BMPs
    expect(screen.getByText('60%')).toBeInTheDocument(); // Completion Rate
  });

  test('displays goals in table format', () => {
    render(<Dashboard data={mockData} />);
    
    const goalsTab = screen.getByText('Goals');
    fireEvent.click(goalsTab);
    
    expect(screen.getByText('Test Goal')).toBeInTheDocument();
    expect(screen.getByText('in-progress')).toBeInTheDocument();
  });
});
```

### 2. Integration Testing

#### API Endpoint Testing
```typescript
describe('Extract API', () => {
  test('POST /api/extract with valid PDF', async () => {
    const response = await request(app)
      .post('/api/extract')
      .attach('pdf', 'test-files/sample-watershed.pdf')
      .expect(200);

    expect(response.body.summary).toBeDefined();
    expect(response.body.goals).toBeInstanceOf(Array);
    expect(response.body.bmps).toBeInstanceOf(Array);
  });

  test('POST /api/extract rejects non-PDF files', async () => {
    const response = await request(app)
      .post('/api/extract')
      .attach('pdf', 'test-files/document.txt')
      .expect(400);

    expect(response.body.error).toContain('PDF files are allowed');
  });

  test('GET /api/extract/test returns mock data', async () => {
    const response = await request(app)
      .get('/api/extract/test')
      .expect(200);

    expect(response.body.summary.totalGoals).toBe(5);
    expect(response.body.goals).toHaveLength(2);
  });
});
```

#### End-to-End Testing
```typescript
describe('PDF Processing Pipeline', () => {
  test('complete workflow: upload -> process -> display', async () => {
    // 1. Upload PDF
    const uploadResponse = await request(app)
      .post('/api/extract')
      .attach('pdf', 'test-files/real-watershed-plan.pdf');

    expect(uploadResponse.status).toBe(200);

    // 2. Verify extracted data structure
    const data = uploadResponse.body;
    expect(data.summary.totalGoals).toBeGreaterThan(0);
    expect(data.summary.totalBMPs).toBeGreaterThan(0);

    // 3. Test export functionality
    const exportResponse = await request(app)
      .post('/api/export')
      .send({ data, format: 'csv' });

    expect(exportResponse.status).toBe(200);
    expect(exportResponse.headers['content-type']).toContain('text/csv');
  });
});
```

## 📈 Accuracy Validation

### 1. Manual Validation Process

#### Test Document Selection
```bash
# Download test documents
wget https://www.mdeq.ms.gov/wp-content/uploads/.../BigBlackRiver_WMP.pdf
wget https://www.mdeq.ms.gov/wp-content/uploads/.../PascagoulaRiver_WMP.pdf
wget https://www.mdeq.ms.gov/wp-content/uploads/.../PearlRiver_WMP.pdf
```

#### Ground Truth Creation
For each test document, manually identify:
1. **Goals** (strategic objectives with measurable outcomes)
2. **BMPs** (specific conservation practices with effectiveness ratings)
3. **Implementation Activities** (action items with timelines/budgets)
4. **Monitoring Metrics** (quantitative measurements)
5. **Outreach Activities** (community engagement programs)
6. **Geographic Areas** (spatial coverage information)

#### Accuracy Calculation
```typescript
interface ValidationResult {
  category: string;
  totalExpected: number;
  totalExtracted: number;
  correctlyIdentified: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
  precision: number;
  recall: number;
}

function calculateAccuracy(expected: any[], extracted: any[]): ValidationResult {
  const correctlyIdentified = extracted.filter(item => 
    expected.some(exp => isSimilar(item, exp))
  ).length;
  
  const falsePositives = extracted.length - correctlyIdentified;
  const falseNegatives = expected.length - correctlyIdentified;
  
  return {
    totalExpected: expected.length,
    totalExtracted: extracted.length,
    correctlyIdentified,
    falsePositives,
    falseNegatives,
    accuracy: correctlyIdentified / expected.length,
    precision: correctlyIdentified / extracted.length,
    recall: correctlyIdentified / expected.length
  };
}
```

### 2. Automated Validation

#### Similarity Matching Algorithm
```typescript
function isSimilar(extracted: any, expected: any): boolean {
  // Title/name similarity (Levenshtein distance)
  const nameScore = similarity(extracted.title || extracted.name, expected.title || expected.name);
  
  // Description similarity (cosine similarity on word vectors)
  const descScore = cosineSimilarity(
    tokenize(extracted.description),
    tokenize(expected.description)
  );
  
  // Quantitative accuracy
  const quantScore = extracted.effectiveness 
    ? Math.abs(extracted.effectiveness - expected.effectiveness) / expected.effectiveness
    : 1;
  
  return nameScore > 0.8 && descScore > 0.6 && quantScore < 0.2;
}
```

#### Validation Test Suite
```typescript
describe('Accuracy Validation', () => {
  const testDocuments = [
    'test-files/BigBlackRiver_WMP.pdf',
    'test-files/PascagoulaRiver_WMP.pdf',
    'test-files/PearlRiver_WMP.pdf'
  ];

  testDocuments.forEach(docPath => {
    test(`validates accuracy for ${docPath}`, async () => {
      // Extract data
      const extractedData = await processDocument(docPath);
      
      // Load ground truth
      const groundTruth = await loadGroundTruth(docPath);
      
      // Calculate accuracy for each category
      const goalAccuracy = calculateAccuracy(groundTruth.goals, extractedData.goals);
      const bmpAccuracy = calculateAccuracy(groundTruth.bmps, extractedData.bmps);
      
      // Assert accuracy requirements
      expect(goalAccuracy.accuracy).toBeGreaterThanOrEqual(0.75);
      expect(bmpAccuracy.accuracy).toBeGreaterThanOrEqual(0.75);
      
      // Zero false positives for exact content
      expect(goalAccuracy.falsePositives).toBe(0);
      expect(bmpAccuracy.falsePositives).toBe(0);
    });
  });
});
```

## ⚡ Performance Testing

### 1. Load Testing

#### Concurrent Upload Testing
```bash
# Apache Bench - Multiple concurrent uploads
ab -n 20 -c 4 -T 'multipart/form-data' -p test.pdf http://localhost:5001/api/extract

# Results should show:
# - Average response time < 10 seconds
# - No failed requests
# - Memory usage stable
```

#### Artillery.js Load Testing
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "PDF Upload"
    weight: 100
    flow:
      - post:
          url: "/api/extract"
          formData:
            pdf: "@test-files/sample.pdf"
```

### 2. Memory & CPU Monitoring

#### Performance Metrics Collection
```typescript
// Performance monitoring middleware
app.use((req, res, next) => {
  const startTime = process.hrtime();
  const startMem = process.memoryUsage();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const duration = seconds * 1000 + nanoseconds / 1000000; // ms
    
    const endMem = process.memoryUsage();
    const memDelta = endMem.heapUsed - startMem.heapUsed;

    console.log({
      method: req.method,
      url: req.path,
      duration: `${duration.toFixed(2)}ms`,
      memoryDelta: `${(memDelta / 1024 / 1024).toFixed(2)}MB`,
      statusCode: res.statusCode
    });
  });

  next();
});
```

### 3. File Size Testing

#### Large File Handling
```typescript
describe('Large File Processing', () => {
  test('handles 50MB PDF files', async () => {
    const largeFile = generateLargePDF(50 * 1024 * 1024); // 50MB
    
    const response = await request(app)
      .post('/api/extract')
      .attach('pdf', largeFile)
      .timeout(120000); // 2 minute timeout

    expect(response.status).toBe(200);
    expect(response.body.summary).toBeDefined();
  }, 120000);

  test('rejects files over 100MB limit', async () => {
    const oversizeFile = generateLargePDF(101 * 1024 * 1024); // 101MB
    
    const response = await request(app)
      .post('/api/extract')
      .attach('pdf', oversizeFile);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('size exceeds limit');
  });
});
```

## 🔒 Security Testing

### 1. File Upload Security

#### Malicious File Testing
```typescript
describe('Security Validation', () => {
  test('rejects executable files with PDF extension', async () => {
    const maliciousFile = Buffer.from('MZ\x90\x00...'); // PE executable header
    
    const response = await request(app)
      .post('/api/extract')
      .attach('pdf', maliciousFile, 'malicious.pdf');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('not appear to be a valid PDF');
  });

  test('handles password-protected PDFs gracefully', async () => {
    const response = await request(app)
      .post('/api/extract')
      .attach('pdf', 'test-files/password-protected.pdf');

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Password-protected PDFs are not supported');
  });
});
```

### 2. Rate Limiting Testing
```typescript
describe('Rate Limiting', () => {
  test('enforces request limits', async () => {
    const requests = Array(102).fill(null).map(() => 
      request(app).get('/api/health')
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(res => res.status === 429);
    
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

## 📊 Test Results Documentation

### Sample Validation Report
```markdown
# Accuracy Validation Report

## Test Documents
- BigBlackRiver_WMP.pdf (45 pages, 2.3MB)
- PascagoulaRiver_WMP.pdf (67 pages, 4.1MB)  
- PearlRiver_WMP.pdf (52 pages, 3.2MB)

## Results Summary
| Category | Expected | Extracted | Accuracy | Precision | Recall |
|----------|----------|-----------|----------|-----------|--------|
| Goals | 23 | 21 | 91.3% | 95.2% | 87.0% |
| BMPs | 31 | 28 | 90.3% | 96.4% | 87.1% |
| Implementation | 45 | 42 | 93.3% | 95.2% | 91.1% |
| Monitoring | 18 | 16 | 88.9% | 93.8% | 83.3% |

## Performance Metrics
- Average processing time: 4.2 seconds
- Memory peak usage: 156MB
- Zero system errors
- 100% uptime during testing

## Conclusion
✅ Meets all accuracy requirements (>75%)
✅ Zero false positives detected
✅ Robust error handling
✅ Production-ready performance
```

## 🚀 Continuous Integration

### GitHub Actions Testing
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Backend Dependencies
        run: cd apps/backend && npm ci
      
      - name: Install Frontend Dependencies  
        run: cd apps/frontend && npm ci
      
      - name: Run Backend Tests
        run: cd apps/backend && npm test
      
      - name: Run Frontend Tests
        run: cd apps/frontend && npm test
      
      - name: Type Check
        run: |
          cd apps/backend && npm run type-check
          cd apps/frontend && npm run type-check
      
      - name: Lint Code
        run: |
          cd apps/backend && npm run lint
          cd apps/frontend && npm run lint
```

This comprehensive testing strategy ensures PDFProspector meets all accuracy requirements, performs reliably under load, and maintains security standards for production deployment.