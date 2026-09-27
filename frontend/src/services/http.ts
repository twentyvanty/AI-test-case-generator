import keycloak from "../auth/keycloak";
import config from "../config";

// An error answer from the backend. `message` is the backend's own message
// (e.g. "Requirement title is required"), so pages can show it directly.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function authHeader() {
  // Refresh the access token if it expires within the next 30 seconds
  await keycloak.updateToken(30);

  if (!keycloak.token) {
    throw new Error("User is not authenticated");
  }

  return { Authorization: `Bearer ${keycloak.token}` };
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  // Sent as JSON, or as-is for file uploads (FormData)
  body?: unknown;
};

// Calls the backend with the login token and returns the JSON answer.
// Throws ApiError when the backend answers with an error status.
export async function request<T>(path: string, { method = "GET", body }: RequestOptions = {}) {
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = await authHeader();

  if (body !== undefined && !isForm) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new ApiError(data?.message ?? `Request failed (${response.status})`, response.status);
  }

  // 204 No Content (e.g. after a delete) has no body
  return (response.status === 204 ? undefined : await response.json()) as T;
}
