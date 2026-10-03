export const VERSION = __TA_VERSION__;
export const SITE_URL = __SITE_URL__;
export const BASE = import.meta.env.BASE_URL;

export const REPO_URL = 'https://github.com/beyondhumane/tunnel-agent';
export const RELEASES_URL = `${REPO_URL}/releases`;
export const ISSUES_URL = `${REPO_URL}/issues`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const CHANGELOG_URL = `${REPO_URL}/blob/main/CHANGELOG.md`;

const tag = `${RELEASES_URL}/download/v${VERSION}`;

export type Download = { os: 'windows' | 'macos' | 'linux'; label: string; detail: string; href: string };

export const DOWNLOADS: Download[] = [
  { os: 'windows', label: 'Installer', detail: 'x64 · built-in updater', href: `${tag}/TunnelAgent-win-x64-Setup.exe` },
  { os: 'windows', label: 'Portable', detail: 'x64 · zip, no install', href: `${tag}/TunnelAgent-win-x64-Portable.zip` },
  { os: 'windows', label: 'Installer (ARM64)', detail: 'arm64 · built-in updater', href: `${tag}/TunnelAgent-win-arm64-Setup.exe` },
  { os: 'macos', label: 'Apple Silicon', detail: 'arm64 · .pkg', href: `${tag}/TunnelAgent-${VERSION}-osx-arm64.pkg` },
  { os: 'macos', label: 'Intel', detail: 'x64 · .pkg', href: `${tag}/TunnelAgent-${VERSION}-osx-x64.pkg` },
  { os: 'linux', label: 'AppImage', detail: 'x64', href: `${tag}/TunnelAgent-${VERSION}-linux-x64.AppImage` },
  { os: 'linux', label: '.deb', detail: 'x64 · Debian, Ubuntu', href: `${tag}/TunnelAgent-${VERSION}-linux-x64.deb` },
  { os: 'linux', label: '.rpm', detail: 'x64 · Fedora, openSUSE', href: `${tag}/TunnelAgent-${VERSION}-linux-x64.rpm` },
  { os: 'windows', label: 'Portable (ARM64)', detail: 'arm64 · zip, no install', href: `${tag}/TunnelAgent-win-arm64-Portable.zip` },
  { os: 'linux', label: 'AppImage (ARM64)', detail: 'arm64', href: `${tag}/TunnelAgent-${VERSION}-linux-arm64.AppImage` },
  { os: 'linux', label: '.deb (ARM64)', detail: 'arm64 · Debian, Ubuntu', href: `${tag}/TunnelAgent-${VERSION}-linux-arm64.deb` },
  { os: 'linux', label: '.rpm (ARM64)', detail: 'arm64 · Fedora, openSUSE', href: `${tag}/TunnelAgent-${VERSION}-linux-arm64.rpm` },
];

/** Prefixes an app-relative path ("/docs/") with the base the site is served from. */
export const url = (path: string) => `${BASE.replace(/\/$/, '')}${path}`;
export const abs = (path: string) => `${SITE_URL}${url(path)}`;
