const bottomPanel =
    document.getElementById("bottom-panel");

document
    .getElementById("problems-toggle")
    .onclick = () => {

        bottomPanel.classList.toggle("open");

    };

class ProblemsPanel {

    constructor(element) {

        this.element = element;

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

    render() {

        if (this.items.length === 0) {

            this.element.innerHTML =
                "<div>No problems.</div>";

            return;

        }

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

const problems =
    new ProblemsPanel(
        document.getElementById("problems-list")
    );
const modal = new Modal;

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

const isaButton = document.getElementById("isa-button");
const ioButton = document.getElementById("io-button");
const helpButton = document.getElementById("help-button");
const aboutButton = document.getElementById("about-button");

isaButton.onclick =
    () => docs.open("isa");

ioButton.onclick =
    () => docs.open("io");

helpButton.onclick =
    () => docs.open("help");

aboutButton.onclick =
    () => docs.open("about");

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
                const example = data.example || "N/A";

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

                <div class="doc-section">
                    <h3>Flags</h3>
                    <div class="doc-tags">
            `;

                if (flags.length) {
                    flags.forEach(flag => {
                        html += `
                    <span class="doc-tag">${flag}</span>
                `;
                    });
                } else {
                    html += `
                    <span class="doc-tag">None</span>
                `;
                }

                html += `
                    </div>
                </div>

                <div class="doc-section">
                    <h3>Example</h3>
                    <pre class="doc-code">${example}</pre>
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

    io: {

        title: "I/O Devices",

        render() {

            let html = `
        <div class="doc-page">

            <p class="doc-intro">
                The Input/Output devices are memory-mapped to the last 16 registers in the Data Memory. Writing or reading from these addresses controls each device.
            </p>
    `;

            for (const device of Object.values(Devices)) {

                html += `
            <div class="doc-card">

                <h2>${device.title}</h2>
        `;

                if (device.description) {

                    html += `
                <p>${device.description}</p>
            `;

                }

                html += `
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

                    html += `
                <tr>

                    <td>${addr}</td>

<td>
    <span class="io-access ${entry.access.toLowerCase().replace("/", "-")}">
        ${entry.access}
    </span>

    ${entry.description}
</td>

                </tr>
            `;

                }

                html += `
                    </tbody>

                </table>

            </div>
        `;

            }

            html += "</div>";

            return html;

        }

    },

    help: {
        title: "Help Guide",

        render() {

            return `
...
`;

        }
    },

    about: {
        title: "About",

        render() {

            return `
...
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

        example: "CAL 256"

    },

    RET: {

        category: "Branching and Subroutines",

        syntax: "RET",

        operands: [],

        description:
            "Pops the last address from the stack and jumps to that address.",

        example: `JMP 256
RET`

    },

    LOD: {

        category: "Memory Manipulation",

        syntax: "LOD rA rB offset",

        operands: [
            ["rA", "Pointer Register"],
            ["rB", "Destination Register"],
            ["offset", "Pointer Offset"]
        ],

        description:
            "Loads from the data memory.",

        example: "LOD r1 r2 3"

    },

    STR: {

        category: "Memory Manipulation",

        syntax: "STR rA rB offset",

        operands: [
            ["rA", "Pointer Register"],
            ["rB", "Data Register"],
            ["offset", "Pointer Offset"]
        ],

        description:
            "Stores a value to the data memory.",

        example: "STR r1 r2 3"

    },

};

const Devices = {

    screen: {

        title: "Pixel Display",

        description: "A 32x32 grid, where each pixel has two states, On or Off.",

        addresses: {

            240: {
                access: "W",
                description: "X coordinate"
            },

            241: {
                access: "W",
                description: "Y coordinate"
            },

            242: {
                access: "W",
                description: "Draw pixel"
            },

            243: {
                access: "W",
                description: "Clear pixel"
            },

            244: {
                access: "R",
                description: "Read pixel state"
            },

            245: {
                access: "W",
                description: "Flush buffer to front"
            },

            246: {
                access: "W",
                description: "Clear buffer"
            }

        }

    },

    chars: {

        title: "Character Display",

        description: "A character display that can show up to 10 characters from a specialized charset.",

        addresses: {

            247: {
                access: "W",
                description: "Write character to buffer"
            },

            248: {
                access: "W",
                description: "Flush buffer to front"
            },

            249: {
                access: "W",
                description: "Clear buffer"
            },

        }

    },

    num: {

        title: "Number Display",

        description: "An 8-Bit number display that can interpret the value it is displaying as either unsigned or as signed two's complement.",

        addresses: {

            250: {
                access: "W",
                description: "Display number"
            },

            251: {
                access: "W",
                description: "Clear display"
            },

            252: {
                access: "W",
                description: "Switch display to signed mode"
            },

            253: {
                access: "W",
                description: "Switch display to unsigned mode"
            },

        }

    },

    randnum: {

        title: "Random Number Generator",

        description: "A RNG that can generate a random 8-Bit number.",

        addresses: {

            254: {
                access: "R",
                description: "Random Number"
            }

        }

    },

    controller: {

        title: "Controller",

        description: "A controller with 8 buttons used for taking user input, with each button corresponding to one bit of data.",

        addresses: {

            255: {
                access: "R",
                description: "Controller state"
            }

        }

    }

};

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

    }

    tick() {

        this.memory.tick();
        this.cpu.step();
        this.ui.render();

    }

    start() {

        if (this.interval) return;
        this.cpu.running = true;
        const loop = () => {
            if (!this.cpu.running) return;
            this.tick();
            this.interval = setTimeout(loop, getSpeedDelay());
        }
        loop();

    }

    stop() {

        this.cpu.running = false;
        clearTimeout(this.interval);
        this.interval = null;

    }

    reset() {

        this.stop();
        this.cpu.pc = 0;
        this.cpu.flags.Z = 0;
        this.cpu.flags.C = 0;
        this.cpu.registers.fill(0);
        this.memory.reset();
        this.ui.render();

    }

}

/* ===== Assembler and Instruction Classes ===== */
class Assembler {

    static assemble(source) {
        return source
            .split("\n")
            .map(line => line.split(";")[0].trim())
            .filter(Boolean)
            .map(line => line.replace(/\s+/g, " "))
            .map(line => this.decodeInstruction(line));
    }

    static decodeInstruction(line) {

        const parts = line.split(" ");
        return new Instruction(parts[0].toUpperCase(), parts.slice(1));

    }

    static parseImmediate(str) {

        if (typeof str !== "string") return str;

        if (str.startsWith("0b")) return parseInt(str.slice(2), 2);
        if (str.startsWith("0x")) return parseInt(str.slice(2), 16);

        return Number(str);

    }

}

class Instruction {

    constructor(op, args) {

        this.op = op;
        this.args = args;

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

        this.execute(
            this.program[this.pc++]
        );

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

        for (const device of this.devices) {
            if (device.owns(addr)) {
                device.write(addr, value);
                return;
            }
        }

        this.data[addr] = value;

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
            const v = this.memory.read(i);
            memCells[i].dec.textContent = v;
            const bin = formatBinaryRows(v);
            memCells[i].binTop.textContent = bin.top;
            memCells[i].binBottom.textContent = bin.bottom;
        }

    }

    render() {

        this.setStatus(this.cpu.running);

        this.updateFlags();
        this.updateRegisters();
        this.updateMemory();

        document.querySelector(
            "#cpu-status-bar div:nth-child(2)"
        ).textContent =
            `PC: ${String(this.cpu.pc).padStart(4, "0")}`;

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
        this.frontBuffer.fill(0);

        for (const px of this.pixelGrid.children) {
            px.classList.remove("active");
        }
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

    }

    bindButton(id, key) {

        const btn = document.getElementById(id);

        const press = () => this.liveState[key] = 1;
        const release = () => this.liveState[key] = 0;

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

                case "ArrowUp": this.liveState.up = 1; break;
                case "ArrowDown": this.liveState.down = 1; break;
                case "ArrowLeft": this.liveState.left = 1; break;
                case "ArrowRight": this.liveState.right = 1; break;

                case "KeyZ": this.liveState.a = 1; break;
                case "KeyX": this.liveState.b = 1; break;

            }

        });

        window.addEventListener("keyup", e => {

            switch (e.code) {

                case "ArrowUp": this.liveState.up = 0; break;
                case "ArrowDown": this.liveState.down = 0; break;
                case "ArrowLeft": this.liveState.left = 0; break;
                case "ArrowRight": this.liveState.right = 0; break;

                case "KeyZ": this.liveState.a = 0; break;
                case "KeyX": this.liveState.b = 0; break;

            }

        });

        window.addEventListener("blur", () => {

            Object.keys(this.liveState).forEach(key => {
                this.liveState[key] = 0;
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
const getSpeedDelay = () => Math.max(1, Math.floor(1000 / Number(speedSlider.value)));

/* ===== UI updates ===== */
function updateSpeedUI() {
    speedValue.textContent = speedSlider.value + " Hz";
}

function loadProgram() {
    cpu.program = Assembler.assemble(document.getElementById("code-editor").value);
    cpu.pc = 0;
    cpu.loaded = true;
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

    machine.start();
};

document.getElementById("line-step").onclick = () => {
    if (cpu.program.length === 0) loadProgram();
    machine.tick();
};

document.getElementById("reset-program").onclick = () => {
    loadProgram();
    machine.reset();
    cpu.loaded = false;
    cpu.program = [];
};

speedSlider.addEventListener("input", updateSpeedUI);

/* ===== Initialization ===== */
function init() {
    updateSpeedUI();
    ui.render();
}

init();
