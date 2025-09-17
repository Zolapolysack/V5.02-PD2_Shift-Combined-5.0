
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

// Expanded sensitive keywords for internal deployment hardening
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apikey', 'auth', 'credential', 'bearer'];
const MASK = '[MASKED]';

function maskSensitiveObject(obj, fields = SENSITIVE_FIELDS) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveObject(item, fields));
  }
  const masked = {};
  for (const key of Object.keys(obj)) {
    if (fields.some(f => key.toLowerCase().includes(f))) {
      masked[key] = MASK;
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      masked[key] = maskSensitiveObject(obj[key], fields);
    } else {
      masked[key] = obj[key];
    }
  }
  return masked;
}

const maskFormat = format((info) => {
  // Mask message if it's an object or JSON string
  if (typeof info.message === 'object') {
    info.message = maskSensitiveObject(info.message);
  } else if (typeof info.message === 'string') {
    try {
      const parsed = JSON.parse(info.message);
      info.message = JSON.stringify(maskSensitiveObject(parsed));
    } catch {
      // Not JSON, mask string directly
      SENSITIVE_FIELDS.forEach(f => {
        try {
          // Replace occurrences like token=xxxx, token:"xxxx", bearer abc123
          info.message = info.message.replace(new RegExp(`(${f})(\s*[:=]\s*"?[A-Za-z0-9._-]{2,})`, 'gi'), `$1:${MASK}`);
        } catch(_) {}
      });
    }
  }
  // Mask meta fields (all except level, message, timestamp, splat)
  for (const key of Object.keys(info)) {
    if (!['level', 'message', 'timestamp', 'splat'].includes(key)) {
      if (typeof info[key] === 'object' && info[key] !== null) {
        info[key] = maskSensitiveObject(info[key]);
      }
    }
  }
  return info;
});


const logger = createLogger({
  level: 'info',
  format: format.combine(
    maskFormat(),
    format.timestamp(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true
    })
  ]
});

export default logger;
