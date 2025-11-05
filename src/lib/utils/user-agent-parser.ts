/**
 * User Agent Parser
 *
 * Parses user agent string to extract browser, device, and OS information
 * without external dependencies.
 */

export interface ParsedUserAgent {
  browser: string;
  browserVersion: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
  os: string;
  osVersion: string;
}

/**
 * Parse user agent string to extract browser, device, and OS information
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  if (!userAgent) {
    return {
      browser: "Unknown",
      browserVersion: "",
      device: "Unknown",
      deviceType: "unknown",
      os: "Unknown",
      osVersion: "",
    };
  }

  const ua = userAgent;

  // Detect Browser
  const browserInfo = detectBrowser(ua);

  // Detect Device Type
  const deviceType = detectDeviceType(ua);

  // Detect Device
  const device = detectDevice(ua);

  // Detect OS
  const osInfo = detectOS(ua);

  return {
    browser: browserInfo.name,
    browserVersion: browserInfo.version,
    device,
    deviceType,
    os: osInfo.name,
    osVersion: osInfo.version,
  };
}

/**
 * Detect browser from user agent
 */
function detectBrowser(ua: string): { name: string; version: string } {
  let name = "Unknown";
  let version = "";

  // Chrome
  if (ua.includes("Chrome") && !ua.includes("Edg")) {
    name = "Chrome";
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    version = match ? match[1] : "";
  }
  // Edge (Chromium)
  else if (ua.includes("Edg")) {
    name = "Edge";
    const match = ua.match(/Edg\/(\d+\.\d+)/);
    version = match ? match[1] : "";
  }
  // Firefox
  else if (ua.includes("Firefox")) {
    name = "Firefox";
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    version = match ? match[1] : "";
  }
  // Safari (must be after Chrome check)
  else if (ua.includes("Safari") && !ua.includes("Chrome")) {
    name = "Safari";
    const match = ua.match(/Version\/(\d+\.\d+)/);
    version = match ? match[1] : "";
  }
  // Opera
  else if (ua.includes("OPR") || ua.includes("Opera")) {
    name = "Opera";
    const match = ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/);
    version = match ? match[1] : "";
  }
  // Internet Explorer
  else if (ua.includes("MSIE") || ua.includes("Trident")) {
    name = "Internet Explorer";
    const match = ua.match(/(?:MSIE |rv:)(\d+\.\d+)/);
    version = match ? match[1] : "";
  }

  return { name, version };
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(ua: string): "desktop" | "mobile" | "tablet" | "unknown" {
  // Mobile indicators
  const mobileRegex = /Mobile|Android|iP(hone|od)|BlackBerry|IEMobile|Opera Mini/i;

  // Tablet indicators (before mobile check as tablets often include "Mobile")
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet|PlayBook|Silk/i;

  if (tabletRegex.test(ua)) {
    return "tablet";
  }

  if (mobileRegex.test(ua)) {
    return "mobile";
  }

  // Desktop (default)
  return "desktop";
}

/**
 * Detect specific device from user agent
 */
function detectDevice(ua: string): string {
  // iPhone
  if (ua.includes("iPhone")) {
    return "iPhone";
  }
  // iPad
  if (ua.includes("iPad")) {
    return "iPad";
  }
  // iPod
  if (ua.includes("iPod")) {
    return "iPod";
  }
  // Android devices
  if (ua.includes("Android")) {
    // Try to extract device model
    const match = ua.match(/Android.*;\s*([^)]+)\s*Build/);
    if (match) {
      return match[1].trim();
    }
    return "Android Device";
  }
  // Windows Phone
  if (ua.includes("Windows Phone")) {
    return "Windows Phone";
  }
  // BlackBerry
  if (ua.includes("BlackBerry")) {
    return "BlackBerry";
  }
  // Desktop/Laptop
  if (ua.includes("Windows") || ua.includes("Macintosh") || ua.includes("Linux")) {
    return "Desktop/Laptop";
  }

  return "Unknown Device";
}

/**
 * Detect operating system from user agent
 */
function detectOS(ua: string): { name: string; version: string } {
  let name = "Unknown";
  let version = "";

  // Windows
  if (ua.includes("Windows NT")) {
    name = "Windows";
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      const ntVersion = match[1];
      // Map NT version to Windows version
      const versionMap: { [key: string]: string } = {
        "10.0": "10/11",
        "6.3": "8.1",
        "6.2": "8",
        "6.1": "7",
        "6.0": "Vista",
        "5.1": "XP",
      };
      version = versionMap[ntVersion] || ntVersion;
    }
  }
  // macOS / Mac OS X
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) {
    name = "macOS";
    const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    if (match) {
      version = match[1].replace(/_/g, ".");
    }
  }
  // iOS
  else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) {
    name = "iOS";
    const match = ua.match(/OS (\d+[._]\d+[._]?\d*)/);
    if (match) {
      version = match[1].replace(/_/g, ".");
    }
  }
  // Android
  else if (ua.includes("Android")) {
    name = "Android";
    const match = ua.match(/Android (\d+\.\d+)/);
    version = match ? match[1] : "";
  }
  // Linux
  else if (ua.includes("Linux")) {
    name = "Linux";
  }
  // Chrome OS
  else if (ua.includes("CrOS")) {
    name = "Chrome OS";
  }

  return { name, version };
}

/**
 * Get IP address from request headers
 * Supports various proxy headers
 */
export function getClientIp(headers: Headers): string | null {
  // Check various headers in order of preference
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const cfConnectingIp = headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  const trueClientIp = headers.get("true-client-ip"); // Akamai/Cloudflare
  if (trueClientIp) {
    return trueClientIp.trim();
  }

  const fastlyClientIp = headers.get("fastly-client-ip"); // Fastly CDN
  if (fastlyClientIp) {
    return fastlyClientIp.trim();
  }

  return null;
}
