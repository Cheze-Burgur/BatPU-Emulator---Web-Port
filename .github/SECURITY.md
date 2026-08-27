# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in the BatPU Emulator – Web Port, please **do not open a public GitHub issue** containing details that could allow the vulnerability to be exploited.

Instead, report the vulnerability privately through the repository owner's preferred private contact method.

Please include as much of the following information as possible:

* A clear description of the vulnerability
* The affected part of the emulator
* Steps to reproduce the issue
* The potential security impact
* Any relevant proof of concept or demonstration code
* Your suggested mitigation, if you have one

Please avoid publicly disclosing the vulnerability until it has been reviewed and addressed.

---

## Supported Versions

Security fixes are generally applied to the latest version of the project available from the `main` branch.

Because the BatPU Emulator – Web Port is an actively developed browser-based project, older versions may not receive security updates.

| Version                    | Supported |
| -------------------------- | --------- |
| Latest development version | ✓         |
| Older versions             | ×         |

---

## Scope

The BatPU Emulator – Web Port is a client-side, browser-based emulator. Security reports may include issues involving:

* Assembly source parsing
* Program loading or importing
* Exported or saved program data
* User-controlled content rendered in the interface
* Cross-site scripting (XSS)
* Browser storage, including `localStorage`
* Improper handling of malformed or unexpected program data
* Denial-of-service issues caused by programs or malformed input
* Third-party dependencies used by the project

Security issues affecting the project's source code, website, or officially supported deployment are within scope.

---

## Out of Scope

The following are generally outside the scope of this security policy:

* Bugs that do not have a security impact
* CPU emulation inaccuracies without a security impact
* Incorrect instruction behavior
* Incorrect assembler output
* Performance issues that cannot reasonably affect security
* Issues caused by modified, unofficial, or third-party deployments

These issues should generally be reported through the repository's normal issue tracker.

---

## Security Considerations

Because the emulator runs entirely in the browser, it does not currently provide a server-side execution environment or access to a user's operating system beyond the permissions available to a normal web page.

However, security remains important. In particular, changes that handle assembly source, imported files, saved data, or other user-controlled content should avoid introducing vulnerabilities such as:

* Executing arbitrary JavaScript
* Inserting unsanitized user input into the DOM
* Exposing sensitive browser data
* Causing persistent malicious content through saved data
* Creating unintended interactions with browser APIs

Contributors should carefully consider security when adding features that process, store, import, export, or display user-controlled content.

---

## Disclosure Process

After receiving a vulnerability report, the project maintainer will make a reasonable effort to:

1. Confirm and investigate the reported issue.
2. Determine whether the issue affects the project.
3. Develop and test a fix when appropriate.
4. Release or publish the fix.
5. Coordinate public disclosure after the issue has been addressed.

Response and resolution times may vary depending on the severity and complexity of the issue.

---

## Dependency Security

If the project uses third-party dependencies, security vulnerabilities affecting those dependencies may also be reported under this policy when they affect the BatPU Emulator – Web Port.

Contributors should avoid adding unnecessary dependencies and should prefer well-maintained packages when external libraries are required.

---

## Thank You

Responsible security research and vulnerability reports help make the BatPU Emulator – Web Port safer for everyone. Thank you for helping improve the security of the project.
