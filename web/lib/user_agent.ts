function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) {
    return 'Edge';
  }
  if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) {
    return 'Opera';
  }
  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent) && !/OPR\//i.test(userAgent)) {
    return 'Chrome';
  }
  if (/Firefox\//i.test(userAgent)) {
    return 'Firefox';
  }
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent) && !/Chromium\//i.test(userAgent)) {
    return 'Safari';
  }
  if (/MSIE|Trident/i.test(userAgent)) {
    return 'Internet Explorer';
  }
  return 'Browser';
}

function detectPlatform(userAgent: string): string {
  if (/iPhone/i.test(userAgent)) {
    return 'iPhone';
  }
  if (/iPad/i.test(userAgent)) {
    return 'iPad';
  }
  if (/Android/i.test(userAgent)) {
    return /Mobile/i.test(userAgent) ? 'Android phone' : 'Android tablet';
  }
  if (/Windows NT/i.test(userAgent)) {
    return 'Windows';
  }
  if (/Mac OS X|Macintosh/i.test(userAgent)) {
    return 'macOS';
  }
  if (/Linux/i.test(userAgent)) {
    return 'Linux';
  }
  return 'Unknown device';
}

export function describeUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return 'Unknown device';
  }

  const browser = detectBrowser(userAgent);
  const platform = detectPlatform(userAgent);

  if (platform === 'Unknown device' && browser === 'Browser') {
    return 'Unknown device';
  }

  if (platform === 'Unknown device') {
    return browser;
  }

  if (browser === 'Browser') {
    return platform;
  }

  return `${browser} on ${platform}`;
}

export function summarizeUserAgent(userAgent: string | null): string | null {
  if (!userAgent) {
    return null;
  }
  if (userAgent.length <= 120) {
    return userAgent;
  }
  return `${userAgent.slice(0, 117)}...`;
}
