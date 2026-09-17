# AI Test Case Generator

An intelligent web application that leverages AI to help testers generate comprehensive test cases from software requirements using various software testing techniques.

## 🚀 Project Overview

The AI Test Case Generator is a web application designed to help QA engineers, developers, and students create and manage test cases more efficiently.

The application provides a project-based workflow where users can create projects, manage software requirements, select testing techniques, and generate structured test cases using AI.

The system is designed to act as an intermediary between users and AI providers. It uses an AI Orchestrator to prepare prompts based on the selected testing technique and communicate with external AI provider APIs.

## ✨ Features

### 🔐 User Authentication

* **Keycloak Authentication**: Handles user registration, login, and authentication
* **JWT Authentication**: Secures communication between the frontend and backend
* **User Accounts**: Links authenticated Keycloak users with application data stored in MySQL

### 📁 Project Management

* **Dashboard**: View and manage the user's test case projects
* **Create Projects**: Create projects with a name and description
* **Project Ownership**: Each project belongs to the authenticated user
* **Project-Based Workflow**: Organize requirements and test cases within individual projects

### 🧪 Testing Techniques Supported

* **Equivalence Partitioning (EP)**: Divides input data into valid and invalid partitions
* **Boundary Value Analysis (BVA)**: Tests values at and around the boundaries of input ranges
* **Decision Table Testing**: Creates test cases based on combinations of conditions and actions
* **Test-Driven Development (TDD)**: Supports RED, GREEN, and REFACTOR development stages
* **Behavior-Driven Development (BDD)**: Supports Gherkin-based scenarios and behavior specifications

### 🤖 AI-Assisted Test Case Generation

The application uses an AI Orchestrator to help prepare prompts and communicate with external AI providers.

The planned workflow is:

```text
User Requirement
       ↓
Select Testing Technique
       ↓
AI Orchestrator
       ↓
Prepared AI Prompt
       ↓
AI Provider API
       ↓
Generated Test Cases
```

The architecture is designed to allow integration with different AI providers rather than depending on a single AI service.

### 🌐 Multilingual Interface

The web application supports:

* **English**
* **Thai**

Internationalization is implemented using `i18next` and `react-i18next`.

Users can switch between languages through the language switcher in the application interface.

## 🛠 Tech Stack

### Frontend

* **React 19** - Frontend UI library
* **TypeScript** - Type-safe JavaScript
* **Vite** - Fast build tool and development server
* **Tailwind CSS** - Utility-first CSS framework
* **i18next** - Internationalization framework
* **react-i18next** - React integration for i18next
* **Keycloak JavaScript Adapter** - Frontend authentication integration

### Backend

* **Node.js** - JavaScript runtime
* **Express.js** - Web framework
* **Prisma** - ORM for database access
* **jose** - JWT verification
* **Google Generative AI (Gemini)** - AI integration
* **OpenAI API** - AI provider integration
* **CORS** - Cross-origin resource sharing
* **dotenv** - Environment variable management

### Database

* **MySQL** - Relational database
* **Prisma ORM** - Database schema and queries

### Authentication

* **Keycloak** - Identity and access management
* **OpenID Connect** - Authentication protocol
* **JWT** - Secure API authentication

### Development Tools

* **Docker** - Containerization
* **Git / GitLab** - Version control
* **Postman** - API testing
* **MySQL Workbench** - Database management
* **VS Code** - Development environment

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

* **Node.js** (version 18 or higher)
* **npm** (comes with Node.js)
* **MySQL**
* **Docker Desktop**
* **Git**

Depending on the AI provider being used, an appropriate AI API key may also be required.