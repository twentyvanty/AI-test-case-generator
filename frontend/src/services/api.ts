import { request } from "./http";

export type Project = {
  id: number;
  name: string;
  description: string | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export function getProjects() {
  return request<Project[]>("/api/projects");
}

export function getProject(projectId: number) {
  return request<Project>(`/api/projects/${projectId}`);
}

export function createProject(name: string, description: string) {
  return request<Project>("/api/projects", {
    method: "POST",
    body: { name, description },
  });
}
