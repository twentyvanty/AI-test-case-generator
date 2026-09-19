import {
  getProjects as getProjectsService,
  createProject as createProjectService,
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