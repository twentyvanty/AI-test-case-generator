export async function generateTestCases(requirement: string) {
    fetch(
        "AIzaSyCx_f9a2znUhAW1Eg7pCOLeWc9fZiuR9Ic",
        {
            method: "POST",
            headers: { json },
            body: { prompt: requirement}
        }
    )

    return AI result
};