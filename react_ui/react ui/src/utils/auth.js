const STORAGE_KEY = "cafe_auth";

const normalizeScopes = (rawScopes) => {
    if (!rawScopes) return [];

    if (Array.isArray(rawScopes)) {
        return rawScopes.map((item) => String(item || "").trim().toUpperCase()).filter(Boolean);
    }

    if (typeof rawScopes === "string") {
        return rawScopes
            .split(/[\s,]+/)
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean);
    }

    return [];
};

export const decodeTokenPayload = (token) => {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length < 2) return null;

    try {
        const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = atob(payload);
        return JSON.parse(json);
    } catch (error) {
        console.warn("Không thể giải mã token", error);
        return null;
    }
};

export const getTokenScopes = (token) => {
    const payload = decodeTokenPayload(token || getAuth()?.token);

    if (!payload || typeof payload !== "object") return [];

    const rawScopes =
        payload.scope || payload.SCOPE || payload.scp || payload.authorities || payload.roles;

    return normalizeScopes(rawScopes);
};

export const hasScope = (requiredScopes, token) => {
    const scopes = getTokenScopes(token);
    const normalizedRequired = normalizeScopes(requiredScopes);

    if (normalizedRequired.length === 0) return true;

    return normalizedRequired.every((scope) => scopes.includes(scope));
};

export function saveAuth({ token, user }) {
    if (!token || !user) {
        throw new Error("Token và thông tin người dùng là bắt buộc");
    }

    const payload = {
        token,
        user,
        loginAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
}

export function getAuth() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn("Không thể parse thông tin đăng nhập", error);
        return null;
    }
}

export function clearAuth() {
    localStorage.removeItem(STORAGE_KEY);
}

export function isAuthenticated() {
    const data = getAuth();
    return Boolean(data?.token && data?.user);
}
export function parseTokenPayload(rawToken = getAuth()?.token) {
    if (!rawToken) return null;

    const normalized = rawToken.replace(/^Bearer\s+/i, "");
    const parts = normalized.split(".");

    if (parts.length < 2) return null;

    try {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = atob(base64);
        return JSON.parse(decoded);
    } catch (error) {
        console.warn("Không thể giải mã token", error);
        return null;
    }
}

export function getScopesFromToken(token) {
    const payload = parseTokenPayload(token);
    const scopeClaim = payload?.scope;

    if (Array.isArray(scopeClaim)) {
        return scopeClaim.filter(Boolean);
    }

    if (typeof scopeClaim === "string") {
        return scopeClaim
            .split(/\s+/)
            .map((scope) => scope.trim())
            .filter(Boolean);
    }

    return [];
}
