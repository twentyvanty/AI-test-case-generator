// Errors thrown by AI providers. The orchestrator decides what to do with them.

export class ProviderError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: unknown, status?: number, code?: string, fatal?: boolean }} [options]
   */
  constructor(message, { cause, status, code, fatal = false } = {}) {
    super(message, { cause });
    this.name = "ProviderError";
    this.status = status;
    // "INVALID_JSON" when the model answered with text that isn't JSON
    this.code = code;
    // true = retrying can't help (quota, bad key): the pipeline stops at once
    this.fatal = fatal;
  }
}

// Rate limit / quota reached (HTTP 429). Retrying immediately won't help,
// so the pipeline stops instead of using up its attempts.
export class ProviderQuotaError extends ProviderError {
  constructor(message, options = {}) {
    super(message, { ...options, status: options.status ?? 429 });
    this.name = "ProviderQuotaError";
    this.fatal = true;
  }
}

// The provider's servers are overloaded/down (HTTP 5xx) even after waiting,
// retrying and trying the fallback model. Try again later — stop.
export class ProviderUnavailableError extends ProviderError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "ProviderUnavailableError";
    this.fatal = true;
  }
}

// Wrong/missing API key or no access to the model. Needs a config fix — stop.
export class ProviderAuthError extends ProviderError {
  constructor(message, options = {}) {
    super(message, options);
    this.name = "ProviderAuthError";
    this.fatal = true;
  }
}
