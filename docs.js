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
                            You can read from it like a normal register, but you cannot write to it. Any attempt to write to r0 will be ignored.
                            r0 will always contain and read as zero, which can be useful for certain operations, such as clearing a register or comparing values.
                        </p>
                    </div>
                    <div class="doc-section">
                        <h3>Branching and Subroutines</h3>
                        <p>
                            To allow the creation and execution of complex programs, the CPU has to be able to <strong>compare values and conditions</strong>, and <strong>create 
                            loops and reusable functions</strong>. The Arithmetic-Logic Unit (ALU) can already perform mathematical and logical operations on values, so the CPU just
                            has to be able to decide what to do depending on the result.
                        </p>
                        <p>
                            The <strong>JMP</strong> and <strong>BRH</strong> instructions allow you to do just that. The JMP instruction takes in one number from 0-1023 and sets
                            the address of the <strong>program counter</strong> to that value, effectively "jumping" over to that instruction. The BRH instruction functions similarly,
                            although it will only jump if a certain condition is met - this is called conditional branching. The conditions are based off properties of the last calculation
                            the ALU has made. These properties are called <strong>flags</strong>. There are two flags: <strong>Zero</strong>, and <strong>Carry</strong>. The Zero flag is true if
                            the result of the last calculation was equal to 0, while the Carry flag is true if the last calculation resulted in an overflow. These conditions can also be inverted,
                            bring the total number of conditions up to four: Zero, Not Zero, Carry, and Not Carry.
                        </p>
                        <p>
                            JMP and BRH take care of creating loops and comparing conditions, and <strong>CAL</strong> and <strong>RET</strong> take care of creating reusable functions, called
                            <strong>subroutines</strong>. The CAL instruction functions similarly to the JMP function, except it will <strong>push</strong> the instruction immediately after it to the <strong>Call Stack</strong>.
                            The RET instruction can then be used to <strong>pop</strong> that saved address and jump back to it. This means that if you have a block of instructions with a RET instruction at the end,
                            you can use CAL to jump to that block as many times as you want. You can even have a subroutine call another subroutine inside of it.
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
                `

                if (preset.imageName) {
                    html += `
                                <img src="https://raw.githubusercontent.com/Cheze-Burgur/BatPU-Emulator---Web-Port/refs/heads/main/images/${preset.imageName}.png">
                    `
                }

                html += `
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

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Version 1.31</h2>
                        <span class="doc-badge">BUGFIXING</span>
                    </div>
                    <div class="doc-section">
                        <h3>July 16, 2026</h3>
                        <ul>
                            <li>Implemented the character set for the Character Display</li>
                            <li>Made writing to the character display actually work</li>
                            <li>Added a new preset using the character display</li>
                            <li>Added a new section to the help page</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Version 1.4</h2>
                        <span class="doc-badge">BUGFIXING</span>
                        <span class="doc-badge">QUALITY OF LIFE</span>
                    </div>
                    <div class="doc-section">
                        <h3>July 16, 2026</h3>
                        <ul>
                            <li>Improved the way fast execution rates are handled, drastically increasing speed</li>
                            <li>Made UI only update registers, memory cells, flags, etc. that were updated in that tick</li>
                            <li>Made comments work with <span class="code">;</span>, <span class="code">//</span>, and <span class="code">#</span></li>
                            <li>Updated project README</li>
                        </ul>
                    </div>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Version 1.41</h2>
                        <span class="doc-badge">BUGFIXING</span>
                    </div>
                    <div class="doc-section">
                        <h3>July 16, 2026</h3>
                        <ul>
                            <li>Added handlers for stack over/underflow</li>
                            <li>Fixed the missalignment between the ISA and Assembler for the LOD and STR instructions.</li>
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

const Presets = {

    helloworld: {

        title: "Hello World!",

        author: "MattBatWings",

        description: 'Writes "HELLOWORLD" in the Character Display.',

        imageName: "helloworldimg",

        code: `; Hello World - By MattBatWings

; Clear character buffer
LDI r15 249
STR r15 r0

; Write "HELLOWORLD"
LDI r15 247

LDI r14 8
STR r15 r14
LDI r14 5
STR r15 r14
LDI r14 12
STR r15 r14
LDI r14 12
STR r15 r14
LDI r14 15
STR r15 r14
LDI r14 23
STR r15 r14
LDI r14 15
STR r15 r14
LDI r14 18
STR r15 r14
LDI r14 12
STR r15 r14
LDI r14 4
STR r15 r14

; Push character buffer
LDI r15 248
STR r15 r0

HLT
`

    },

    dvdlogo: {

        title: "DVD Logo",

        author: "zPippo",

        description: "Displays the clssic bouncing DVD logo on the pixel display.",

        imageName: "dvdlogoimg",

        code: `; DVD LOGO - By zPippo

ldi r15 249
str r15 r0
ldi r15 247
ldi r1 4
str r15 r1
ldi r1 22
str r15 r1
ldi r1 4
str r15 r1
ldi r1 0
str r15 r1
str r15 r1
str r15 r1
str r15 r1
str r15 r1
str r15 r1
str r15 r1
ldi r15 248
str r15 r0

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
cal 68 ; .draw_logo
str r15 r0
cal 90 ; .movement
cal 93 ; .collision

jmp 62 ; .loop


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
        brh Z 83; .skip_pixel
        add r6 r2 r6
        str r13 r6
        sub r6 r2 r6
        str r14 r0
        ; .skip_pixel
        rsh r7 r7

        add r6 r0 r6
        brh !Z 76; .next_pixel

    adi r8 1
    sub r8 r9 r0
    brh !Z 71; .next_byte

ret


; .movement
add r1 r3 r1
add r2 r4 r2
ret

; .collision
ldi r5 21
ldi r6 24
sub r1 r5 r0
brh Z 104; .invert_x
sub r1 r0 r0
brh Z 104; .invert_x
; .y_check
sub r2 r6 r0
brh Z 106; .invert_y
sub r2 r0 r0
brh Z 106; .invert_y
ret

; .invert_x
sub r0 r3 r3
jmp 99; .y_check

; .invert_y
sub r0 r4 r4
ret
`

    },

}
