export function validateUpdateProjectDto(data) {
  const { name, description } = data;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return {
        valid: false,
        message: "Project name must be a non-empty string",
      };
    }
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