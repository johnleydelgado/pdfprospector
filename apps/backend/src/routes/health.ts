import { Router, Request, Response } from 'express'
import { asyncHandler } from '../middleware/errorHandler'

const router = Router()

// GET /api/health - Basic health check
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      pdf_processor: 'available',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  }

  res.json(healthData)
}))

// GET /api/health/detailed - Detailed health check with service tests
router.get('/detailed', asyncHandler(async (_req: Request, res: Response) => {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      server: {
        status: 'pass',
        time: new Date().toISOString()
      },
      memory: {
        status: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'pass' : 'warn', // 500MB threshold
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      environment: {
        status: 'pass',
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      llm_services: {
        openai: process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
        anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'not_configured',
        status: (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY) ? 'pass' : 'fail'
      }
    }
  }

  // Determine overall status
  const hasFailures = Object.values(checks.checks).some(check => 
    typeof check === 'object' && check.status === 'fail'
  )
  
  if (hasFailures) {
    checks.status = 'unhealthy'
    res.status(503)
  }

  res.json(checks)
}))

export default router