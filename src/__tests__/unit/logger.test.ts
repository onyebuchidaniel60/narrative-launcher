import { describe, it, expect } from 'vitest';
import { createLogger, REDACTION_PATHS } from '../../logger.js';
import { Writable } from 'node:stream';

describe('Logger (Pino with Redaction)', () => {
  it('redacts secret keys from log output', () => {
    let output = '';
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });

    const testLogger = createLogger({}, destination);

    testLogger.info({ apiKey: 'sk-LEAKTEST123', safeField: 'safeValue' }, 'testing secret redaction');

    expect(output).not.toContain('sk-LEAKTEST123');
    expect(output).toContain('[Redacted]');
    expect(output).toContain('safeValue');
  });

  it('redacts nested keys matching wildcard redaction paths', () => {
    let output = '';
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });

    const testLogger = createLogger({}, destination);

    testLogger.info(
      {
        nested: {
          token: 'secret-token-456',
          privateKey: 'secret-privkey-789',
        },
      },
      'testing nested secrets'
    );

    expect(output).not.toContain('secret-token-456');
    expect(output).not.toContain('secret-privkey-789');
    expect(output).toContain('[Redacted]');
  });
});
