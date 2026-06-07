/**
 * 安全工具函数
 */

// ============ 分页参数校验 (CVE-13) ============

export function sanitizePage(pageStr: string | null, defaultVal = 1): number {
  const val = parseInt(pageStr || String(defaultVal));
  return Math.max(1, val || defaultVal);
}

export function sanitizePageSize(pageSizeStr: string | null, defaultVal = 20, maxVal = 100): number {
  const val = parseInt(pageSizeStr || String(defaultVal));
  return Math.min(maxVal, Math.max(1, val || defaultVal));
}

// ============ URL 安全校验 (CVE-9) ============

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

// ============ SSRF 防护 (CVE-7) ============

export function isSafeImageUrl(urlStr: string): boolean {
  if (!isValidUrl(urlStr)) return false;
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();

    // 基础黑名单
    const blocked = [
      "127.0.0.1", "localhost", "0.0.0.0",
      "169.254.169.254", // 云元数据
      "::1", // IPv6 localhost
      "0177.0.0.1", // 八进制 127.0.0.1
      "0x7f.0.0.1", // 十六进制 127.0.0.1
      "2130706433", // 十进制 127.0.0.1
    ];
    if (blocked.includes(hostname)) return false;

    // IPv4 映射的 IPv6 地址 (::ffff:127.0.0.1 等)
    if (/^::ffff:/i.test(hostname)) return false;

    // 10.0.0.0/8
    if (/^10\./.test(hostname)) return false;
    // 172.16.0.0/12
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) return false;
    // 192.168.0.0/16
    if (/^192\.168\./.test(hostname)) return false;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (/^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./.test(hostname)) return false;
    // 198.18.0.0/15 (基准测试)
    if (/^198\.(1[8-9])\./.test(hostname)) return false;

    // 禁止纯数字主机名（十进制 IP 绕过）
    if (/^\d+$/.test(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

// ============ siteIcon 安全校验 ============

const SAFE_DATA_URI_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/;
const MAX_DATA_URI_LENGTH = 512 * 1024; // 512KB

export function isSafeSiteIcon(icon: string): boolean {
  if (!icon) return true; // 空值允许（使用默认图标）
  // 允许相对路径
  if (icon.startsWith("/")) return true;
  // data URI：仅允许安全图片格式
  if (icon.startsWith("data:")) {
    if (icon.length > MAX_DATA_URI_LENGTH) return false;
    return SAFE_DATA_URI_PATTERN.test(icon);
  }
  // HTTPS/HTTP URL：SSRF 检查
  return isSafeImageUrl(icon);
}

// ============ 代码提交校验 (CVE-11, CVE-12) ============

export const MAX_CODE_LENGTH = 65536; // 64KB

export const ALLOWED_LANGUAGES = [
  "cpp", "c", "java", "python3", "python2",
  "go", "csharp", "php", "javascript", "ruby", "rust",
];

export function validateCodeAndLanguage(code: string, language: string): string | null {
  if (code.length > MAX_CODE_LENGTH) {
    return `代码长度超出限制（最大 ${MAX_CODE_LENGTH} 字符）`;
  }
  if (language && !ALLOWED_LANGUAGES.includes(language)) {
    return `不支持的语言: ${language}`;
  }
  return null;
}

// ============ 登录暴力破解防护 (CVE-8) — 同时基于 email 和 IP ============

interface LoginAttempt {
  count: number;
  lastAttempt: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_LOGIN_ATTEMPTS_PER_IP = 20;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 分钟

export function checkLoginRateLimit(email: string, ip?: string): boolean {
  // Email 维度限频
  const emailKey = `email:${email}`;
  const emailAttempt = loginAttempts.get(emailKey);
  if (emailAttempt && emailAttempt.count >= MAX_LOGIN_ATTEMPTS) {
    const lockoutEnd = emailAttempt.lastAttempt + LOGIN_LOCKOUT_MS;
    if (Date.now() < lockoutEnd) return false;
    loginAttempts.delete(emailKey);
  }

  // IP 维度限频
  if (ip) {
    const ipKey = `ip:${ip}`;
    const ipAttempt = loginAttempts.get(ipKey);
    if (ipAttempt && ipAttempt.count >= MAX_LOGIN_ATTEMPTS_PER_IP) {
      const lockoutEnd = ipAttempt.lastAttempt + LOGIN_LOCKOUT_MS;
      if (Date.now() < lockoutEnd) return false;
      loginAttempts.delete(ipKey);
    }
  }

  return true;
}

export function recordLoginFailure(email: string, ip?: string): void {
  const emailKey = `email:${email}`;
  const emailCurrent = loginAttempts.get(emailKey) || { count: 0, lastAttempt: 0 };
  loginAttempts.set(emailKey, { count: emailCurrent.count + 1, lastAttempt: Date.now() });

  if (ip) {
    const ipKey = `ip:${ip}`;
    const ipCurrent = loginAttempts.get(ipKey) || { count: 0, lastAttempt: 0 };
    loginAttempts.set(ipKey, { count: ipCurrent.count + 1, lastAttempt: Date.now() });
  }
}

export function clearLoginAttempts(email: string, ip?: string): void {
  loginAttempts.delete(`email:${email}`);
  if (ip) loginAttempts.delete(`ip:${ip}`);
}

// ============ 注册速率限制 (CVE-10) ============

interface RegisterAttempt {
  count: number;
  lastAttempt: number;
}

const registerAttempts = new Map<string, RegisterAttempt>();
const REGISTER_WINDOW_MS = 60 * 60 * 1000; // 1 小时

export function checkRegisterRateLimit(ip: string, maxRegisters: number): boolean {
  if (maxRegisters === 0) return true; // 0 = 不限制
  const attempt = registerAttempts.get(ip);
  if (!attempt) return true;

  const windowEnd = attempt.lastAttempt + REGISTER_WINDOW_MS;
  if (Date.now() > windowEnd) {
    registerAttempts.delete(ip);
    return true;
  }

  return attempt.count < maxRegisters;
}

export function recordRegisterAttempt(ip: string): void {
  const current = registerAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  registerAttempts.set(ip, { count: current.count + 1, lastAttempt: Date.now() });
}

// ============ 定期清理内存 Map，防止内存泄漏 ============

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // 15 分钟

function cleanupExpiredEntries(map: Map<string, LoginAttempt | RegisterAttempt>, maxAgeMs: number): void {
  const now = Date.now();
  for (const [key, val] of map) {
    if (now - val.lastAttempt > maxAgeMs) {
      map.delete(key);
    }
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    cleanupExpiredEntries(loginAttempts, LOGIN_LOCKOUT_MS);
    cleanupExpiredEntries(registerAttempts, REGISTER_WINDOW_MS);
  }, CLEANUP_INTERVAL_MS);
}

// ============ 生产环境密钥检查 (CVE-6) ============

const WEAK_SECRETS = [
  "loj-dev-secret-change-in-production",
  "secret",
  "changeme",
  "password",
];

export function validateAuthSecret(): void {
  if (process.env.NEXT_PHASE) return;
  if (!process.env.NEXTAUTH_SECRET) {
    // 自动生成（每次部署生成新的，用户通过 /init 配置后持久化到数据库）
    const crypto = require("crypto") as typeof import("crypto");
    process.env.NEXTAUTH_SECRET = crypto.randomBytes(32).toString("base64");
    console.warn("[Auth] NEXTAUTH_SECRET auto-generated. Set it in env for persistence.");
  }
  if (process.env.NODE_ENV === "production" && WEAK_SECRETS.includes(process.env.NEXTAUTH_SECRET)) {
    throw new Error("NEXTAUTH_SECRET must be changed from the default value in production");
  }
}

// ============ 角色白名单 ============

export const ALLOWED_ROLES = ["user", "admin"];

// ============ 题目难度白名单 ============

export const ALLOWED_DIFFICULTIES = ["Easy", "Medium", "Hard"];

// ============ 输入长度限制 ============

export const MAX_NAME_LENGTH = 50;
export const MAX_BIO_LENGTH = 500;
export const MAX_SIGNATURE_LENGTH = 200;
export const MAX_SITE_NAME_LENGTH = 50;
export const MAX_FIELD_LENGTH = 65535; // 通用大字段

// ============ 密码强度校验 ============

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "密码至少需要8个字符";
  if (!/[A-Z]/.test(password)) return "密码必须包含至少一个大写字母";
  if (!/[a-z]/.test(password)) return "密码必须包含至少一个小写字母";
  if (!/[0-9]/.test(password)) return "密码必须包含至少一个数字";
  return null;
}

// ============ HTML 内容检测 ============

export function containsHtml(str: string): boolean {
  return /<[^>]+>/.test(str);
}

// ============ JSON 校验 ============

export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
