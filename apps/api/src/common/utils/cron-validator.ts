export interface ICronValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateCronExpression(cron: string): ICronValidationResult {
  if (!cron || typeof cron !== 'string') {
    return { valid: false, reason: 'Cron expression must be a non-empty string' };
  }

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      valid: false,
      reason: `Cron expression must contain exactly 5 space-separated fields (minute, hour, day-of-month, month, day-of-week). Received ${parts.length} fields.`,
    };
  }

  const min = parts[0]!;
  const hour = parts[1]!;
  const dom = parts[2]!;
  const mon = parts[3]!;
  const dow = parts[4]!;

  // Rate-limiting check: Prevent accidental denial-of-service to government / regulatory sources
  if (min === '*' || min === '*/1' || min === '*/2' || min === '*/3' || min === '*/4') {
    return {
      valid: false,
      reason: 'Crawl frequency is too aggressive. Minimum allowed interval is 5 minutes (e.g. "*/5 * * * *" or "0 * * * *").',
    };
  }

  // Basic regex validation for 5 standard cron fields
  const minPattern = /^(\*|\*\/([1-5]?[0-9])|([0-5]?[0-9])(-([0-5]?[0-9]))?(,([0-5]?[0-9])(-([0-5]?[0-9]))?)*)$/;
  const hourPattern = /^(\*|\*\/([1-2]?[0-9])|([0-1]?[0-9]|2[0-3])(-([0-1]?[0-9]|2[0-3]))?(,([0-1]?[0-9]|2[0-3])(-([0-1]?[0-9]|2[0-3]))?)*)$/;
  const domPattern = /^(\*|\*\/([1-3]?[0-9])|([1-9]|[12][0-9]|3[01])(-([1-9]|[12][0-9]|3[01]))?(,([1-9]|[12][0-9]|3[01])(-([1-9]|[12][0-9]|3[01]))?)*)$/;
  const monPattern = /^(\*|\*\/([1-9]|1[0-2])|([1-9]|1[0-2])(-([1-9]|1[0-2]))?(,([1-9]|1[0-2])(-([1-9]|1[0-2]))?)*)$/;
  const dowPattern = /^(\*|\*\/[1-7]|([0-7])(-([0-7]))?(,([0-7])(-([0-7]))?)*)$/;

  if (!minPattern.test(min)) {
    return { valid: false, reason: `Invalid minute field in cron expression: "${min}"` };
  }
  if (!hourPattern.test(hour)) {
    return { valid: false, reason: `Invalid hour field in cron expression: "${hour}"` };
  }
  if (!domPattern.test(dom)) {
    return { valid: false, reason: `Invalid day-of-month field in cron expression: "${dom}"` };
  }
  if (!monPattern.test(mon)) {
    return { valid: false, reason: `Invalid month field in cron expression: "${mon}"` };
  }
  if (!dowPattern.test(dow)) {
    return { valid: false, reason: `Invalid day-of-week field in cron expression: "${dow}"` };
  }

  return { valid: true };
}
