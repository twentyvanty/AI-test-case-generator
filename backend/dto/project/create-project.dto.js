export function validateCreateProjectDto(data) {
  const { name, description } = data;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return {
      valid: false,
      message: "Project name is required",
    };
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      return {
        valid: false,
        message: "Project description must be a string",
      };
    }
  }

  return {
    valid: true,
  };
}