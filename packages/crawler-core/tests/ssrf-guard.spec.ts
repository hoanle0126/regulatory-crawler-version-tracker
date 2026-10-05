import { describe, it, expect } from 'vitest';
import { SsrfGuard } from '../src/security/ssrf-guard.js';

describe('SsrfGuard - Security & IP Validation (Prompt Sections 10 & 52)', () => {
  it('blocks loopback address http://localhost', async () => {
    const res = await SsrfGuard.validateUrl('http://localhost');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/localhost|loopback/i);
  });

  it('blocks IPv4 loopback http://127.0.0.1', async () => {
    const res = await SsrfGuard.validateUrl('http://127.0.0.1');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/loopback/i);
  });

  it('blocks unspecified IP http://0.0.0.0', async () => {
    const res = await SsrfGuard.validateUrl('http://0.0.0.0');
    expect(res.safe).toBe(false);
  });

  it('blocks cloud metadata endpoint http://169.254.169.254', async () => {
    const res = await SsrfGuard.validateUrl('http://169.254.169.254/latest/meta-data/');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/metadata/i);
  });

  it('blocks Google cloud metadata hostname http://metadata.google.internal', async () => {
    const res = await SsrfGuard.validateUrl('http://metadata.google.internal/computeMetadata/v1/');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/metadata/i);
  });

  it('blocks RFC 1918 10.0.0.0/8 private network', async () => {
    const res = await SsrfGuard.validateUrl('http://10.0.1.5:8080/admin');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/private/i);
  });

  it('blocks RFC 1918 172.16.0.0/12 private network', async () => {
    const res = await SsrfGuard.validateUrl('http://172.20.0.5:5432');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/private/i);
  });

  it('blocks RFC 1918 192.168.0.0/16 private network', async () => {
    const res = await SsrfGuard.validateUrl('http://192.168.1.100');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/private/i);
  });

  it('blocks IPv6 loopback http://[::1]', async () => {
    const res = await SsrfGuard.validateUrl('http://[::1]:8080');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/loopback/i);
  });

  it('blocks non-HTTP protocols (file, ftp, javascript, gopher)', async () => {
    const fileRes = await SsrfGuard.validateUrl('file:///etc/passwd');
    expect(fileRes.safe).toBe(false);
    expect(fileRes.reason).toMatch(/unsupported protocol/i);

    const ftpRes = await SsrfGuard.validateUrl('ftp://example.com/files');
    expect(ftpRes.safe).toBe(false);

    const jsRes = await SsrfGuard.validateUrl('javascript:alert(1)');
    expect(jsRes.safe).toBe(false);

    const gopherRes = await SsrfGuard.validateUrl('gopher://example.com');
    expect(gopherRes.safe).toBe(false);
  });

  it('rejects malformed URLs', async () => {
    const res = await SsrfGuard.validateUrl('not-a-valid-url');
    expect(res.safe).toBe(false);
    expect(res.reason).toMatch(/malformed/i);
  });

  it('permits localhost only when explicitly allowed for testing', async () => {
    const defaultRes = await SsrfGuard.validateUrl('http://localhost:5101');
    expect(defaultRes.safe).toBe(false);

    const allowedRes = await SsrfGuard.validateUrl('http://localhost:5101', {
      allowLocalhost: true,
    });
    expect(allowedRes.safe).toBe(true);
  });

  it('permits designated allowedHosts whitelist for local demo service', async () => {
    const res = await SsrfGuard.validateUrl('http://demo-source:5101/listing', {
      allowedHosts: ['demo-source:5101'],
    });
    expect(res.safe).toBe(true);
  });
});
