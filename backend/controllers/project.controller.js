import {
  getProjects as getProjectsService,
  createProject as createProjectService,
  getProjectById as getProjectByIdService,
} from "../services/project.service.js";

import { validateCreateProjectDto } from "../dto/project/create-project.dto.js";

export async function getProjects(req, res) {
  try {
    const projects = await getProjectsService(req.user);

    res.json(projects);
  } catch (error) {
    console.error("Get projects error:", error);

    res.status(500).json({
      message: "Failed to get projects",
    });
  }
}

export async function createProject(req, res) {
  try {
    const validation = validateCreateProjectDto(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        message: validation.message,
      });
    }

    const project = await createProjectService(req.user, req.body);

    res.status(201).json(project);
  } catch (error) {
    console.error("Create project error:", error);

    res.status(500).json({
      message: "Failed to create project",
    });
  }
}

export async function getProject(req, res) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId)) {
      return res.status(400).json({
        message: "Invalid project id",
      });
    }

    const project = await getProjectByIdService(req.user, projectId);

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.json(project);
  } catch (error) {
    console.error("Get project error:", error);

    res.status(500).json({
      message: "Failed to get project",
    });
  }
}
