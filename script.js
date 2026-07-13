/* ===== UI Shell and Panels ===== */
const bottomPanel = document.getElementById("bottom-panel");
const problemsToggle = document.getElementById("problems-toggle");

problemsToggle.addEventListener("click", () => {
    bottomPanel.classList.toggle("open");
});

class ProblemsPanel {

    constructor(element) {

        this.element = element;
        this.toggle = document.getElementById("problems-toggle");
        this.items = [];

    }

    clear() {

        this.items = [];
        this.render();

    }

    add(type, message, line = null) {

        this.items.push({
            type,
            message,
            line
        });

        this.render();

    }

    set(items) {

        this.items = items;
        this.render();

    }

    render() {

        this.toggle.textContent = `Problems (${this.items.length})`;
        this.toggle.classList.toggle("has-problems", this.items.length > 0);

        if (this.items.length === 0) {

            this.element.innerHTML =
                "<div>No problems.</div>";

            bottomPanel.classList.remove("open");
            return;

        }

        bottomPanel.classList.add("open");

        this.element.innerHTML =
            this.items.map(item => `

                <div class="problem ${item.type}">

                    ${item.line !== null
                    ? `Line ${item.line}: `
                    : ""
                }

                    ${item.message}

                </div>

            `).join("");

    }

}

class Modal {

    constructor() {

        this.overlay =
            document.getElementById("modal-overlay");

        this.title =
            document.getElementById("modal-title");

        this.body =
            document.getElementById("modal-body");

        document
            .getElementById("modal-close")
            .onclick = () => this.close();

        this.overlay.onclick = e => {

            if (e.target === this.overlay)
                this.close();

        };

    }

    open(title, html) {

        this.title.textContent = title;
        this.body.innerHTML = html;

        this.overlay.classList.remove("hidden");

    }

    close() {

        this.overlay.classList.add("hidden");

    }

}

const problems = new ProblemsPanel(document.getElementById("problems-list"));
const modal = new Modal();

class DocumentationManager {

    constructor(modal) {

        this.modal = modal;

    }

    open(page) {

        const doc = Documentation[page];

        if (!doc) return;

        this.modal.open(
            doc.title,
            doc.render()
        );

    }

}

const docs = new DocumentationManager(modal);

const docButtons = {
    isa: document.getElementById("isa-button"),
    io: document.getElementById("io-button"),
    help: document.getElementById("help-button"),
    presets: document.getElementById("presets-button"),
    about: document.getElementById("about-button"),
    changelog: document.getElementById("changelog-button")
};

Object.entries(docButtons).forEach(([page, button]) => {
    button.addEventListener("click", () => docs.open(page));
});

const projectRepoButton = document.getElementById("project-repo-button");
projectRepoButton.onclick = () => {
    window.open("https://github.com/Cheze-Burgur/BatPU-Emulator---Web-Port", "_blank");
};

