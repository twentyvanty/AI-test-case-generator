export const generateTestCases = async (
  requirement: string,
  technique: string
) => {
  const response = await fetch("http://localhost:5000/api/generate-test-cases", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requirement, technique }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate test cases");
  }

  return response.json();
};

export const generateTestingProcess = async (
  testCases: any[],
  approach: string
) => {
  const response = await fetch("http://localhost:5000/api/generate-testing-process", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ testCases, approach }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate testing process");
  }

  return response.json();
};
