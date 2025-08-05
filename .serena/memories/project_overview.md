# PDFProspector - Project Overview

## Purpose
Build a PDF document extraction tool that can accurately parse unstructured agricultural/environmental reports and extract key information with high accuracy. The tool should demonstrate ability to work with complex document structures, implement intelligent data extraction, and create user-friendly interfaces.

## Challenge
Process government and agricultural reports that follow similar structures but have varying formats. The tool must leverage LLM models to understand document context and extract meaningful data regardless of formatting variations.

## Target Accuracy Requirements
- ≥75% accuracy in identifying main goals, BMPs and activities
- ≥75% accuracy in extracting quantitative metrics  
- Zero false positives for exact copied content
- Proper categorization of different content types

## Test Data Source
Mississippi Watershed Plans from: https://www.mdeq.ms.gov/wp-content/uploads/SurfaceWaterBasinMgtNonPointSourceBranch/Watershed_Plans/MS_Watershed_Plans.htm

## Data Structure to Extract
```typescript
interface ExtractedReport {
  summary: {
    totalGoals: number;
    totalBMPs: number; 
    completionRate: number;
  };
  goals: Goal[];
  bmps: BMP[];
  implementation: ImplementationActivity[];
  monitoring: MonitoringMetric[];
  outreach: OutreachActivity[];
  geographicAreas: GeographicArea[];
}
```