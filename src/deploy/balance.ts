import { Connection, PublicKey } from '@solana/web3.js';
import { getConfig, type Config } from '../config.js';

export const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Strip credentials and query parameters from an RPC URL before it is logged
 * or embedded in an error. Provider URLs commonly carry API keys in the query
 * string, and pino redaction only matches object keys, not substrings.
 */
export function sanitizeRpcUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const pathname = url.pathname === '/' ? '' : url.pathname;
    return `${url.protocol}//${url.host}${pathname}`;
  } catch {
    return '[invalid RPC URL]';
  }
}

function sanitizeErrorText(text: string): string {
  return text.replace(/https?:\/\/[^\s"'<>]+/g, (url) => sanitizeRpcUrl(url));
}

export async function getBurnerBalance(customConfig?: Config): Promise<number> {
  const config = customConfig || getConfig();

  let pubkey: PublicKey;
  try {
    pubkey = new PublicKey(config.BURNER_WALLET_PUBLIC_KEY);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid BURNER_WALLET_PUBLIC_KEY base58 format: ${msg}`);
  }

  let connection: Connection;
  try {
    connection = new Connection(config.SOLANA_RPC_URL, {
      commitment: 'confirmed',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to initialize Solana Connection to ${sanitizeRpcUrl(config.SOLANA_RPC_URL)}: ${sanitizeErrorText(msg)}`
    );
  }

  try {
    const lamports = await connection.getBalance(pubkey);
    // @solana/web3.js v3 returns Lamports as a branded bigint. Converting to
    // Number is safe for this bot: balances and dev buys are far below
    // Number.MAX_SAFE_INTEGER (9,007,199,254,740,991 lamports ≈ 9M SOL).
    return Number(lamports) / LAMPORTS_PER_SOL;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch Solana burner balance from ${sanitizeRpcUrl(config.SOLANA_RPC_URL)}: ${sanitizeErrorText(msg)}`
    );
  }
}
