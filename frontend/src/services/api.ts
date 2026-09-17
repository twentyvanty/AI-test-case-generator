import keycloak from "../auth/keycloak";

const API_URL = "http://localhost:5001";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

async function getAuthHeaders() {
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