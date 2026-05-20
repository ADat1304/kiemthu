import { clearAuth, getAuth } from "./auth.js";

const GATEWAY_BASE_URL = (import.meta.env.VITE_GATEWAY_URL || "http://localhost:8080").replace(/\/$/, "");
const ESB_PREFIX = "/esb";

const buildUrl = (path) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const baseHasPrefix = ESB_PREFIX && GATEWAY_BASE_URL.endsWith(ESB_PREFIX);
    const pathHasPrefix = ESB_PREFIX &&
        (normalizedPath === ESB_PREFIX || normalizedPath.startsWith(`${ESB_PREFIX}/`));

    // Avoid duplicating the ESB prefix if the base URL already contains it
    const effectivePath = baseHasPrefix && pathHasPrefix
        ? normalizedPath.slice(ESB_PREFIX.length) || "/"
        : !baseHasPrefix && !pathHasPrefix && ESB_PREFIX
            ? `${ESB_PREFIX}${normalizedPath}`
            : normalizedPath;

    return `${GATEWAY_BASE_URL}${effectivePath}`;
};

const parseResult = (payload) =>
    payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "result")
        ? payload.result
        : payload;

async function requestGateway(path, { method = "GET", body, token, headers } = {}) {
    const authToken = token || getAuth()?.token;

    const config = {
        method,
        headers: {
            Accept: "application/json",
            ...headers,
        },
    };

    if (body !== undefined) {
        config.body = JSON.stringify(body);
        config.headers["Content-Type"] = "application/json";
    }

    if (authToken) {
        const normalizedToken = authToken.trim();
        config.headers.Authorization = normalizedToken.startsWith("Bearer ")
            ? normalizedToken
            : `Bearer ${normalizedToken}`;
    }

    const response = await fetch(buildUrl(path), config);
    let payload = null;

    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }

    if (!response.ok) {
        if (response.status === 401) {
            // Token hết hạn hoặc không hợp lệ: dọn dẹp và đưa người dùng về trang đăng nhập
            clearAuth();
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.replace("/login");
            }
        }
        const message = payload?.message || `Request failed with status ${response.status}`;
        const err = new Error(message);
        err.status = response.status;
        err.payload = payload;
        throw err;
    }

    return parseResult(payload);
}

// ===== Authentication =====
export const authenticate = (credentials) =>
    requestGateway(`${ESB_PREFIX}/auth/login`, { method: "POST", body: credentials });

export const introspectToken = (token) =>
    requestGateway(`${ESB_PREFIX}/auth/validate`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

// ===== Users =====
export const createUser = (data, token) =>
    requestGateway(`${ESB_PREFIX}/users`, { method: "POST", body: data, token });

export const fetchUsers = (token) => requestGateway(`${ESB_PREFIX}/users`, { token });

export const fetchUserById = (userId, token) => requestGateway(`${ESB_PREFIX}/users/${userId}`, { token });

export const updateUser = (userId, data, token) =>
    requestGateway(`${ESB_PREFIX}/users/${userId}`, { method: "PUT", body: data, token });

export const deleteUser = (userId, token) =>
    requestGateway(`${ESB_PREFIX}/users/${userId}`, { method: "DELETE", token });

// ===== Products =====
export const createProduct = (data, token) =>
    requestGateway(`${ESB_PREFIX}/products`, { method: "POST", body: data, token });

export const fetchProducts = (token) => requestGateway(`${ESB_PREFIX}/products`, { token });

export const fetchProductByName = (name, token) =>
    requestGateway(`${ESB_PREFIX}/products/name/${encodeURIComponent(name)}`, { token });

export const decrementProductInventory = (productId, data, token) =>
    requestGateway(`${ESB_PREFIX}/products/${productId}/inventory/decrease`, {
        method: "POST",
        body: data,
        token,
    });
export const fetchProductsByCategory = (categoryName, token) => {
    const categoryPath = encodeURIComponent(categoryName || "all");
    return requestGateway(`${ESB_PREFIX}/products/category/${categoryPath}`, { token });
};

export const resetAllProductInventory = (quantity = 100, token) =>
    requestGateway(`${ESB_PREFIX}/products/inventory/reset`, {
        method: "POST",
        body: { quantity },
        token,
    });

// ===== Tables =====
export const fetchTables = (token) => requestGateway(`${ESB_PREFIX}/tables`, { token });
export const updateTableStatus = (tableNumber, status, token) =>
    requestGateway(`${ESB_PREFIX}/tables/${encodeURIComponent(tableNumber)}/status`, {
        method: "PATCH",
        body: { status },
        token,
    });
// ===== Orders =====
export const createOrder = (data, token) =>
    requestGateway(`${ESB_PREFIX}/orders`, { method: "POST", body: data, token });

export const fetchOrders = (token) => requestGateway(`${ESB_PREFIX}/orders`, { token });
export const updateOrderStatus = (orderId, status, token) => {
    const normalizedStatus = typeof status === "string"
        ? status.trim().toUpperCase()
        : String(status ?? "").trim().toUpperCase();

    if (!normalizedStatus) {
        throw new Error("Trạng thái đơn hàng không hợp lệ");
    }

    return requestGateway(`${ESB_PREFIX}/orders/${orderId}/status`, {
        method: "PATCH",
        body: { status: normalizedStatus },
        token,
    });
};
export const fetchDailyOrderStats = (date, token) => {
    const params = date ? `?date=${encodeURIComponent(date)}` : "";
    return requestGateway(`${ESB_PREFIX}/orders/daily-stats${params}`, { token });
};

export { GATEWAY_BASE_URL, requestGateway };
export const fetchCategories = (token) =>
    requestGateway(`${ESB_PREFIX}/products/categories`, { token });


// [THÊM MỚI] Update Product
export const updateProduct = (productId, data, token) =>
    requestGateway(`${ESB_PREFIX}/products/${productId}`, { method: "PUT", body: data, token });

// [THÊM MỚI] Delete Product
export const deleteProduct = (productId, token) =>
    requestGateway(`${ESB_PREFIX}/products/${productId}`, { method: "DELETE", token });


     export const fetchPaymentMethods = (token) =>
         requestGateway(`${ESB_PREFIX}/orders/payment-methods`, { token });

     export const fetchTopSellingProducts = (limit, token) =>
         requestGateway(`${ESB_PREFIX}/orders/top-selling?limit=${limit}`, { token });

     export const fetchRevenue = (startDate, endDate, token) => {
         const params = new URLSearchParams({
             startDate,
             endDate,
         }).toString();

         return requestGateway(`${ESB_PREFIX}/orders/revenue?${params}`, { token });
     };

     export const importHighlandsProducts = (token) =>
         requestGateway(`${ESB_PREFIX}/products/import/highlands`, { method: "POST", token });

export const addOrderItem = (orderId, data, token) =>
    requestGateway(`${ESB_PREFIX}/orders/${orderId}/items`, {
        method: "POST",
        body: data,
        token,
    });

export const decreaseOrderItem = (orderId, data, token) =>
    requestGateway(`${ESB_PREFIX}/orders/${orderId}/items/decrease`, {
        method: "POST",
        body: data,
        token,
    });