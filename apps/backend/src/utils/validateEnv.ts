// env.ts
import Joi from "joi";

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(5000),

  // API Keys — allow either; require at least one via .or()
  OPENAI_API_KEY: Joi.string().trim().optional(),
  ANTHROPIC_API_KEY: Joi.string().trim().optional(),

  // Server Configuration
  CORS_ORIGIN: Joi.string().uri().default("http://localhost:3000"),

  // File Upload Configuration
  MAX_FILE_SIZE: Joi.number().positive().default(104857600), // 100MB
  UPLOAD_DIR: Joi.string().default("./uploads"),
  TEMP_DIR: Joi.string().default("./temp"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().positive().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().positive().default(100),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug")
    .default("info"),
})
  .or("OPENAI_API_KEY", "ANTHROPIC_API_KEY")
  .messages({
    "object.missing":
      "At least one of OPENAI_API_KEY or ANTHROPIC_API_KEY must be provided",
  })
  .unknown(true);

export const validateEnv = (): void => {
  const { error } = envSchema.validate(process.env, {
    abortEarly: false,
  });

  if (error) {
    console.error("❌ Environment validation failed:");
    console.error(error.details.map((d) => `  - ${d.message}`).join("\n"));
    process.exit(1);
  }

  console.log("✅ Environment variables validated successfully");
};
