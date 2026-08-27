# Contributing to BatPU Emulator - Web Port

Thanks for your interest in contributing to this project!

Contributions of all kinds are welcome, including bug fixes, new features, documentation improvements, example programs, UI improvements, and performance optimizations.

Please read these guidelines before opening an issue or pull request.

---

## Getting Started

1. Fork the repository.
2. Clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/BatPU-Emulator---Web-Port.git
```

3. Navigate into the project directory:

```bash
cd BatPU-Emulator---Web-Port
```

4. Open the project in your preferred code editor.

The emulator is a browser-based application, so no build process is currently required. Open `index.html` in a browser or use a local development server.

---

# Ways to Contribute

You can contribute by helping with:

* Bug fixes
* New emulator features
* CPU and assembler improvements
* Debugging tools
* UI and usability improvements
* Performance optimizations
* Documentation
* Example assembly programs
* Accessibility improvements
* Testing and reporting bugs

If you are unsure whether an idea fits the project, open an issue or discussion first.

---

# Reporting Bugs

Before opening a bug report, please check whether the issue has already been reported.

When reporting a bug, include as much of the following information as possible:

* A clear description of the problem
* Steps to reproduce it
* The expected behavior
* The actual behavior
* Any relevant assembly code
* Browser and operating system information
* Screenshots, if applicable

### Example

```text
### Description

The emulator produces an incorrect result when...

### Steps to Reproduce

1. Load the following program:
2. Run the emulator.
3. Observe...

### Expected Behavior

...

### Actual Behavior

...
```

---

# Suggesting Features

Feature suggestions are welcome.

When suggesting a feature, please explain:

* What problem the feature would solve
* How you think the feature should work
* Whether it affects the emulator, assembler, UI, documentation, or another part of the project

For large changes, please open an issue before spending significant time implementing the feature. This helps prevent duplicate work and makes it easier to discuss the design.

---

# Making Changes

## 1. Create a Branch

Create a descriptive branch for your changes:

```bash
git checkout -b feature/my-feature
```

or:

```bash
git checkout -b fix/my-bug-fix
```

Examples:

```text
feature/syntax-highlighting
feature/new-preset-program
fix/branch-offset
fix/memory-display
docs/update-isa
```

---

## 2. Keep Changes Focused

Try to keep each pull request focused on one feature or fix.

For example, avoid combining:

* A large UI redesign
* An assembler bug fix
* Documentation changes
* A new preset program

in the same pull request unless the changes are directly related.

Smaller, focused pull requests are easier to review and test.

---

## 3. Follow the Existing Code Style

Try to match the style and structure already used in the project.

In general:

* Use descriptive variable and method names.
* Keep related functionality together.
* Prefer small, focused methods where practical.
* Avoid unrelated refactoring in feature or bug-fix pull requests.
* Add comments when code performs non-obvious behavior.
* Preserve the project's existing architecture unless the change specifically requires restructuring it.

The project uses JavaScript modules and classes to separate major systems and responsibilities. New code should fit naturally into the existing structure.

---

# Testing Your Changes

Before opening a pull request, test your changes in the browser.

Depending on what you changed, this may include testing:

* Program assembly
* Program execution
* Single-step execution
* CPU reset behavior
* Register values
* Memory values
* Flags
* Stack behavior
* Hardware devices
* Save and load functionality
* Error reporting
* Different site themes

If your change affects the assembler or CPU, please test it with representative assembly programs, including edge cases where appropriate.

Changes should not break existing emulator functionality.

---

# Contributing Example Programs

New example programs are welcome additions.

Example programs should:

* Demonstrate an interesting feature of the BatPU
* Include readable comments
* Assemble without errors
* Run correctly in the emulator
* Avoid unnecessarily large or repetitive code where possible

If a program demonstrates a specific hardware device or instruction, consider documenting that in comments.

---

# Documentation Contributions

Documentation improvements are always helpful.

This includes:

* ISA documentation
* I/O documentation
* Help pages
* README improvements
* Code comments
* Examples and tutorials

When changing technical documentation, please ensure that it matches the actual behavior of the emulator and the [BatPU architecture](https://docs.google.com/spreadsheets/u/0/d/1Bj3wHV-JifR2vP4HRYoCWrdXYp3sGMG0Q58Nm56W4aI/htmlview#gid=0).

---

# Pull Requests

When your changes are ready:

1. Make sure your branch is up to date with the latest relevant changes.
2. Test the emulator.
3. Commit your changes with a clear commit message.
4. Push your branch to your fork.
5. Open a pull request.

Please include the following information in your pull request:

* What the pull request changes
* Why the change was made
* How you tested it
* Any relevant issues the pull request addresses

### Example Pull Request Description

```text
## Summary

Adds syntax highlighting to the assembly editor.

## Changes

- Added instruction highlighting
- Added register highlighting
- Added comment highlighting

## Testing

- Tested with included preset programs
- Tested valid and invalid instructions
- Tested all available themes

Closes #123
```

---

# Commit Messages

Use clear commit messages that describe what changed.

Good examples:

```text
Add syntax highlighting to editor
Fix incorrect branch offset handling
Improve register viewer performance
Update ISA documentation
Add Snake example program
```

Avoid vague messages.

---

# Code of Conduct

Please follow the repository's [Code of Conduct](CODE_OF_CONDUCT.md) when participating in the project.

Be respectful and constructive when discussing issues, reviewing pull requests, or suggesting changes.

---

# Questions and Discussions

If you have a question, an idea, or are unsure where to start, feel free to open a discussion or issue.

Potential areas for future contributions include:

* Syntax highlighting
* Improved debugging tools
* Additional preset programs
* Performance optimizations
* Documentation improvements

---

# Crediting and Attributions

Contributors will be added to the [README.md](README.md) under the Contributors section.

---

Thank you for helping improve the BatPU Emulator - Web Port!
