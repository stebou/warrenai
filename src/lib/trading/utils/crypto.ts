import crypto from 'crypto';

export function encrypt(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}