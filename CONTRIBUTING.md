# Contributing Guidelines


Thank you for your interest in contributing to the Peer Learning project! We welcome contributions from the community and are pleased to have you join us. By participating in this project, you agree to abide by our code of conduct and these contributing guidelines.

## How to Contribute

To contribute to this repository, please follow these standard steps:

### 1. Forking the Repository

Before making any changes, you need to create your own copy of the project.
1. Click the **Fork** button at the top right corner of this repository's page to create a copy of the repository in your own GitHub account.
2. Clone your forked repository to your local machine:
   ```bash
   git clone https://github.com/<your-username>/peer-learning.git
   ```
3. Navigate into the cloned directory:
   ```bash
   cd peer-learning
   ```
4. Add the original repository as an upstream remote to keep your fork synced:
   ```bash
   git remote add upstream https://github.com/durdana3105/peer-learning.git
   ```

### 2. Creating Branches

Always create a new branch for your work. Do not make changes directly on the main branch.
1. Make sure your local `main` branch is up to date with the upstream `main` branch:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```
2. Create a new branch with a descriptive name related to the feature or fix you are working on:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix-name
   ```

### 3. Making Commits

Make your changes in your newly created branch. Follow these guidelines for committing your work:
1. Stage your changes:
   ```bash
   git add .
   ```
2. Commit your changes with a clear and descriptive commit message:
   ```bash
   git commit -m "Brief description of the changes made"
   ```
   * Write commits in the imperative mood (e.g., "Add feature" instead of "Added feature").
   * Keep commit messages concise but descriptive.

### 4. Following Coding Standards

To maintain consistency and code quality across the project, please adhere to the following coding standards:
- Ensure your code is properly formatted and clean.
- Write clear and meaningful variable, function, and class names.
- Add comments to explain complex logic or non-obvious code.
- Write or update tests for any new features or bug fixes.
- Ensure all existing tests pass before submitting your changes.

### 5. Submitting Pull Requests

Once you are ready to share your changes, submit a pull request (PR).
1. Push your branch to your forked repository on GitHub:
   ```bash
   git push origin your-branch-name
   ```
2. Go to the original repository (`https://github.com/durdana3105/peer-learning`) and click on the **Pull Requests** tab.
3. Click the **New pull request** button.
4. Click on **compare across forks** and select your fork and branch to compare against the base repository's `main` branch.
5. Provide a clear title and description for your PR. Mention any issue numbers that your PR addresses (e.g., "Fixes #7").
6. Submit the pull request for review.

### Code Review Process

After you submit your PR, project maintainers will review your code.
- Be prepared to answer questions and address any requested changes.
- You can make updates to your PR by simply committing to your local branch and pushing to your fork. The PR will update automatically.

Thank you for contributing!

Thank you for your interest in contributing to this project! Contributions help improve the project and make the community stronger.

## How to Contribute

1. Fork the repository
2. Clone your fork locally
3. Create a new branch
4. Make your changes
5. Commit your changes with a meaningful commit message
6. Push the branch to your fork
7. Create a Pull Request

## Contribution Rules

- Write clean and readable code
- Follow the existing project structure
- Test your changes before submitting
- Keep pull requests focused and small
- Use respectful and professional language

## Reporting Issues

If you find bugs or have suggestions:
- Open an issue
- Clearly describe the problem
- Include steps to reproduce if applicable

## Pull Request Guidelines

- Ensure your code works properly
- Add proper documentation if needed
- Avoid unrelated changes in one PR
- Be open to feedback and suggestions

## Community

Please be respectful and collaborative with other contributors to maintain a healthy open-source environment.

Happy Contributing!

