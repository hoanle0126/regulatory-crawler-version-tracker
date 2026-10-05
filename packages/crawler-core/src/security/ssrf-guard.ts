import { lookup } from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export interface ISsrfValidationOptions {
  allowLocalhost?: boolean;
  allowedHosts?: string[];
}

export interface ISsrfValidationResult {
  safe: boolean;
  resolvedIp?: string;
  reason?: string;
}

export class SsrfGuard {
  private static readonly ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
  private static readonly METADATA_HOSTNAMES = new Set([
    'metadata.google.internal',
    'metadata',
    '169.254.169.254',
    'instance-data',
  ]);

  /**
   * Validates whether a target URL is safe against SSRF attacks.
   */
  public static async validateUrl(
    urlString: string,
    options: ISsrfValidationOptions = {}
  ): Promise<ISsrfValidationResult> {
    if (!urlString || typeof urlString !== 'string') {
      return { safe: false, reason: 'URL is required and must be a string' };
    }

    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return { safe: false, reason: 'Malformed or invalid URL syntax' };
    }

    // 1. Validate protocol
    if (!this.ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return {
        safe: false,
        reason: `Unsupported protocol: ${parsed.protocol}. Only http: and https: are allowed.`,
      };
    }

    const hostname = parsed.hostname.toLowerCase();
    const cleanHost = hostname.replace(/^\[|\]$/g, '');

    // 2. Reject cloud metadata hostnames
    if (this.METADATA_HOSTNAMES.has(hostname) || this.METADATA_HOSTNAMES.has(cleanHost)) {
      return { safe: false, reason: 'Cloud metadata endpoint access is blocked' };
    }

    // 3. Check allowed hosts whitelist (for local demo sources / integration tests)
    const hostWithPort = parsed.port ? `${hostname}:${parsed.port}` : hostname;
    if (
      options.allowedHosts &&
      (options.allowedHosts.includes(hostname) ||
        options.allowedHosts.includes(cleanHost) ||
        options.allowedHosts.includes(hostWithPort))
    ) {
      return { safe: true };
    }

    // 4. Check localhost override
    if (
      options.allowLocalhost &&
      (cleanHost === 'localhost' || cleanHost === '127.0.0.1' || cleanHost === '::1')
    ) {
      return { safe: true, resolvedIp: cleanHost };
    }

    // 5. Block explicit localhost names if not allowed
    if (
      cleanHost === 'localhost' ||
      cleanHost.endsWith('.localhost') ||
      cleanHost === '0.0.0.0' ||
      cleanHost === '::1'
    ) {
      return { safe: false, reason: `Loopback address blocked: ${hostname}` };
    }

    // 6. Resolve DNS to verify all underlying IP addresses
    let addresses: string[] = [];
    try {
      // If cleanHost is already an IP address
      if (ipaddr.isValid(cleanHost)) {
        addresses = [cleanHost];
      } else {
        const lookupResult = await lookup(cleanHost, { all: true });
        addresses = lookupResult.map((res) => res.address);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { safe: false, reason: `DNS resolution failed for hostname "${hostname}": ${msg}` };
    }

    if (addresses.length === 0) {
      return { safe: false, reason: `No IP addresses found for hostname "${hostname}"` };
    }

    // 7. Verify each resolved IP address
    for (const ipStr of addresses) {
      const check = this.validateIp(ipStr, options);
      if (!check.safe) {
        return { safe: false, resolvedIp: ipStr, reason: check.reason };
      }
    }

    return { safe: true, resolvedIp: addresses[0] };
  }

  /**
   * Validates whether a single IP address (IPv4 or IPv6) is public and safe.
   */
  public static validateIp(ipStr: string, options: ISsrfValidationOptions = {}): ISsrfValidationResult {
    try {
      let addr = ipaddr.parse(ipStr);

      // Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1)
      if (addr.kind() === 'ipv6') {
        const ipv6 = addr as ipaddr.IPv6;
        if (ipv6.isIPv4MappedAddress()) {
          addr = ipv6.toIPv4Address();
        }
      }

      const range = addr.range();

      // Check range classifications
      if (range === 'loopback') {
        if (options.allowLocalhost) return { safe: true, resolvedIp: ipStr };
        return { safe: false, reason: `Loopback address blocked: ${ipStr}` };
      }

      if (range === 'private') {
        return { safe: false, reason: `RFC 1918 Private IP address blocked: ${ipStr}` };
      }

      if (range === 'linkLocal') {
        return { safe: false, reason: `Link-local IP address blocked (metadata/autoconf): ${ipStr}` };
      }

      if (range === 'carrierGradeNat') {
        return { safe: false, reason: `Carrier-grade NAT IP address blocked: ${ipStr}` };
      }

      if (range === 'unspecified') {
        return { safe: false, reason: `Unspecified IP address blocked: ${ipStr}` };
      }

      if (range === 'broadcast') {
        return { safe: false, reason: `Broadcast IP address blocked: ${ipStr}` };
      }

      if (range === 'uniqueLocal') {
        return { safe: false, reason: `IPv6 Unique Local Address blocked: ${ipStr}` };
      }

      // Check specifically for AWS/GCP/Azure link-local metadata address 169.254.169.254
      if (addr.toString() === '169.254.169.254') {
        return { safe: false, reason: 'Cloud metadata IP address 169.254.169.254 is strictly blocked' };
      }

      return { safe: true, resolvedIp: ipStr };
    } catch {
      return { safe: false, reason: `Invalid IP format: ${ipStr}` };
    }
  }
}
