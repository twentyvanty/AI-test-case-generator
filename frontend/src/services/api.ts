import keycloak from "../auth/keycloak";
import config from "../config";

const API_URL = config.apiUrl;

export type Project = {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

async function getAuthHeaders() {
  // Refresh the access token if it expires within the next 30 seconds
  await keycloak.updateToken(30);

  const token = keycloak.token;

  if (!token) {
    throw new Error("User is not authenticated");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function getProjects(): Promise<Project[]> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/projects`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }

  return response.json();
}

export async function getProject(projectId: number): Promise<Project> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/projects/${projectId}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to fetch project");
  }

  return response.json();
}

export async function createProject(
  name: string,
  description: string
): Promise<Project> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_URL}/api/projects`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name,
      description,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create project");
  }

  return response.json();
}