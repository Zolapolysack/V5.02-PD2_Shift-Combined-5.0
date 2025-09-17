#!/usr/bin/env node
/**
 * Generate a cryptographically strong API token for API_TOKEN.
 * Default length: 48 bytes -> base64url ~ 64 chars.
 */
import { randomBytes } from 'crypto';

const bytes = Number(process.argv[2]) || 48;
if (bytes < 24) {
  console.error('Refusing to generate token smaller than 24 bytes.');
  process.exit(1);
}
const token = randomBytes(bytes).toString('base64')
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); // base64url
console.log(token);