/* ===== Documentation ===== */
const Documentation = {

    home: {

        title: "Home",

        render() {

            return `
<h1>CPU Simulator</h1>
<p>Welcome...</p>
`;

        }

    },

    isa: {

        title: "Instruction Set",

        render() {

            let html = `
            <div class="doc-page">
                <div class="doc-header">
                    <h1>Instruction Set</h1>
                    <p>
                        Complete reference of all CPU instructions.
                    </p>
                </div>
        `;

            for (const [name, data] of Object.entries(Instructions)) {
                const category = data.category || "General";
                const operands = Array.isArray(data.operands) ? data.operands : [];
                const flags = Array.isArray(data.flags) ? data.flags : [];
                const example = data.example || "";
                const pseudo = data.pseudo || "";

                html += `
            <div class="doc-card">

                <div class="doc-card-header">
                    <h2>${name}</h2>
                    <span class="doc-badge">${category}</span>
                </div>

                <div class="doc-section">
                    <h3>Description</h3>
                    <p>${data.description || ""}</p>
                </div>

                <div class="doc-section">
                    <h3>Syntax</h3>
                    <pre class="doc-code">${data.syntax || ""}</pre>
                </div>
            `;

                if (pseudo) {
                    html += `
                <div class="doc-section">
                    <h3>Pseudocode</h3>
                    <pre class="doc-code">${pseudo}</pre>
                </div>
            `;
                }

                html += `
                <div class="doc-section">
                    <h3>Operands</h3>
                    <table class="doc-table">
            `;

                if (operands.length) {
                    operands.forEach((operand, i) => {
                        const operandName = Array.isArray(operand) ? operand[0] : operand;
                        const operandDesc = Array.isArray(operand) ? operand[1] : "";
                        html += `
                    <tr>
                        <td>${operandName}</td>
                        <td>${operandDesc}</td>
                    </tr>
                `;
                    });
                } else {
                    html += `
                    <tr>
                        <td colspan="2">No operands</td>
                    </tr>
                `;
                }

                html += `
                    </table>
                </div>
            `;

                if (flags.length) {
                    html += `
                <div class="doc-section">
                    <h3>Flags</h3>
                    <div class="doc-tags">
            `;

                    flags.forEach(flag => {
                        html += `
                    <span class="doc-tag">${flag}</span>
                `;
                    });

                    html += `
                    </div>
                </div>
            `;
                }


                if (example) {
                    html += `
                <div class="doc-section">
                    <h3>Example</h3>
                    <pre class="doc-code">${example}</pre>
                </div>
            `;
                }

                html += `
            </div>
            `;
            }

            html += `
            </div>
        `;

            return html;

        }

    },

    io: {

        title: "I/O Protocol",

        render() {

            let html = `
            <div class="doc-page">
                <div class="doc-header">
                    <h1>Protocol</h1>
                    <p>
                        The I/O devices mapped to the last 16 data memory addresses use them to interact with the CPU.
                    </p>
                </div>
        `;

            for (const device of Object.values(Devices)) {
                html += `
            <div class="doc-card">
                <div class="doc-card-header">
                    <h2>${device.title}</h2>
                    <span class="doc-badge">Device</span>
                </div>
        `;

                if (device.description) {
                    html += `
                <div class="doc-section">
                    <h3>Description</h3>
                    <p>${device.description}</p>
                </div>
            `;
                }

                html += `
                <div class="doc-section">
                    <h3>Addresses</h3>
                    <table class="doc-table">
                        <thead>
                            <tr>
                                <th>Address</th>
                                <th>Operation</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

                for (const [addr, entry] of Object.entries(device.addresses)) {
                    const accessClass = entry.access.toLowerCase().replace("/", "-");

                    html += `
                            <tr>
                                <td>${addr}</td>
                                <td>
                                    <span class="io-access ${accessClass}">${entry.access}</span>
                                    ${entry.description}
                                </td>
                            </tr>
                        `;
                }

                html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
            }

            html += `
            </div>
        `;

            return html;

        }

    },

    help: {
        title: "Help Guide",

        render() {
            return `
            <div class="doc-page">
                <div class="doc-header">
                    <h1>Help Guide</h1>
                    <p>Quick guidance for using the emulator.</p>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>How to Write and Run a Program</h2>
                        <span class="doc-badge">Guide</span>
                    </div>
                    <div class="doc-section">
                        <h3>How to Use the Editor</h3>
                        <p>
                            <strong>The editor</strong> is where you write your assembly programs. Using the 16 instructions specified by <strong>Instruction Set Architecture (ISA)</strong>, 
                            you can write programs that the CPU can execute. Each instruction and its operands should all be on their own separate lines. 
                        </p>
                        <p>
                            <strong>Comments</strong> can be added to your program by using the <span class="code">;</span> symbol. Everything after the <span class="code">;</span> symbol on that line will be ignored by the assembler.
                        </p>
                        <p>
                            Once you have written your program, you can click the <strong>Run</strong> button to assemble and execute it, or click the <strong>Step</strong> button to execute it line by line.
                        </p>
                        <p>
                            If there are any errors in your program, they will be displayed in the <strong>Problems Panel</strong> at the bottom of the screen.
                        </p>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>What are the instructions?</h2>
                        <span class="doc-badge">Guide</span>
                    </div>
                    <div class="doc-section">
                        <h3>Instruction Syntax and Semantics</h3>
                        <p>
                            All of the instructions follow the same <strong>syntax</strong>. Each instruction has their own unique three-letter
                            identifier, called a <strong>mnemonic</strong>. These should be the first thing on each line, followed by the <strong>operands</strong>, if any.
                            An intruction can have up to three operands, which are separated by spaces. The operands can be <strong>registers</strong>, <strong>immediate values</strong>,
                            or <strong>program addresses</strong>, depending on the function of the instruction.
                        </p>
                        <p>
                            The instructions can fall into one of four categories: <strong>Arithmetic</strong>, <strong>Register Manipulation</strong>,
                            <strong>Branching and Subroutines</strong>, and <strong>Memory Manipulation</strong>
                        </p>
                        <ul>
                            <li><strong>Arithmetic instructions</strong> perform mathematical and logical operations upon the values in registers.</li>
                            <li><strong>Register Manipulation instructions</strong> allow you to load values into registers or add immediate values to them.</li>
                            <li><strong>Branching and Subroutine instructions</strong> allow you to jump to different parts of your program, or call subroutines.</li>
                            <li><strong>Memory Manipulation instructions</strong> allow you to read from and write to the data memory.</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Using the CPU</h2>
                        <span class="doc-badge">Guide</span>
                    </div>
                    <div class="doc-section">
                        <h3>Math and Registers</h3>
                        <p>
                            The CPU has 16 registers, which are used to store values for use in your program. 
                            You can view the contents of the registers in the <strong>Registers Panel</strong>.
                        </p>
                        <p>
                            To perform mathematical operations, you can use the arithmetic instructions to manipulate the values in the registers. 
                            To reference a register for use in an instruction, you type the letter r followed by the register number (0-15).
                            For example, to reference register 3, you would type <span class="code">r3</span>.
                        </p>
                        <p>
                            Register 0 is what is called a <strong>zero register</strong>, which means it always contains the value 0. 
                            You can read from it like a normal register, but you cannot write to it. Any attempt to write to register 0 will be ignored.
                            r0 will always contain and read as zero, which can be useful for certain operations, such as clearing a register or comparing values.
                        </p>
                    </div>
                </div>
            </div>
        `;
        }
    },

    presets: {
        title: "Presets",

        render() {
            let html = `
            <div class="doc-page">
                <div class="doc-header">
                    <h1>Presets</h1>
                    <p>Pre-written programs that you can load into the editor.</p>
                </div>
            `;

            for (const [name, preset] of Object.entries(Presets)) {
                html += `
                    <div class="doc-card">
                        <div class="doc-card-header">
                            <h2>${preset.title}</h2>
                            <button class="doc-badge-button" onclick="loadPreset('${name}')">Load Preset</button>
                        </div>
                        <div class="doc-section">
                            <h3>By ${preset.author}</h3>
                            <p>${preset.description}</p>
                            <img src="https://raw.githubusercontent.com/Cheze-Burgur/BatPU-Emulator---Web-Port/refs/heads/main/images/${preset.imageName}.png">
                        </div>
                    </div>
                `;
            }

            html += `</div>`

            return html;
        },

    },

    about: {
        title: "About",

        render() {
            return `
            <div class="doc-page">
                <div class="doc-header">
                    <h1>About</h1>
                    <p>A web-based CPU emulator for learning assembly, CPU architecture, and low-level programming.</p>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Project overview</h2>
                        <span class="doc-badge">Info</span>
                    </div>
                    <div class="doc-section">
                        <h3>What is this?</h3>
                        <p>This is a web-based emulator for a digital CPU, designed to go along with
                        <a href="https://github.com/mattbatwings" target="_blank">MattBatWings'</a>
                        <a href="https://github.com/mattbatwings/BatPU-2" target="_blank">Redstone CPU</a>.
                        I made this as a kind of companion project while I was building his in-game CPU
                        design, as a way to better understand how and why everything works in a more technical way
                        than just building the circuits.</p>
                    </div>
                    <div class="doc-section">
                        <h3>Features</h3>
                        <ul>
                            <li>Complete emulator matching the capabilities of the original CPU</li>
                            <li>Visual displays for program output</li>
                            <li>Input controller for user interaction</li>
                            <li>Display of the ALU flag states</li>
                            <li>Panels to view the contents of the Registers and Memory</li>
                            <li>Text editor for writing and assembling programs based on the ISA</li>
                            <li>Error detection and reporting</li>
                            <li>Full ISA and Protocol documentation</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Credits</h2>
                        <span class="doc-badge">Info</span>
                    </div>
                    <div class="doc-section">
                        <h3>Special Thanks to:</h3>
                        <ul>
                            <li>
                                <strong><a href="https://github.com/mattbatwings" target="_blank">MattBatWings</a></strong> for
                                the original CPU design, Instruction Set, Protocol, and for being an amazing teacher and
                                great source of inspiration for this project.
                            </li>
                            <li>
                                <strong><a href="https://github.com/AdoHTQ" target="_blank">AdoHTQ</a></strong> for the 
                                original emulator layout.
                            </li>
                            <li>
                                <strong><a href="https://github.com/ArmadilloMike" target="_blank">ArmadilloMike</a></strong> for some
                                bugfixing help and feedback.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        }
    },

    changelog: {
        title: "Changelog",

        render() {
            return `
            <div class="doc-page">
                <div class="doc-header">
                    <h1>Changelog</h1>
                    <p>Recent updates and improvements to the emulator.</p>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Version 1.0</h2>
                        <span class="doc-badge">INITIAL RELEASE</span>
                    </div>
                    <div class="doc-section">
                        <h3>July 7, 2026</h3>
                        <ul>
                            <li>First public release of the emulator.</li>
                            <li>ISA and Protocol implemented.</li>
                            <li>Basic UI and controls functional.</li>
                            <li>Documentation and Error Detection framework started.</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Version 1.1</h2>
                        <span class="doc-badge">BUGFIXING</span>
                        <span class="doc-badge">UI & STYLING</span>
                        <span class="doc-badge">QUALITY OF LIFE</span>
                    </div>
                    <div class="doc-section">
                        <h3>July 8, 2026</h3>
                        <ul>
                            <li>Modal styling updated to improve consistency.</li>
                            <li>Other general styling improvements.</li>
                            <li>Improved execution rate slider</li>
                            <li>Fixed issue with memory display not updating correctly after device writes.</li>
                            <li>Fixed bug with the controller not updating its state correctly when buttons are pressed.</li>
                            <li>ISA and Protocol documentation finished.</li>
                            <li>Added help and about pages.</li>
                            <li>Added changelog.</li>
                            <li>Will anyone actually read this?</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Version 1.2</h2>
                        <span class="doc-badge">NEW FEATURES</span>
                        <span class="doc-badge">UI & STYLING</span>
                        <span class="doc-badge">BUGFIXING</span>
                    </div>
                    <div class="doc-section">
                        <h3>July 9, 2026</h3>
                        <ul>
                            <li>Implemented error detection and handling.</li>
                            <li>Added line numbering to the side of the editor.</li>
                            <ul>
                                <li>First column displays line numbers.</li>
                                <li>Second column displays instruction numbers (Ignores comments and empty lines).</li>
                            </ul>
                            <li>Added a stack display panel to show the size and top of the stack.</li>
                            <li>Made Program Counter render with <span class="code">cpu.pc - 1</span>. Temporary fix. Program Counter will be changed to start at 0 in future updates.</li>
                            <li>Added PC display placeholder for when the program counter is not running.</li>
                            <li>Added a link to the project repository.</li>
                            <li>Finished about page with project overview and features.</li>
                            <li>Began work on the about page</li>
                            <li>Small styling improvements.</li>
                            <li>There are probably a ton of bugs so if you find any please let me know!</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Version 1.21</h2>
                        <span class="doc-badge">UI & STYLING</span>
                        <span class="doc-badge">QUALITY OF LIFE</span>
                    </div>
                    <div class="doc-section">
                        <h3>July 10, 2026</h3>
                        <ul>
                            <li>Fixed bug with speed slider being off-center</li>
                            <li>Made UI panels/IO Windows wider</li>
                            <li>Improved sizing of text field gutter</li>
                            <li>Disabled spellcheck underlining in editor</li>
                            <ul>
                                <li>Built in error underlining will be added soon, probably</li>
                            </ul>
                            <li>Improved the look of stack display</li>
                            <li>Made resetting the CPU also reset the stack</li>
                            <li>Added credits in About page</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Version 1.3</h2>
                        <span class="doc-badge">NEW FEATURES</span>
                        <span class="doc-badge">QUALITY OF LIFE</span>
                    </div>
                    <div class="doc-section">
                        <h3>July 13, 2026</h3>
                        <ul>
                            <li>Created menu for loading presets</li>
                            <ul>
                                <li>Presets are just pre-written programs that are ready for use</li>
                                <li>Credit is given to the creators of the programs</li>
                                <li>
                                    More presets will be added as the emulator gets closer to being complete; currently it is only powerful 
                                    enough to run the dvd logo program, one of the simplest programs in Matt's showcase, and it doesn't really work that well. 
                                </li>
                            </ul>
                            <li>Added a folder in the repository for storing images for use in the preset menu</li>
                            <li>Added custom alert box library</li>
                            <li>Added a new type of button for use in the documentation menus</li>
                            <li>Fixed bug with the pixel display clearing both the buffer and front on clear</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        }
    }

};

const Instructions = {

    NOP: {

        syntax: "NOP",

        operands: [],

        description:
            "No operation."

    },

    HLT: {

        syntax: "HLT",

        operands: [],

        description:
            "Halts the program."

    },

    ADD: {

        category: "Arithmetic",

        syntax: "ADD rA rB rC",

        operands: [
            ["rA", "Source Register"],
            ["rB", "Source Register"],
            ["rC", "Destination Register"]
        ],

        description:
            "Adds two registers.",

        flags: ["Z", "C"],

        pseudo: "rC = rA + rB;",

        example: "ADD r1 r2 r3"

    },

    SUB: {

        category: "Arithmetic",

        syntax: "SUB rA rB rC",

        operands: [
            ["rA", "Source Register"],
            ["rB", "Source Register"],
            ["rC", "Destination Register"]
        ],

        description:
            "Subtracts two registers.",

        flags: ["Z", "C"],

        pseudo: "rC = rA - rB;",

        example: "SUB r1 r2 r3"

    },

    NOR: {

        category: "Arithmetic",

        syntax: "NOR rA rB rC",

        operands: [
            ["rA", "Source Register"],
            ["rB", "Source Register"],
            ["rC", "Destination Register"]
        ],

        description:
            "Preforms bitwise NOR upon two registers.",

        flags: ["Z", "C"],

        pseudo: "rC = ~(rA | rB);",

        example: "NOR r1 r2 r3"

    },

    AND: {

        category: "Arithmetic",

        syntax: "AND rA rB rC",

        operands: [
            ["rA", "Source Register"],
            ["rB", "Source Register"],
            ["rC", "Destination Register"]
        ],

        description:
            "Preforms bitwise AND upon two registers.",

        flags: ["Z", "C"],

        pseudo: "rC = rA & rB;",

        example: "AND r1 r2 r3"

    },

    XOR: {

        category: "Arithmetic",

        syntax: "XOR rA rB rC",

        operands: [
            ["rA", "Source Register"],
            ["rB", "Source Register"],
            ["rC", "Destination Register"]
        ],

        description:
            "Preforms bitwise XOR upon two registers.",

        flags: ["Z", "C"],

        pseudo: "rC = rA ^ rB;",

        example: "XOR r1 r2 r3"

    },

    RSH: {

        category: "Arithmetic",

        syntax: "RSH rA rB",

        operands: [
            ["rA", "Source Register"],
            ["rB", "Destination Register"]
        ],

        description:
            "Shifts the bits of a register to the right.",

        flags: ["Z", "C"],

        pseudo: "rB = rA >> 1;",

        example: "RSH r1 r2"

    },

    LDI: {

        category: "Register Manipulation",

        syntax: "LDI rA val",

        operands: [
            ["rA", "Destination Register"],
            ["val", "Immediate Value"]
        ],

        description:
            "Loads a value into a register.",

        pseudo: "rA = val;",

        example: "LDI r1 128"

    },

    ADI: {

        category: "Register Manipulation",

        syntax: "ADI rA val",

        operands: [
            ["rA", "Destination Register"],
            ["val", "Immediate Value"]
        ],

        description:
            "Adds a value to a register.",

        flags: ["Z", "C"],

        pseudo: "rA += val;",

        example: "ADI r1 128"

    },

    JMP: {

        category: "Branching and Subroutines",

        syntax: "JMP address",

        operands: [
            ["address", "Program Counter Address"]
        ],

        description:
            "Jumps to the specified instruction address.",

        pseudo: "PC = address;",

        example: "JMP 256"

    },

    BRH: {

        category: "Branching and Subroutines",

        syntax: "BRH condition address",

        operands: [
            ["condition", "Flag Condition"],
            ["address", "Program Counter Address"]
        ],

        description:
            "Jumps to the specified instruction address if the condition is true.",

        pseudo: "if (condition) PC = address;",

        example: "BRH C 256"

    },

    CAL: {

        category: "Branching and Subroutines",

        syntax: "CAL address",

        operands: [
            ["address", "Program Counter Address"]
        ],

        description:
            "Pushes the next address to the stack and jumps to the specified instruction address.",

        pseudo: "stack.push(PC + 1); PC = address;",

        example: "CAL 256"

    },

    RET: {

        category: "Branching and Subroutines",

        syntax: "RET",

        operands: [],

        description:
            "Pops the last address from the stack and jumps to that address.",

        pseudo: "PC = stack.pop();",

        example: `JMP 256
RET`

    },

    LOD: {

        category: "Memory Manipulation",

        syntax: "LOD rA rB offset",

        operands: [
            ["rA", "Pointer Register"],
            ["rB", "Destination Register"],
            ["offset", "Pointer Offset (4-Bit 2's Complement)"]
        ],

        description:
            "Loads from the data memory.",

        pseudo: "rB = mem[rA + offset];",

        example: "LOD r1 r2 3"

    },

    STR: {

        category: "Memory Manipulation",

        syntax: "STR rA rB offset",

        operands: [
            ["rA", "Pointer Register"],
            ["rB", "Data Register"],
            ["offset", "Pointer Offset (4-Bit 2's Complement)"]
        ],

        description:
            "Stores a value to the data memory.",

        pseudo: "mem[rA + offset] = rB;",

        example: "STR r1 r2 3"

    },

};

const Devices = {

    screen: {

        title: "Pixel Display",

        description: "A 32x32 grid, where each pixel has two states, On or Off.",

        addresses: {

            240: {
                access: "Write",
                description: "X coordinate"
            },

            241: {
                access: "Write",
                description: "Y coordinate"
            },

            242: {
                access: "Write",
                description: "Draw pixel on write"
            },

            243: {
                access: "Write",
                description: "Clear pixel on write"
            },

            244: {
                access: "Read",
                description: "Read pixel state"
            },

            245: {
                access: "Write",
                description: "Flush buffer to front on write"
            },

            246: {
                access: "Write",
                description: "Clear buffer on write"
            }

        }

    },

    chars: {

        title: "Character Display",

        description: "A character display that can show up to 10 characters from a specialized charset.",

        addresses: {

            247: {
                access: "Write",
                description: "Write character to buffer"
            },

            248: {
                access: "Write",
                description: "Flush buffer to front on write"
            },

            249: {
                access: "Write",
                description: "Clear buffer on write"
            },

        }

    },

    num: {

        title: "Number Display",

        description: "An 8-Bit number display that can interpret the value it is displaying as either unsigned or as signed two's complement.",

        addresses: {

            250: {
                access: "Write",
                description: "Display number"
            },

            251: {
                access: "Write",
                description: "Clear display on write"
            },

            252: {
                access: "Write",
                description: "Switch display to signed mode on write"
            },

            253: {
                access: "Write",
                description: "Switch display to unsigned mode on write"
            },

        }

    },

    randnum: {

        title: "Random Number Generator",

        description: "A RNG that can generate a random 8-Bit number.",

        addresses: {

            254: {
                access: "Read",
                description: "Random Number"
            }

        }

    },

    controller: {

        title: "Controller",

        description: "A controller with 8 buttons used for taking user input, with each button corresponding to one bit of data.",

        addresses: {

            255: {
                access: "Read",
                description: "Controller state"
            }

        }

    }

};

async function loadPreset(name) {

    const preset = Presets[name];

    if (!preset) return;

    const result = await Swal.fire({
        title: `Load "${preset.title}"?`,
        text: "This will overwrite your current program.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Load",
        cancelButtonText: "Cancel",
        buttonsStyling: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
    });

    if (!result.isConfirmed) return;

    codeEditor.value = preset.code;

    updateEditorGutter();

    modal.close();

}

const Presets = {

    dvdlogo: {

        title: "DVD Logo",

        author: "zPippo",

        description: "Displays the clssic bouncing DVD logo on the pixel display.",

        imageName: "dvdlogoimg",

        code: `; DVD LOGO - By zPippo

ldi r1 0
ldi r2 79
str r1 r2
adi r1 1
ldi r2 201
str r1 r2
adi r1 1
ldi r2 230
str r1 r2
adi r1 1
ldi r2 224
str r1 r2
adi r1 1
ldi r2 231
str r1 r2
adi r1 1
ldi r2 168
str r1 r2
adi r1 1
ldi r2 231
str r1 r2
adi r1 1
ldi r2 224
str r1 r2
adi r1 1
ldi r2 239
str r1 r2
adi r1 1
ldi r2 105
str r1 r2
adi r1 1
ldi r2 70
str r1 r2
adi r1 1

ldi r1 0 ; X position
ldi r2 0 ; Y position
ldi r3 1 ; X velocity
ldi r4 1 ; Y velocity

ldi r11 246
ldi r12 240
ldi r13 241
ldi r14 242
ldi r15 245

;.loop
str r11 r0
cal 49 ; .draw_logo
str r15 r0
cal 71 ; .movement
cal 74 ; .collision

jmp 43 ; .loop


; .draw_logo
ldi r8 0
ldi r9 11
ldi r10 1
; .next_byte
	lod r8 r7
	ldi r6 8
	add r8 r1 r8
	str r12 r8
	sub r8 r1 r8
	; .next_pixel
		adi r6 255
		
		and r7 r10 r0
		brh Z 64; .skip_pixel
		add r6 r2 r6
		str r13 r6
		sub r6 r2 r6
		str r14 r0
		; .skip_pixel
		rsh r7 r7
		
		add r6 r0 r6
		brh !Z 57; .next_pixel
	
	adi r8 1
	sub r8 r9 r0
	brh !Z 52; .next_byte

ret


; .movement
add r1 r3 r1
add r2 r4 r2
ret


; .collision
ldi r5 21
ldi r6 24
sub r1 r5 r0
brh Z 85; .invert_x
sub r1 r0 r0
brh Z 85; .invert_x
; .y_check
sub r2 r6 r0
brh Z 87; .invert_y
sub r2 r0 r0
brh Z 87; .invert_y
ret

; .invert_x
sub r0 r3 r3
jmp 80; .y_check

; .invert_y
sub r0 r4 r4
ret
`

    }

}

/* ===== Setup ===== */
const pixelGrid = document.getElementById("pixel-grid");
const regDisplay = document.getElementById("reg-file-display");
const memoryDisplay = document.getElementById("data-memory-display");
const textDisplay = document.getElementById("text-display");
const numDisplay = document.getElementById("num-display");
const cpuStatusText = document.getElementById("cpu-status-text");
const speedSlider = document.getElementById("program-speed-slider");
const speedValue = document.getElementById("speed-value");
const outputRow = document.getElementById("output-row");
const editorGutter = document.getElementById("editor-gutter");
const codeEditor = document.getElementById("code-editor");
const editorLineMap = [];

// Create pixel elements (32x32)
for (let i = 0; i < 32 * 32; i++) {
    const pixel = document.createElement("div");
    pixel.className = "pixel";
    pixelGrid.appendChild(pixel);
}

// Create register cells cache
const regCells = {};
for (let i = 1; i < 16; i++) {
    const cell = document.createElement("div");
    cell.className = "reg-cell";
    cell.innerHTML = `
                <div>r${i}</div>
                <div class="reg-dec">0</div>
                <div class="reg-bin">
                    <div class="bin-top">0000</div>
                    <div class="bin-bottom">0000</div>
                </div>`;
    regDisplay.appendChild(cell);
    regCells[i] = {
        dec: cell.querySelector(".reg-dec"),
        binTop: cell.querySelector(".bin-top"),
        binBottom: cell.querySelector(".bin-bottom"),
    };
}

// Create memory cells cache
const memCells = [];
for (let i = 0; i < 256; i++) {
    const cell = document.createElement("div");
    cell.className = "mem-cell";
    cell.innerHTML = `
                <div>${String(i).padStart(3, "0")}</div>
                <div class="mem-dec">0</div>
                <div class="mem-bin">
                    <div class="bin-top">0000</div>
                    <div class="bin-bottom">0000</div>
                </div>`;
    memoryDisplay.appendChild(cell);
    memCells.push({
        dec: cell.querySelector(".mem-dec"),
        binTop: cell.querySelector(".bin-top"),
        binBottom: cell.querySelector(".bin-bottom"),
    });
}

/* ===== Main Class ===== */
class Machine {

    constructor(cpu, memory, ui) {

        this.cpu = cpu;
        this.memory = memory;
        this.ui = ui;

        this.interval = null;
        this.lastStepTime = 0;
        this.lastSpeedSampleTime = performance.now();
        this.ticksSinceLastSpeedSample = 0;
        this.displayedSpeedHz = Number(speedSlider.value);
        this.intervalMode = "timer";
        this.accumulator = 0;

    }

    tick() {

        this.memory.tick();
        this.cpu.step();
        this.ui.render();
        this.updateSpeedDisplay();

    }

    updateSpeedDisplay() {

        this.ticksSinceLastSpeedSample += 1;

        const now = performance.now();
        const elapsed = now - this.lastSpeedSampleTime;

        if (elapsed >= 250) {
            const measuredHz = Math.max(1, Math.round((this.ticksSinceLastSpeedSample / elapsed) * 1000));
            this.displayedSpeedHz = measuredHz;
            this.ticksSinceLastSpeedSample = 0;
            this.lastSpeedSampleTime = now;
            updateSpeedText(this.displayedSpeedHz);
        }

    }

    start() {

        if (this.interval) return;
        this.cpu.running = true;
        this.lastStepTime = performance.now();
        this.lastSpeedSampleTime = performance.now();
        this.ticksSinceLastSpeedSample = 0;
        this.displayedSpeedHz = Number(speedSlider.value);
        updateSpeedText(this.displayedSpeedHz);

        const targetSpeed = Number(speedSlider.value);
        this.intervalMode = targetSpeed < 60 ? "loop" : "timer";
        this.accumulator = 0;

        if (this.intervalMode === "loop") {
            const loop = () => {
                if (!this.cpu.running) return;
                this.tick();
                this.interval = setTimeout(loop, getSpeedDelay());
            };
            this.interval = setTimeout(loop, getSpeedDelay());
            return;
        }

        const runTimer = () => {
            if (!this.cpu.running) return;

            const now = performance.now();
            const stepInterval = Math.max(1, Math.round(1000 / targetSpeed));
            const elapsed = now - this.lastStepTime;
            this.lastStepTime = now;
            this.accumulator += elapsed;

            let steps = 0;
            while (this.accumulator >= stepInterval && steps < 8) {
                this.tick();
                this.accumulator -= stepInterval;
                steps += 1;
            }

            const wait = Math.max(1, Math.ceil(stepInterval));
            this.interval = setTimeout(runTimer, wait);
        };

        this.lastStepTime = performance.now();
        this.interval = setTimeout(runTimer, Math.max(1, Math.round(1000 / targetSpeed)));

    }

    stop() {

        this.cpu.running = false;
        if (this.interval !== null) {
            if (this.intervalMode === "loop") {
                clearTimeout(this.interval);
            } else {
                clearTimeout(this.interval);
            }
        }
        this.interval = null;
        this.intervalMode = "timer";
        updateSpeedText(Number(speedSlider.value));

    }

    restart() {

        if (this.cpu.running) {
            this.stop();
            this.start();
        }

    }

    reset() {

        this.stop();
        this.cpu.pc = 0;
        this.cpu.flags.Z = 0;
        this.cpu.flags.C = 0;
        this.cpu.registers.fill(0);
        this.memory.reset();
        this.cpu.stack = [];
        this.ui.render();

    }

}

/* ===== Assembler and Instruction Classes ===== */
class Assembler {

    static assemble(source) {
        return this.assembleWithDiagnostics(source).program;
    }

    static assembleWithDiagnostics(source) {
        const program = [];
        const problems = [];

        source
            .split("\n")
            .forEach((rawLine, index) => {
                const lineText = rawLine.split(";")[0].trim();

                if (!lineText) return;

                const normalized = lineText.replace(/\s+/g, " ");
                const instruction = this.decodeInstruction(normalized, index + 1);
                const lineProblems = this.validateInstruction(instruction);

                if (lineProblems.length > 0) {
                    problems.push(...lineProblems);
                    return;
                }

                program.push(instruction);
            });

        return { program, problems };
    }

    static decodeInstruction(line, lineNumber) {

        const parts = line.split(" ");
        return new Instruction(parts[0].toUpperCase(), parts.slice(1), lineNumber);

    }

    static validateInstruction(instruction) {

        const problems = [];
        const { op, args = [], line } = instruction;

        if (!this.isValidOpcode(op)) {
            problems.push({
                type: "error",
                message: `Unknown opcode "${op}"`,
                line
            });
            return problems;
        }

        switch (op) {
            case "NOP":
            case "HLT":
                if (args.length !== 0) {
                    problems.push({
                        type: "error",
                        message: `${op} does not take operands`,
                        line
                    });
                }
                break;

            case "ADD":
            case "SUB":
            case "NOR":
            case "AND":
            case "XOR":
                if (args.length !== 3) {
                    problems.push({
                        type: "error",
                        message: `${op} requires 3 operands`,
                        line
                    });
                    break;
                }

                [0, 1, 2].forEach(index => {
                    if (!this.isRegister(args[index])) {
                        problems.push({
                            type: "error",
                            message: `Operand ${index + 1} must be a valid register`,
                            line
                        });
                    }
                });
                break;

            case "RSH":
                if (args.length !== 2) {
                    problems.push({
                        type: "error",
                        message: `${op} requires 2 operands`,
                        line
                    });
                    break;
                }

                if (!this.isRegister(args[0]) || !this.isRegister(args[1])) {
                    problems.push({
                        type: "error",
                        message: `RSH requires two register operands`,
                        line
                    });
                }
                break;

            case "LDI":
            case "ADI":
                if (args.length !== 2) {
                    problems.push({
                        type: "error",
                        message: `${op} requires 2 operands`,
                        line
                    });
                    break;
                }

                if (!this.isRegister(args[0]) || !this.isImmediateArg(args[1])) {
                    problems.push({
                        type: "error",
                        message: `${op} requires a register and an immediate value`,
                        line
                    });
                    break;
                }

                if (this.parseImmediate(args[1]) < 0 || this.parseImmediate(args[1]) > 255) {
                    problems.push({
                        type: "error",
                        message: `${op} immediate value must be between 0 and 255`,
                        line
                    });
                }
                break;

            case "JMP":
            case "CAL":
                if (args.length !== 1 || !this.isImmediateArg(args[0])) {
                    problems.push({
                        type: "error",
                        message: `${op} requires one immediate address`,
                        line
                    });
                    break;
                }

                if (this.parseImmediate(args[0]) < 0 || this.parseImmediate(args[0]) > 1023) {
                    problems.push({
                        type: "error",
                        message: `${op} address must be between 0 and 1023`,
                        line
                    });
                }
                break;

            case "BRH":
                if (args.length !== 2) {
                    problems.push({
                        type: "error",
                        message: `${op} requires a condition and an address`,
                        line
                    });
                    break;
                }

                if (!this.isBranchCondition(args[0])) {
                    problems.push({
                        type: "error",
                        message: `BRH condition must be one of: 0, Z, !0, !Z, C, !C`,
                        line
                    });
                }

                if (!this.isImmediateArg(args[1])) {
                    problems.push({
                        type: "error",
                        message: `BRH address must be an immediate value`,
                        line
                    });
                    break;
                }

                if (this.parseImmediate(args[1]) < 0 || this.parseImmediate(args[1]) > 1023) {
                    problems.push({
                        type: "error",
                        message: `BRH address must be between 0 and 1023`,
                        line
                    });
                }
                break;

            case "RET":
                if (args.length !== 0) {
                    problems.push({
                        type: "error",
                        message: `RET does not take operands`,
                        line
                    });
                }
                break;

            case "LOD":
            case "STR":
                if (args.length !== 2 && args.length !== 3) {
                    problems.push({
                        type: "error",
                        message: `${op} requires 2 or 3 operands`,
                        line
                    });
                    break;
                }

                if (!this.isRegister(args[0])) {
                    problems.push({
                        type: "error",
                        message: `${op} pointer operand must be a register`,
                        line
                    });
                }

                if (!this.isRegister(args[1])) {
                    problems.push({
                        type: "error",
                        message: `${op} data operand must be a register`,
                        line
                    });
                }

                if (args.length === 3 && !this.isImmediateArg(args[2])) {
                    problems.push({
                        type: "error",
                        message: `${op} offset must be an immediate value`,
                        line
                    });
                    break;
                }

                if (args.length === 3 && (this.parseImmediate(args[2]) < -8 || this.parseImmediate(args[2]) > 7)) {
                    problems.push({
                        type: "error",
                        message: `${op} offset must be between -8 and 7`,
                        line
                    });
                }
                break;
        }

        return problems;
    }

    static isValidOpcode(op) {

        return [
            "NOP", "HLT",
            "ADD", "SUB", "NOR", "AND", "XOR", "RSH",
            "LDI", "ADI",
            "JMP", "BRH", "CAL", "RET",
            "LOD", "STR"
        ].includes(op);

    }

    static isRegister(value) {

        return typeof value === "string" && /^r(?:[0-9]|1[0-5])$/.test(value);

    }

    static isImmediateArg(value) {

        if (typeof value !== "string") return false;

        if (value.startsWith("0b")) return !Number.isNaN(parseInt(value.slice(2), 2));
        if (value.startsWith("0x")) return !Number.isNaN(parseInt(value.slice(2), 16));

        return !Number.isNaN(Number(value));

    }

    static isBranchCondition(value) {

        return ["0", "Z", "!0", "!Z", "C", "!C"].includes(value.toUpperCase());

    }

    static parseImmediate(str) {

        if (typeof str !== "string") return str;

        if (str.startsWith("0b")) return parseInt(str.slice(2), 2);
        if (str.startsWith("0x")) return parseInt(str.slice(2), 16);

        return Number(str);

    }

}

class Instruction {

    constructor(op, args, line = null) {

        this.op = op;
        this.args = args;
        this.line = line;

    }

}

/* ===== CPU Class ===== */
class CPU {

    constructor(memory) {

        this.running = false;

        this.pc = 0;
        this.stack = [];
        this.flags = {
            Z: 0,
            C: 0
        }

        this.registers = new Uint8Array(16);
        this.memory = memory;

        this.program = [];
        this.loaded = false;

        this.instructions = {

            NOP: this.executeNOP.bind(this),
            HLT: this.executeHLT.bind(this),

            ADD: this.executeADD.bind(this),
            SUB: this.executeSUB.bind(this),
            NOR: this.executeNOR.bind(this),
            AND: this.executeAND.bind(this),
            XOR: this.executeXOR.bind(this),
            RSH: this.executeRSH.bind(this),

            LDI: this.executeLDI.bind(this),
            ADI: this.executeADI.bind(this),

            JMP: this.executeJMP.bind(this),
            BRH: this.executeBRH.bind(this),
            CAL: this.executeCAL.bind(this),
            RET: this.executeRET.bind(this),

            LOD: this.executeLOD.bind(this),
            STR: this.executeSTR.bind(this),

        };

    }

    setFlags(result) {

        this.flags.Z = (result & 0xff) === 0 ? 1 : 0;

    }

    parseRegister(r) {

        if (typeof r !== "string" || !r.startsWith("r")) throw new Error("Invalid register: " + r);

        return Number(r.slice(1));

    }

    writeRegister(idx, value) {

        if (idx === 0) return;

        this.registers[idx] = value & 0xff;

    }

    step() {

        if (this.pc >= this.program.length) {
            this.running = false;
            return;
        }

        const instruction = this.program[this.pc++];

        try {
            this.execute(instruction);
        } catch (err) {
            problems.add("error", err.message, instruction.line);
            this.running = false;
        }

        this.registers[0] = 0;

    }

    /* Basic Instructions */
    executeNOP(args) {

        return;

    }

    executeHLT(args) {

        this.running = false;

    }

    /* Arithmetic-Logic Instructions */
    executeADD(args) {

        const rA = this.parseRegister(args[0]);
        const rB = this.parseRegister(args[1]);
        const rC = this.parseRegister(args[2]);
        const val = this.registers[rA] + this.registers[rB];
        this.flags.C = val > 255 ? 1 : 0;
        this.writeRegister(rC, val);
        this.setFlags(val);

    }

    executeSUB(args) {

        const rA = this.parseRegister(args[0]);
        const rB = this.parseRegister(args[1]);
        const rC = this.parseRegister(args[2]);
        const val = this.registers[rA] - this.registers[rB];
        this.flags.C = val < 0 ? 1 : 0;
        this.writeRegister(rC, val);
        this.setFlags(val);

    }

    executeNOR(args) {

        const rA = this.parseRegister(args[0]);
        const rB = this.parseRegister(args[1]);
        const rC = this.parseRegister(args[2]);
        const val = ~(this.registers[rA] | this.registers[rB]) & 0xff;
        this.flags.C = val > 255 ? 1 : 0;
        this.writeRegister(rC, val);
        this.setFlags(val);

    }

    executeAND(args) {

        const rA = this.parseRegister(args[0]);
        const rB = this.parseRegister(args[1]);
        const rC = this.parseRegister(args[2]);
        const val = this.registers[rA] & this.registers[rB];
        this.flags.C = val > 255 ? 1 : 0;
        this.writeRegister(rC, val);
        this.setFlags(val);

    }

    executeXOR(args) {

        const rA = this.parseRegister(args[0]);
        const rB = this.parseRegister(args[1]);
        const rC = this.parseRegister(args[2]);
        const val = this.registers[rA] ^ this.registers[rB];
        this.flags.C = val > 255 ? 1 : 0;
        this.writeRegister(rC, val);
        this.setFlags(val);

    }

    executeRSH(args) {

        const rA = this.parseRegister(args[0]);
        const rC = this.parseRegister(args[1]);
        this.flags.C = this.registers[rA] & 1;
        const val = (this.registers[rA] >>> 1) & 0xff;
        this.writeRegister(rC, val);
        this.setFlags(val);

    }

    /* Register Manipulation Instructions */
    executeLDI(args) {

        const rA = this.parseRegister(args[0]);
        const val = Assembler.parseImmediate(args[1]);
        this.writeRegister(rA, val);

    }

    executeADI(args) {

        const rA = this.parseRegister(args[0]);
        const val = Assembler.parseImmediate(args[1]);
        const res = this.registers[rA] + val;
        this.flags.C = res > 255 ? 1 : 0;
        this.writeRegister(rA, res & 0xff);
        this.setFlags(res);

    }

    /* Branching and Subroutine Instructions */
    executeJMP(args) {

        const addr = Assembler.parseImmediate(args[0]);
        this.pc = addr;

    }

    executeBRH(args) {

        const cond = args[0].toUpperCase();
        const addr = Assembler.parseImmediate(args[1]);
        const isZero = this.flags.Z === 1;
        const isCarry = this.flags.C === 1;
        if (cond === "0" || cond === "Z") {
            if (isZero) this.pc = addr;
        } else if (cond === "!0" || cond === "!Z") {
            if (!isZero) this.pc = addr;
        } else if (cond === "C") {
            if (isCarry) this.pc = addr;
        } else if (cond === "!C") {
            if (!isCarry) this.pc = addr;
        }

    }

    executeCAL(args) {

        const addr = Assembler.parseImmediate(args[0]);
        this.stack.push(this.pc);
        this.pc = addr;

    }

    executeRET(args) {

        this.pc = this.stack.length ? this.stack.pop() : 0;

    }

    /* Memory Manipulation Instructions */
    executeLOD(args) {

        const rA = this.parseRegister(args[0]);
        let offset;
        let rB;

        if (args.length === 2) {
            offset = 0;
            rB = this.parseRegister(args[1]);
        } else {
            offset = Assembler.parseImmediate(args[1]);
            rB = this.parseRegister(args[2]);
        }

        const addr = (this.registers[rA] + offset) & 0xff;

        this.writeRegister(rB, this.memory.read(addr));

    }

    executeSTR(args) {

        const rA = this.parseRegister(args[0]);
        let offset;
        let rB;

        if (args.length === 2) {
            offset = 0;
            rB = this.parseRegister(args[1]);
        } else {
            offset = Assembler.parseImmediate(args[1]);
            rB = this.parseRegister(args[2]);
        }

        const addr = (this.registers[rA] + offset) & 0xff;

        this.memory.write(addr, this.registers[rB]);

    }

    execute({ op, args }) {

        const fn = this.instructions[op];

        if (!fn) throw new Error(`Unknown opcode: "${op}"`);

        fn(args);

    }

}

/* ===== Memory Class ===== */
class Memory {

    constructor() {

        this.data = new Uint8Array(256);
        this.devices = [];

    }

    register(device) {

        this.devices.push(device)

    }

    read(addr) {

        addr &= 0xff;

        for (const device of this.devices) {
            if (device.owns(addr)) {
                const value = device.read(addr);
                if (value !== null) return value;
            }
        }

        return this.data[addr];

    }

    write(addr, value) {

        addr &= 0xff;
        value &= 0xff;

        this.data[addr] = value;

        for (const device of this.devices) {
            if (device.owns(addr)) {
                device.write(addr, value);
                return;
            }
        }

    }

    tick() {

        for (const device of this.devices) device.tick();

    }

    reset() {

        this.data.fill(0);

        for (const d of this.devices) d.reset();

    }

}

/* ===== UI Class ===== */
class UI {

    constructor(cpu, memory) {

        this.cpu = cpu;
        this.memory = memory;

    }

    setStatus(running) {

        cpuStatusText.textContent = running ? "RUNNING" : "HALTED";

        cpuStatusText.classList.toggle(
            "status-running", running
        );

    }

    updateFlags() {

        const zeroFlag = document.getElementById("flag-zero");
        const carryFlag = document.getElementById("flag-carry");

        zeroFlag.querySelector(".flag-value").textContent = this.cpu.flags.Z;
        carryFlag.querySelector(".flag-value").textContent = this.cpu.flags.C;

        zeroFlag.classList.toggle("active", this.cpu.flags.Z === 1);
        carryFlag.classList.toggle("active", this.cpu.flags.C === 1);

    }

    updateStack() {
        const stackSize = document.getElementById("stack-size");
        const stackTop = document.getElementById("stack-top");

        const addr = this.cpu.stack.length > 0 ? this.cpu.stack[this.cpu.stack.length - 1] : null;

        stackSize.querySelector(".stack-value").textContent = this.cpu.stack.length;
        stackTop.querySelector(".stack-value").textContent = addr !== null ? addr.toString(2).padStart(10, "0").toUpperCase() : "----------";
    }

    updateRegisters() {

        for (let i = 1; i < 16; i++) {
            const v = this.cpu.registers[i];
            regCells[i].dec.textContent = v;
            const bin = formatBinaryRows(v);
            regCells[i].binTop.textContent = bin.top;
            regCells[i].binBottom.textContent = bin.bottom;
        }

    }

    updateMemory() {

        for (let i = 0; i < 256; i++) {
            const v = this.memory.data[i];
            memCells[i].dec.textContent = v;
            const bin = formatBinaryRows(v);
            memCells[i].binTop.textContent = bin.top;
            memCells[i].binBottom.textContent = bin.bottom;
        }

    }

    render() {

        this.setStatus(this.cpu.running);

        this.updateFlags();
        this.updateStack();
        this.updateRegisters();
        this.updateMemory();

        if (this.cpu.pc !== 0) {
            document.querySelector(
                "#cpu-status-bar div:nth-child(2)"
            ).textContent =
                `PC: ${String(this.cpu.pc - 1).padStart(4, "0")}`;
        } else {
            document.querySelector(
                "#cpu-status-bar div:nth-child(2)"
            ).textContent =
                `PC: ----`;
        }

    }

}

/* ===== IO Device Classes */
class Device {

    constructor(start, end = start) {

        this.start = start;
        this.end = end;

    }

    owns(addr) {

        return addr >= this.start && addr <= this.end;

    }

    read(addr) {

        return null;

    }

    write(addr, value) { }

    tick() { }

    reset() { }

}

class ScreenDevice extends Device {

    constructor(memory, pixelGrid) {

        super(240, 246);
        memory.register(this);

        this.pixelGrid = pixelGrid;

        this.px = 0;
        this.py = 0;

        this.buffer = new Uint8Array(32 * 32);
        this.frontBuffer = new Uint8Array(32 * 32);

    }

    read(addr) {

        if (addr === 244) return this.getPixel(this.px, this.py);

        return 0;

    }

    write(addr, value) {

        switch (addr) {
            case 240: this.px = value & 0x1f; break;
            case 241: this.py = value & 0x1f; break;
            case 242: this.setPixel(clamp(this.px, 32), clamp(this.py, 32), 1); break;
            case 243: this.setPixel(clamp(this.px, 32), clamp(this.py, 32), 0); break;
            case 245: this.flushScreen(); break;
            case 246: this.clearScreen(); break;
        }

    }

    setPixel(x, y, v) {

        const idx = y * 32 + x;
        this.buffer[idx] = v ? 1 : 0;

    }

    getPixel(x, y) {

        return this.buffer[y * 32 + x] || 0;

    }

    flushScreen() {
        this.frontBuffer.set(this.buffer);

        for (let i = 0; i < 32 * 32; i++) {
            this.pixelGrid.children[i]
                .classList.toggle("active", this.frontBuffer[i]);
        }
    }

    clearScreen() {
        this.buffer.fill(0);
    }

    reset() {

        this.clearScreen();
        this.flushScreen();

    }

}

class CharacterDevice extends Device {

    constructor(memory) {

        super(247, 249);
        memory.register(this);

        this.buffer = [];
        this.front = "";

    }

    write(addr, value) {

        switch (addr) {
            case 247: this.writeChar(String.fromCharCode(value)); break;
            case 248: this.flushChars(); break;
            case 249: this.clearCharsBuffer(); break;
        }

    }

    writeChar(c) {

        if (this.buffer.length >= 10) return;
        this.buffer.push(c);

    }

    flushChars() {

        this.front = this.buffer.join("");
        textDisplay.textContent = this.front;

    }

    clearCharsBuffer() {

        this.buffer = [];

    }

    reset() {

        this.clearCharsBuffer();
        this.flushChars();

    }

}

class NumberDevice extends Device {

    constructor(memory) {

        super(250, 253);
        memory.register(this);

        this.displayNumber = 0;
        this.showNumber = false;
        this.numberMode = "unsigned";

    }

    write(addr, value) {

        switch (addr) {
            case 250: this.setNumber(value); break;
            case 251: this.clearNumber(); break;
            case 252: this.setSigned(); break;
            case 253: this.setUnsigned(); break;
        }

    }

    setNumber(value) {

        this.displayNumber = value;
        this.showNumber = true;
        this.updateNumberDisplay();

    }

    clearNumber() {

        this.showNumber = false;
        this.updateNumberDisplay();

    }

    setUnsigned() {

        this.numberMode = "unsigned";
        this.updateNumberDisplay();

    }

    setSigned() {

        this.numberMode = "signed";
        this.updateNumberDisplay();

    }

    updateNumberDisplay() {
        if (!this.showNumber) {
            numDisplay.textContent = "";
        } else {
            let val = this.displayNumber;
            if (this.numberMode === "signed" && val & 0x80) val = val - 256;
            numDisplay.textContent = val;
        }

    }

    reset() {

        this.clearNumber()

    }

}

class RandomNumberDevice extends Device {

    constructor(memory) {

        super(254);
        memory.register(this);

    }

    read(addr) {

        if (addr === 254) return Math.floor(Math.random() * 256);

    }

}

class ControllerDevice extends Device {

    constructor(memory) {

        super(255);
        memory.register(this);

        this.memory = memory;

        this.liveState = {
            up: 0,
            down: 0,
            left: 0,
            right: 0,
            a: 0,
            b: 0,
            one: 0,
            two: 0
        }
        this.latchedState = {
            up: 0,
            down: 0,
            left: 0,
            right: 0,
            a: 0,
            b: 0,
            one: 0,
            two: 0
        };

        this.initBtns();

    }

    read(addr) {

        return this.readButtons();

    }

    syncMemory() {

        this.memory.data[255] = this.readButtons();

        if (typeof ui !== "undefined") {
            ui.updateMemory();
        }

    }

    updateState(key, value) {

        this.liveState[key] = value;
        this.latchedState = {
            ...this.liveState
        };
        this.syncMemory();

    }

    initBtns() {

        ["btn-up", "btn-dwn", "btn-lft", "btn-rgt"].forEach((id, i) =>
            this.bindButton(id, ["up", "down", "left", "right"][i])
        );

        this.bindButton("ctr-btn-a", "a");
        this.bindButton("ctr-btn-b", "b");

        this.bindButton("ctr-btn-one", "one");
        this.bindButton("ctr-btn-two", "two");

        this.setupKeyboard();

    }

    readButtons() {

        let v = 0;

        v |= this.latchedState.up << 0;
        v |= this.latchedState.down << 1;
        v |= this.latchedState.left << 2;
        v |= this.latchedState.right << 3;
        v |= this.latchedState.a << 4;
        v |= this.latchedState.b << 5;
        v |= this.latchedState.one << 6;
        v |= this.latchedState.two << 7;

        return v;

    }

    tick() {

        this.latchedState = {
            ...this.liveState
        };
        this.syncMemory();

    }

    bindButton(id, key) {

        const btn = document.getElementById(id);

        const press = () => this.updateState(key, 1);
        const release = () => this.updateState(key, 0);

        btn.addEventListener("mousedown", press);
        btn.addEventListener("mouseup", release);
        btn.addEventListener("mouseleave", release);

        btn.addEventListener("touchstart", e => {
            e.preventDefault();
            press();
        }, { passive: false });

        btn.addEventListener("touchend", release);
        btn.addEventListener("touchcancel", release);

    }

    setupKeyboard() {

        window.addEventListener("keydown", e => {

            switch (e.code) {

                case "ArrowUp": this.updateState("up", 1); break;
                case "ArrowDown": this.updateState("down", 1); break;
                case "ArrowLeft": this.updateState("left", 1); break;
                case "ArrowRight": this.updateState("right", 1); break;

                case "KeyZ": this.updateState("a", 1); break;
                case "KeyX": this.updateState("b", 1); break;

            }

        });

        window.addEventListener("keyup", e => {

            switch (e.code) {

                case "ArrowUp": this.updateState("up", 0); break;
                case "ArrowDown": this.updateState("down", 0); break;
                case "ArrowLeft": this.updateState("left", 0); break;
                case "ArrowRight": this.updateState("right", 0); break;

                case "KeyZ": this.updateState("a", 0); break;
                case "KeyX": this.updateState("b", 0); break;

            }

        });

        window.addEventListener("blur", () => {

            Object.keys(this.liveState).forEach(key => {
                this.updateState(key, 0);
            });

        });

    }

}

const memory = new Memory();
const screen = new ScreenDevice(memory, pixelGrid);
const charsdisplay = new CharacterDevice(memory);
const numdisplay = new NumberDevice(memory);
const randnum = new RandomNumberDevice(memory);
const controller = new ControllerDevice(memory);
const cpu = new CPU(memory);
const ui = new UI(cpu, memory);
const machine = new Machine(cpu, memory, ui);

let interval = null;

/* ===== Helpers ===== */
const clamp = (v, max) => Math.min(max - 1, Math.max(0, v));
const toBin = v => (v & 0xff).toString(2).padStart(8, "0");
const formatBinaryRows = v => {
    const b = toBin(v);
    return { top: b.slice(0, 4), bottom: b.slice(4) };
};
const getSpeedDelay = () => Math.max(1, Math.round(1000 / Number(speedSlider.value)));

function updateSpeedText(value) {
    speedValue.textContent = `${value} Hz`;
}

function updateEditorGutter(source = codeEditor.value) {
    const assembly = Assembler.assembleWithDiagnostics(source);
    const programLineMap = new Map(
        assembly.program.map((instruction, index) => [instruction.line, index])
    );

    editorLineMap.length = 0;
    const gutterLines = source.split("\n").map((rawLine, index) => {
        const lineText = rawLine.split(";")[0].trim();

        if (!lineText) {
            editorLineMap.push(null);
            return `<div class="editor-gutter-line"><span class="gutter-line-number">${index + 1}</span><span class="gutter-instruction-number"></span></div>`;
        }

        const programIndex = programLineMap.get(index + 1);
        editorLineMap.push(programIndex === undefined ? null : programIndex);
        return `<div class="editor-gutter-line"><span class="gutter-line-number">${index + 1}</span><span class="gutter-instruction-number">${programIndex === undefined ? "" : String(programIndex)}</span></div>`;
    });

    editorGutter.innerHTML = gutterLines.join("");
    editorGutter.scrollTop = codeEditor.scrollTop;
}

/* ===== UI updates ===== */
function updateSpeedUI() {
    const targetSpeed = Number(speedSlider.value);
    updateSpeedText(targetSpeed);

    if (machine && machine.cpu.running) {
        machine.displayedSpeedHz = targetSpeed;
        machine.restart();
    }
}

function loadProgram() {
    const source = codeEditor.value;
    const assembly = Assembler.assembleWithDiagnostics(source);

    cpu.program = assembly.program;
    cpu.pc = 0;
    cpu.loaded = assembly.problems.length === 0;
    problems.set(assembly.problems.map(problem => ({
        ...problem,
        line: problem.line
    })));
    updateEditorGutter(source);
}

/* ===== Input Handling ===== */
document.getElementById("clock-toggle").onclick = () => {
    if (cpu.running) {
        machine.stop();
        return;
    }

    if (!cpu.loaded) {
        loadProgram();
    }

    if (problems.items.length > 0 || cpu.program.length === 0) {
        return;
    }

    machine.start();
};

document.getElementById("line-step").onclick = () => {
    if (cpu.program.length === 0) loadProgram();
    if (problems.items.length > 0) return;
    machine.tick();
};

document.getElementById("reset-program").onclick = () => {
    loadProgram();
    machine.reset();
    cpu.loaded = false;
    cpu.program = [];
};
codeEditor.addEventListener("input", () => {
    loadProgram();
});

codeEditor.addEventListener("scroll", () => {
    editorGutter.scrollTop = codeEditor.scrollTop;
});

speedSlider.addEventListener("input", updateSpeedUI);

/* ===== Initialization ===== */
function init() {
    updateSpeedUI();
    loadProgram();
    ui.render();
}

init();
