import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'
import { createError } from './errorHandler'

// File upload validation schema
export const fileUploadSchema = Joi.object({
  file: Joi.object({
    originalname: Joi.string().required(),
    mimetype: Joi.string().valid('application/pdf').required(),
    size: Joi.number().max(parseInt(process.env.MAX_FILE_SIZE || '104857600')).required(), // 100MB default
    buffer: Joi.binary().required()
  }).required()
})

// Export request validation schema
export const exportRequestSchema = Joi.object({
  data: Joi.object({
    summary: Joi.object().required(),
    goals: Joi.array().required(),
    bmps: Joi.array().required(),
    implementation: Joi.array().required(),
    monitoring: Joi.array().required(),
    outreach: Joi.array().required(),
    geographicAreas: Joi.array().required(),
    metadata: Joi.object().required()
  }).required(),
  format: Joi.string().valid('json', 'csv', 'excel').required()
})

// Generic validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body)
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ')
      throw createError(`Validation error: ${message}`, 400)
    }
    
    next()
  }
}

// File validation middleware
export const validateFile = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.file) {
    throw createError('No file provided', 400)
  }

  const { originalname, mimetype, size, buffer } = req.file

  // Validate file properties
  if (!originalname || !originalname.toLowerCase().endsWith('.pdf')) {
    throw createError('File must be a PDF with .pdf extension', 400)
  }

  if (mimetype !== 'application/pdf') {
    throw createError('File must be a PDF (application/pdf)', 400)
  }

  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB
  if (size > maxSize) {
    throw createError(`File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`, 400)
  }

  if (!buffer || buffer.length === 0) {
    throw createError('File appears to be empty', 400)
  }

  // Validate PDF magic number
  const pdfSignature = buffer.slice(0, 5).toString()
  if (pdfSignature !== '%PDF-') {
    throw createError('File does not appear to be a valid PDF', 400)
  }

  // Check for password protection (basic check)
  const bufferString = buffer.toString('binary')
  if (bufferString.includes('/Encrypt')) {
    throw createError('Password-protected PDFs are not supported', 400)
  }

  next()
}

// Sanitize filename
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace non-alphanumeric chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase()
}

// Rate limiting validation
export const validateRateLimit = (_req: Request, _res: Response, next: NextFunction) => {
  // Additional rate limiting logic can be added here
  // For now, we rely on the express-rate-limit middleware
  next()
}

// Content type validation for JSON requests
export const validateJSON = (req: Request, _res: Response, next: NextFunction) => {
  if (req.method === 'POST' && req.path !== '/extract') { // Skip for file uploads
    const contentType = req.headers['content-type']
    if (!contentType || !contentType.includes('application/json')) {
      throw createError('Content-Type must be application/json', 400)
    }
  }
  next()
}