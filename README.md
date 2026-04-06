# AI Test Case Generator

An intelligent web application that leverages AI to automatically generate comprehensive test cases from software requirements using various testing techniques.

## 🚀 Project Overview

The AI Test Case Generator is a modern web application designed to help QA engineers, developers, and students create high-quality test cases efficiently. By inputting software requirements as text, the system uses Google's Gemini AI to generate test cases following established testing methodologies.

## ✨ Features

### Testing Techniques Supported
- **Equivalence Partitioning**: Divides input data into valid and invalid partitions
- **Boundary Value Analysis**: Tests the boundaries of input ranges
- **Decision Table Testing**: Creates comprehensive decision tables with conditions, actions, and rules

### Testing Process Generation
- **TDD (Test-Driven Development)**: Generates RED (failing tests), GREEN (implementation), and REFACTOR (production code)
- **BDD (Behavior-Driven Development)**: Creates Gherkin features and step definitions


## 🛠 Tech Stack

### Frontend
- **React 19** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **CSS Modules** - Scoped styling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Google Generative AI (Gemini)** - AI-powered test case generation
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Google Gemini API Key** (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI-test-case-generator
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   ```

3. **Set up the frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=5000
   ```

## 🚀 Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Open your browser**
   Navigate to `http://localhost:5173` to use the application

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm run dev
   ```

## 📡 API Endpoints

### Generate Test Cases
- **POST** `/api/generate-test-cases`
- **Body**: `{ "requirement": "string", "technique": "equivalence-partitioning|boundary-value-analysis|decision-table" }`
- **Response**: JSON array of test cases or decision table object

### Generate Testing Process
- **POST** `/api/generate-testing-process`
- **Body**: `{ "testCases": [...], "approach": "TDD|BDD" }`
- **Response**: JSON object with test cases and implementation details

## 🧪 Usage Example

1. Open the application in your browser
2. Select a testing technique (Equivalence Partitioning, Boundary Value Analysis, or Decision Table)
3. Enter a software requirement (e.g., "Password must be between 8 and 20 characters.")
4. Click "Generate Test Cases"
5. View the generated test cases
6. Optionally, generate TDD or BDD implementation
