const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function getTokens(): TokenPair | null {
  if (typeof window === "undefined") return null;
  const accessToken = localStorage.getItem("accessToken");
  const refreshToken = localStorage.getItem("refreshToken");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

function setTokens(tokens: TokenPair) {
  localStorage.setItem("accessToken", tokens.accessToken);
  localStorage.setItem("refreshToken", tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

let isRefreshing = false;
let refreshPromise: Promise<TokenPair | null> | null = null;

async function refreshTokens(): Promise<TokenPair | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    const tokens = getTokens();
    if (!tokens?.refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const newTokens: TokenPair = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      setTokens(newTokens);
      return newTokens;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export class ApiError extends Error {
  public data: Record<string, unknown>;
  constructor(
    public status: number,
    message: string,
    data: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.data = data;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = getTokens();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.accessToken) {
    headers["Authorization"] = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // If 401, try refreshing the token once
  if (res.status === 401 && tokens?.refreshToken) {
    const newTokens = await refreshTokens();
    if (newTokens) {
      headers["Authorization"] = `Bearer ${newTokens.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
      });
    } else {
      clearTokens();
      window.location.href = "/login";
      throw new ApiError(401, "Session expired");
    }
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data.message || data.error || "Request failed", data);
  }

  return data as T;
}

// Auth-specific API calls
export async function login(email: string, password: string) {
  const data = await api<{
    success: boolean;
    data: {
      user: { id: string; email: string; name: string; role: string };
      accessToken: string;
      refreshToken: string;
    };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setTokens({
    accessToken: data.data.accessToken,
    refreshToken: data.data.refreshToken,
  });
  localStorage.setItem("user", JSON.stringify(data.data.user));

  return data.data;
}

export async function logout() {
  const tokens = getTokens();
  if (tokens?.refreshToken) {
    try {
      await api("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
    } catch {
      // Ignore logout errors
    }
  }
  clearTokens();
}

export function getStoredUser(): {
  id: string;
  email: string;
  name: string;
  role: string;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getTokens()?.accessToken;
}
