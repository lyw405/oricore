/**
 * Configuration Validation
 * Runtime validation for engine configuration
 */

import type { Config, McpServerConfig } from './config';
import { z } from 'zod';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  path: string;
  message: string;
  value?: any;
}

/**
 * MCP server configuration schema
 */
const McpServerConfigSchema = z.object({
  type: z.enum(['stdio', 'sse', 'http']).optional(),
  command: z.string().optional(),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
  url: z.string().optional(),
  disable: z.boolean().optional(),
  timeout: z.number().positive().optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

/**
 * Provider configuration schema
 */
const ProviderConfigSchema = z.object({
  apiKey: z.string().optional(),
  apiKeys: z.array(z.string()).optional(),
  baseURL: z.string().optional(),
  proxy: z.string().optional(),
});

/**
 * Agent configuration schema
 */
const AgentConfigSchema = z.object({
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  forkContext: z.boolean().optional(),
  color: z.string().optional(),
});

/**
 * Main configuration schema
 */
const ConfigSchema = z.object({
  // Model configuration
  model: z.string().min(1, 'Model cannot be empty'),
  planModel: z.string().optional(),
  smallModel: z.string().optional(),
  visionModel: z.string().optional(),

  // Behavior configuration
  language: z.string().optional(),
  quiet: z.boolean().optional(),
  approvalMode: z.enum(['default', 'autoEdit', 'yolo']).optional(),
  autoCompact: z.boolean().optional(),
  temperature: z
    .number()
    .min(0, 'Temperature must be at least 0')
    .max(2, 'Temperature must be at most 2')
    .optional(),

  // Feature flags
  plugins: z.array(z.string()).optional(),
  tools: z.record(z.string(), z.boolean()).optional(),
  todo: z.boolean().optional(),

  // MCP servers
  mcpServers: z.record(z.string(), z.any()).optional(), // Validated separately

  // Provider extensions
  provider: z.record(z.string(), z.any()).optional(), // Validated separately

  // Extensions
  extensions: z.record(z.string(), z.any()).optional(),

  // Agents
  agent: z.record(z.string(), z.any()).optional(), // Validated separately
});

/**
 * Validate a configuration object
 */
export function validateConfig(config: Partial<Config>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate main config structure
  const mainResult = ConfigSchema.safeParse(config);
  if (!mainResult.success) {
    for (const issue of mainResult.error.issues) {
      errors.push({
        path: issue.path.join('.'),
        message: issue.message,
        value: getNestedValue(config, issue.path as (string | number)[]),
      });
    }
  }

  // Validate MCP servers if present
  if (config.mcpServers) {
    for (const [name, mcpConfig] of Object.entries(config.mcpServers)) {
      const mcpResult = McpServerConfigSchema.safeParse(mcpConfig);
      if (!mcpResult.success) {
        for (const issue of mcpResult.error.issues) {
          errors.push({
            path: `mcpServers.${name}.${issue.path.join('.')}`,
            message: issue.message,
            value: getNestedValue(mcpConfig, issue.path as (string | number)[]),
          });
        }
      }

      // Additional validation: MCP server must have either command or url
      const mcp = mcpConfig as any;
      if (!mcp.disable && !mcp.command && !mcp.url) {
        errors.push({
          path: `mcpServers.${name}`,
          message: 'MCP server must have either "command" or "url" configured',
          value: mcp,
        });
      }

      // Warning: stdio type requires command
      if (mcp.type === 'stdio' && !mcp.command) {
        warnings.push({
          path: `mcpServers.${name}`,
          message: 'stdio MCP server type requires "command" to be set',
          value: mcp,
        });
      }

      // Warning: http/sse type requires url
      if ((mcp.type === 'http' || mcp.type === 'sse') && !mcp.url) {
        warnings.push({
          path: `mcpServers.${name}`,
          message: `${mcp.type} MCP server type requires "url" to be set`,
          value: mcp,
        });
      }
    }
  }

  // Validate provider configs if present
  if (config.provider) {
    for (const [name, providerConfig] of Object.entries(config.provider)) {
      const providerResult = ProviderConfigSchema.safeParse(providerConfig);
      if (!providerResult.success) {
        for (const issue of providerResult.error.issues) {
          errors.push({
            path: `provider.${name}.${issue.path.join('.')}`,
            message: issue.message,
            value: getNestedValue(providerConfig, issue.path as (string | number)[]),
          });
        }
      }

      // Warning: Multiple API keys detected but no apiKey (single)
      const provider = providerConfig as any;
      if (provider.apiKeys && provider.apiKeys.length > 1 && !provider.apiKey) {
        warnings.push({
          path: `provider.${name}`,
          message: 'Multiple API keys detected - rotation will be used',
          value: { apiKeyCount: provider.apiKeys.length },
        });
      }
    }
  }

  // Validate agent configs if present
  if (config.agent) {
    for (const [name, agentConfig] of Object.entries(config.agent)) {
      const agentResult = AgentConfigSchema.safeParse(agentConfig);
      if (!agentResult.success) {
        for (const issue of agentResult.error.issues) {
          errors.push({
            path: `agent.${name}.${issue.path.join('.')}`,
            message: issue.message,
            value: getNestedValue(agentConfig, issue.path as (string | number)[]),
          });
        }
      }
    }
  }

  // Validate temperature range
  if (config.temperature !== undefined) {
    if (config.temperature < 0 || config.temperature > 2) {
      errors.push({
        path: 'temperature',
        message: 'Temperature must be between 0 and 2',
        value: config.temperature,
      });
    }
  }

  // Validate language code format
  if (config.language) {
    const languageCodeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (!languageCodeRegex.test(config.language)) {
      warnings.push({
        path: 'language',
        message: 'Language code should be in ISO 639-1 format (e.g., "en", "zh-CN")',
        value: config.language,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get nested value from object using path array
 */
function getNestedValue(obj: any, path: (string | number)[]): any {
  let current = obj;
  for (const key of path) {
    if (current == null) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('Configuration errors:');
    for (const error of result.errors) {
      const valueStr =
        error.value !== undefined ? ` (got: ${JSON.stringify(error.value)})` : '';
      lines.push(`  - ${error.path}: ${error.message}${valueStr}`);
    }
  }

  if (result.warnings.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('Configuration warnings:');
    for (const warning of result.warnings) {
      const valueStr =
        warning.value !== undefined
          ? ` (value: ${JSON.stringify(warning.value)})`
          : '';
      lines.push(`  - ${warning.path}: ${warning.message}${valueStr}`);
    }
  }

  return lines.join('\n');
}

/**
 * Assert that configuration is valid, throws if not
 */
export function assertValidConfig(config: Partial<Config>): void {
  const result = validateConfig(config);
  if (!result.valid) {
    throw new Error(
      `Invalid configuration:\n${formatValidationErrors(result)}`,
    );
  }
}
