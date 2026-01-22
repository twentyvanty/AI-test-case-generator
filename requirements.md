# AI Test Case Generator – Requirements

## 1. Overview
### 1.1 Purpose
This document describes the requirements of the **AI Test Case Generator**,  
a web application that automatically converts software requirements (text)  
into test cases in **TDD** or **BDD** format.

### 1.2 Target Users
- Software Engineering Students  
- Junior Software Engineers / QA Engineers  
- Developers  

### 1.3 Scope
The system is a **single-page web application**.
- Does not support payment functionality
- Does not support complex user roles
- Focuses only on generating test cases from software requirements

---

## 2. Functional Requirements

**FR-01: Input Requirement**  
The system shall allow users to input software requirements as text  
with a maximum length of 1,000 characters.

**FR-02: Select Test Type**  
The system shall require users to select at least one test case type:
- TDD (Given Input / Expected Output)
- BDD (Given / When / Then)

**FR-03: Generate Test Cases**  
When the user presses the Generate button,  
the system shall generate at least 5 test cases from the given requirement.

**FR-04: Display Result**  
The system shall display generated test cases in a readable format.

**FR-05: Error Handling**  
If the user submits an empty requirement,  
the system shall display an alert message.

**FR-06: Error handling**  
The system shall disable the Generate button when the requirement input is empty.

---

## 3. Non-Functional Requirements

**NFR-01: Usability**  
The system shall allow users to generate test cases within no more than two clicks.

**NFR-02: Performance**  
The system shall respond within 3–5 seconds after the user presses Generate.

**NFR-03: Reliability**  
The system shall not crash when processing long requirements.

---

## 4. Use Case

### UC-01: Generate Test Case
**Actor:** User  
**Precondition:** User opens the web application.

**Main Flow:**
1. User enters a software requirement.
2. User selects a test case type.
3. User presses the Generate button.
4. The system displays generated test cases.

**Postcondition:**  
The user views the generated test cases.

---

## 5. Assumptions & Constraints
- The system uses AI in a prompt-based approach.
- Mock data may be used if the AI API is unavailable.
- The system primarily supports the English language.

---

## 6. Definition of Done
- Users can input requirements and generate test cases successfully.
- Generated test cases are displayed correctly.
- The system operates without errors during normal usage.

---

## Week 1 Outcome
- REQUIREMENTS.md completed
- At least one simple wireframe
- Repository ready for development
