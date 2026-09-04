/**
 * Typed environment configuration.
 *
 * Reads values from Vite's `import.meta.env`, applies local-development
 * defaults, and validates that all required values are present. The
 * validation logic is exposed as a pure, total function (`validateEnv`) so it
 * can be unit- and property-tested without depending on `import.meta`.
 *
 * Design: Environment Config (Property 7 — env validation completeness).
 * Requirements: 11.1, 11.2, 11.3, 11.4.
 */

export interface EnvConfig {
  apiBaseUrl: string;
  authBypass: boolean;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  cognitoRegion: string;
}

/** Any source of environment values (the real `import.meta.env` or a plain record for tests). */
type EnvSource = ImportMetaEnv | Record<string, unknown>;

/** Local-development defaults. */
const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEFAULT_AUTH_BYPASS = false;

interface ReadOptions<T> {
  /** When true and the value is absent with no default, a config error is recorded. */
  required: boolean;
  /** Default applied when the value is absent. `undefined` means "no default". */
  default?: T;
  /** Accumulator for descriptive configuration errors. */
  errors: string[];
}

/**
 * Coerce a raw env value into a non-empty trimmed string, or `undefined` when
 * it is absent/blank/non-string.
 */
function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

/**
 * Read a string variable, applying a default when absent. Records a descriptive
 * error when the value is required and there is neither a value nor a default.
 */
function readString(
  source: Record<string, unknown>,
  key: string,
  options: ReadOptions<string>,
): string | undefined {
  const value = coerceString(source[key]);

  if (value !== undefined) {
    return value;
  }

  if (options.default !== undefined) {
    return options.default;
  }

  if (options.required) {
    options.errors.push(
      `Missing required environment variable "${key}" and no default value is available.`,
    );
  }

  return undefined;
}

/**
 * Read a boolean-ish variable ("true"/"false"), applying a default when absent.
 * Records a descriptive error for required-without-default values and for
 * values that are neither "true" nor "false".
 */
function readBoolean(
  source: Record<string, unknown>,
  key: string,
  options: ReadOptions<boolean>,
): boolean | undefined {
  const raw = source[key];

  if (typeof raw === 'boolean') {
    return raw;
  }

  const str = coerceString(raw)?.toLowerCase();

  if (str === undefined) {
    if (options.default !== undefined) {
      return options.default;
    }

    if (options.required) {
      options.errors.push(
        `Missing required environment variable "${key}" and no default value is available.`,
      );
    }

    return undefined;
  }

  if (str === 'true') {
    return true;
  }

  if (str === 'false') {
    return false;
  }

  options.errors.push(
    `Environment variable "${key}" must be "true" or "false", but received "${String(raw)}".`,
  );

  return undefined;
}

/**
 * Validate and normalize an environment source into a typed {@link EnvConfig}.
 *
 * Pure and total: for any input missing a required value that has no default,
 * it throws a descriptive configuration error; for any input that supplies all
 * required values (directly or via defaults), it returns a fully populated
 * {@link EnvConfig}.
 *
 * @param env - Environment source. Defaults to Vite's `import.meta.env`.
 */
export function validateEnv(env: EnvSource = import.meta.env): EnvConfig {
  const source = env as Record<string, unknown>;
  const errors: string[] = [];

  const apiBaseUrl = readString(source, 'VITE_API_BASE_URL', {
    required: true,
    default: DEFAULT_API_BASE_URL,
    errors,
  });

  const authBypass = readBoolean(source, 'VITE_AUTH_BYPASS', {
    required: false,
    default: DEFAULT_AUTH_BYPASS,
    errors,
  });

  const cognitoUserPoolId = readString(source, 'VITE_COGNITO_USER_POOL_ID', {
    required: true,
    errors,
  });

  const cognitoClientId = readString(source, 'VITE_COGNITO_CLIENT_ID', {
    required: true,
    errors,
  });

  const cognitoRegion = readString(source, 'VITE_COGNITO_REGION', {
    required: true,
    errors,
  });

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n${errors
        .map((message) => `  - ${message}`)
        .join('\n')}`,
    );
  }

  // Non-null assertions are safe here: the error accumulator above guarantees
  // that any absent required-without-default value would have thrown.
  return {
    apiBaseUrl: apiBaseUrl!,
    authBypass: authBypass!,
    cognitoUserPoolId: cognitoUserPoolId!,
    cognitoClientId: cognitoClientId!,
    cognitoRegion: cognitoRegion!,
  };
}

/**
 * Application environment configuration, validated at module load time.
 *
 * Importing this module runs {@link validateEnv} against `import.meta.env`, so
 * a misconfigured environment halts startup with a descriptive error.
 */
export const env: EnvConfig = validateEnv();