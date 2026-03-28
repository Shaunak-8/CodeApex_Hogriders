# 🛠️ Autonomous CI/CD Healing Agent

**Team Hog Riders — VIT Pune**

An AI-powered DevOps assistant that automatically **detects, analyzes, and fixes CI/CD pipeline failures** in GitHub repositories.
Just paste a repository URL and the agent will **diagnose errors, generate fixes, verify them through tests, and push a corrected branch** — all while you watch it happen through a live dashboard.


# 🚀 Overview

Modern software teams rely heavily on **CI/CD pipelines** to automatically build, test, and deploy applications whenever developers push code. However, pipelines frequently fail due to issues such as:

* Syntax errors
* Logic bugs
* Type mismatches
* Linting violations
* Dependency conflicts
* Integration issues across multiple files

Developers often spend **40–60% of their time debugging pipeline failures** instead of building new features.

Our solution introduces an **Autonomous DevOps Agent** that can automatically:

1. Detect pipeline failures
2. Analyze the root cause
3. Generate targeted fixes
4. Verify fixes through tests
5. Push corrected code to a new branch

This enables **self-healing CI/CD pipelines** and significantly reduces debugging time.


# ⚙️ How It Works

### 1️⃣ Repository Input

The user enters a **GitHub repository URL** through the web dashboard.

### 2️⃣ Repository Analysis

The backend clones the repository and analyzes the **project structure, dependencies, and test files**.

### 3️⃣ Automated Testing

All discovered tests are executed to identify failures.

### 4️⃣ AI Root Cause Analysis

The AI agent examines error logs and determines the **exact cause of the failure**.

### 5️⃣ Automated Fix Generation

Targeted fixes are generated and applied to the code.

### 6️⃣ Verification Loop

The system re-runs the test suite to verify the fix.
If tests fail, the agent retries until the issue is resolved.

### 7️⃣ Safe Git Commit

Once the fix passes tests:

* Changes are committed with the prefix **`[AI-AGENT]`**
* A **new branch** is created
* The fixes are pushed to GitHub

### 8️⃣ Dashboard Visualization

The React dashboard displays:

* Detected issues
* Fixes applied
* CI/CD status
* Debugging timeline


# 🧠 System Architecture

The system follows a **multi-agent pipeline architecture**:

**User Input → Analyzer Agent → Fixer Agent → Verifier Agent → Git Commit → Dashboard**

### Agents

**Analyzer Agent**

* Clones repository
* Runs static analysis and tests
* Generates failure reports

**Fixer Agent**

* Uses an LLM to generate targeted fixes
* Applies changes in an isolated environment

**Verifier Agent**

* Re-runs all tests
* Confirms whether the fix works
* Triggers retries if necessary


# 🖥️ Tech Stack

## Frontend

* **Next.js 14**
* **React**
* **Shadcn/UI**
* **Zustand** (state management)
* **Recharts** (visualizations)
* **Axios**

## Backend

* **FastAPI**
* **GitPython**
* **Server Sent Events / Streaming**

## AI & Agent Layer

* LLM-based fix generation
* Multi-agent orchestration
* Automated retry logic

## Detection & Testing Tools

* **flake8** – Python linting
* **mypy** – Type checking
* **pytest** – Python testing
* **eslint** – JS/TS linting
* **jest** – JavaScript testing

## Execution Environment

* Sandbox execution for safe code validation


# 📊 Features

✔ Autonomous CI/CD debugging
✔ Multi-agent AI architecture
✔ Automatic repository analysis
✔ Intelligent bug detection
✔ Targeted code fixes
✔ Safe Git branch creation
✔ Test verification loop
✔ Live React dashboard
✔ Reduced debugging effort


# 🎯 Impact

Our system helps development teams:

* Reduce **manual debugging time**
* Improve **CI/CD reliability**
* Detect issues **faster**
* Automatically **repair failing pipelines**

Instead of spending hours investigating pipeline logs, developers can focus on **building new features and shipping products faster**.


# 🔮 Future Improvements

* Support for more programming languages
* Smarter root-cause analysis
* Integration with popular CI tools
* Performance optimization suggestions
* Automated pull request creation
* Security vulnerability detection


# 👥 Team

**Team Hog Riders — VIT Pune**

Project: **Autonomous CI/CD Healing Agent**


# 📌 Usage

1. Open the dashboard
2. Paste a **GitHub repository URL**
3. Click **Run Agent**
4. Watch the system:

   * Analyze the repo
   * Detect failures
   * Generate fixes
   * Verify tests
   * Push corrected branch


# 🏁 Conclusion

The **Autonomous CI/CD Healing Agent** demonstrates how AI can move beyond code generation and actively **maintain and repair software systems**.

By combining **AI, DevOps automation, and intelligent testing**, this project turns broken pipelines into **self-healing development workflows**.

