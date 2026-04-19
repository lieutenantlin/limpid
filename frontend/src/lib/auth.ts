export type AuthMode = "local" | "cognito";

interface StoredAuthSession {
  mode: AuthMode;
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

const LEGACY_TOKEN_KEY = "aqua-graph-token";
const SESSION_KEY = "aqua-graph-auth-session";
const PKCE_VERIFIER_KEY = "aqua-graph-pkce-verifier";
const POST_LOGIN_PATH_KEY = "aqua-graph-post-login-path";

function getDefaultRedirectUri() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/callback`;
}

function getDefaultLogoutUri() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/login`;
}

function getCognitoConfig() {
  return {
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "") ?? "",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
    redirectUri:
      process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? getDefaultRedirectUri(),
    logoutUri:
      process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI ?? getDefaultLogoutUri(),
    scope: process.env.NEXT_PUBLIC_COGNITO_SCOPE ?? "openid email profile",
  };
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomVerifier() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Base64Url(value: string) {
  const payload = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", payload);
  return base64UrlEncode(new Uint8Array(digest));
}

function getStoredSession(): StoredAuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const session = JSON.parse(raw) as StoredAuthSession;
      if (session.expiresAt && session.expiresAt <= Date.now()) {
        clearStoredToken();
        return null;
      }
      return session;
    } catch {
      clearStoredToken();
      return null;
    }
  }

  const token = window.localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!token) return null;

  return {
    mode: "local",
    accessToken: token,
  };
}

function setStoredSession(session: StoredAuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (session.mode === "local") {
    window.localStorage.setItem(LEGACY_TOKEN_KEY, session.accessToken);
  } else {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
}

export function getConfiguredAuthMode(): AuthMode {
  return process.env.NEXT_PUBLIC_AUTH_MODE === "cognito" ? "cognito" : "local";
}

export function isCognitoAuthEnabled() {
  return getConfiguredAuthMode() === "cognito";
}

export function getStoredToken() {
  return getStoredSession()?.accessToken ?? null;
}

export function setStoredToken(token: string) {
  setStoredSession({
    mode: "local",
    accessToken: token,
  });
}

export function clearStoredToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  window.sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
}

export async function startCognitoLogin(nextPath = "/dashboard") {
  const config = getCognitoConfig();
  if (!config.domain || !config.clientId) {
    throw new Error("Missing Cognito client configuration.");
  }

  const verifier = randomVerifier();
  const challenge = await sha256Base64Url(verifier);

  window.sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
  window.sessionStorage.setItem(POST_LOGIN_PATH_KEY, nextPath);

  const url = new URL(`${config.domain}/oauth2/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", challenge);

  window.location.assign(url.toString());
}

export async function completeCognitoLogin(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const error = params.get("error");
  if (error) {
    throw new Error(params.get("error_description") ?? error);
  }

  const code = params.get("code");
  const verifier = window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
  const config = getCognitoConfig();

  if (!code || !verifier) {
    throw new Error("Missing Cognito authorization code.");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    code_verifier: verifier,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(`${config.domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to complete Cognito sign-in.");
  }

  const tokenResponse = (await response.json()) as {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  setStoredSession({
    mode: "cognito",
    accessToken: tokenResponse.access_token,
    idToken: tokenResponse.id_token,
    refreshToken: tokenResponse.refresh_token,
    expiresAt: tokenResponse.expires_in
      ? Date.now() + tokenResponse.expires_in * 1000
      : undefined,
  });

  const destination =
    window.sessionStorage.getItem(POST_LOGIN_PATH_KEY) ?? "/dashboard";
  window.sessionStorage.removeItem(PKCE_VERIFIER_KEY);
  window.sessionStorage.removeItem(POST_LOGIN_PATH_KEY);
  return destination;
}

export function logoutFromHostedAuth() {
  const config = getCognitoConfig();
  if (!config.domain || !config.clientId) return;

  const url = new URL(`${config.domain}/logout`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("logout_uri", config.logoutUri);
  window.location.assign(url.toString());
}
