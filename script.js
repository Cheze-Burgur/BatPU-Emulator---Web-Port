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

    loadProgram();
    machine.reset();
    cpu.loaded = false;
    cpu.program = [];

    updateEditorGutter();

    modal.close();

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
        this.measuredSpeedHz = Number(speedSlider.value);
        this.intervalMode = "timer";
        this.accumulator = 0;

    }

    tick() {

        this.memory.tick();
        this.cpu.step();

        this.ticksSinceLastSpeedSample++;

    }

    updateSpeedDisplay() {

        const now = performance.now();
        const elapsed = now - this.lastSpeedSampleTime;

        if (elapsed >= 250) {
            const measuredHz = Math.max(1, Math.round((this.ticksSinceLastSpeedSample / elapsed) * 1000));
            this.measuredSpeedHz = measuredHz;
            this.ticksSinceLastSpeedSample = 0;
            this.lastSpeedSampleTime = now;
            updateSpeedText(this.measuredSpeedHz);
        }

    }

    start() {

        if (this.cpu.running) return;

        this.cpu.running = true;

        this.accumulator = 0;
        this.lastFrame = performance.now();

        const loop = (now) => {

            if (!this.cpu.running) return;

            const elapsed = now - this.lastFrame;
            this.lastFrame = now;

            const targetHz = Number(speedSlider.value);

            this.accumulator += elapsed * targetHz / 1000;

            while (this.accumulator >= 1 && this.cpu.running) {
                this.tick();
                this.accumulator--;
            }

            this.ui.render();
            this.updateSpeedDisplay();

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);

    }

    stop() {

        this.cpu.running = false;
        updateSpeedText(Number(speedSlider.value));
        this.ui.render();

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
        this.ui.render(true);

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
                const lineText = rawLine.split(";")[0].trim().split("#")[0].trim().split("//")[0].trim();

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

        if (this.stack.length >= 16)
            throw new Error("Stack overflow");

        this.stack.push(this.pc);

        this.pc = Assembler.parseImmediate(args[0]);

    }

    executeRET(args) {

        if (this.stack.length === 0)
            throw new Error("Stack underflow");

        this.pc = this.stack.pop();

    }

    /* Memory Manipulation Instructions */
    executeLOD(args) {

        const rA = this.parseRegister(args[0]);

        let rB;
        let offset = 0;

        if (args.length === 2) {
            rB = this.parseRegister(args[1]);
        } else {
            rB = this.parseRegister(args[1]);
            offset = Assembler.parseImmediate(args[2]);
        }

        const addr = (this.registers[rA] + offset) & 0xff;

        this.writeRegister(rB, this.memory.read(addr));
    }

    executeSTR(args) {

        const rA = this.parseRegister(args[0]);

        let rB;
        let offset = 0;

        if (args.length === 2) {
            rB = this.parseRegister(args[1]);
        } else {
            rB = this.parseRegister(args[1]);
            offset = Assembler.parseImmediate(args[2]);
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
        this.lastStatus = null;
        this.lastPC = null;
        this.lastFlags = { Z: null, C: null };
        this.lastRegisters = new Uint8Array(16);
        this.lastMemory = new Uint8Array(256);
        this.lastStackSize = null;
        this.lastStackTop = null;
        this.textDisplayValue = "";
        this.numDisplayValue = "";
        this.pixelState = new Uint8Array(32 * 32);

    }

    setStatus(running) {

        if (this.lastStatus === running) return;
        this.lastStatus = running;

        cpuStatusText.textContent = running ? "RUNNING" : "HALTED";
        cpuStatusText.classList.toggle(
            "status-running", running
        );

    }

    updateFlags(force = false) {

        const zeroFlag = document.getElementById("flag-zero");
        const carryFlag = document.getElementById("flag-carry");

        if (force || this.lastFlags.Z !== this.cpu.flags.Z) {
            zeroFlag.querySelector(".flag-value").textContent = this.cpu.flags.Z;
            zeroFlag.classList.toggle("active", this.cpu.flags.Z === 1);
            this.lastFlags.Z = this.cpu.flags.Z;
        }

        if (force || this.lastFlags.C !== this.cpu.flags.C) {
            carryFlag.querySelector(".flag-value").textContent = this.cpu.flags.C;
            carryFlag.classList.toggle("active", this.cpu.flags.C === 1);
            this.lastFlags.C = this.cpu.flags.C;
        }

    }

    updateStack(force = false) {
        const stackSize = document.getElementById("stack-size");
        const stackTop = document.getElementById("stack-top");

        const size = this.cpu.stack.length;
        const addr = size > 0 ? this.cpu.stack[size - 1] : null;
        const topText = addr !== null ? addr.toString(2).padStart(10, "0").toUpperCase() : "----------";

        if (force || this.lastStackSize !== size) {
            stackSize.querySelector(".stack-value").textContent = size;
            this.lastStackSize = size;
        }

        if (force || this.lastStackTop !== topText) {
            stackTop.querySelector(".stack-value").textContent = topText;
            this.lastStackTop = topText;
        }
    }

    updateRegisters(force = false) {
        for (let i = 1; i < 16; i++) {
            const v = this.cpu.registers[i];
            if (!force && this.lastRegisters[i] === v) continue;
            this.lastRegisters[i] = v;

            regCells[i].dec.textContent = v;
            const bin = formatBinaryRows(v);
            regCells[i].binTop.textContent = bin.top;
            regCells[i].binBottom.textContent = bin.bottom;
        }
    }

    updateMemory(force = false) {
        for (let i = 0; i < 256; i++) {
            const v = this.memory.data[i];
            if (!force && this.lastMemory[i] === v) continue;
            this.lastMemory[i] = v;

            memCells[i].dec.textContent = v;
            const bin = formatBinaryRows(v);
            memCells[i].binTop.textContent = bin.top;
            memCells[i].binBottom.textContent = bin.bottom;
        }
    }

    updatePixels(force = false) {
        const screenDevice = this.memory.devices.find(d => d instanceof ScreenDevice);
        const source = screenDevice ? screenDevice.frontBuffer : null;

        for (let i = 0; i < 32 * 32; i++) {
            const v = source ? source[i] : 0;
            if (!force && this.pixelState[i] === v) continue;
            this.pixelState[i] = v;
            pixelGrid.children[i].classList.toggle("active", !!v);
        }
    }

    updateDisplays(force = false) {
        const charsDevice = this.memory.devices.find(d => d instanceof CharacterDevice);
        const numDevice = this.memory.devices.find(d => d instanceof NumberDevice);

        const textValue = charsDevice ? charsDevice.front : "";
        if (force || this.textDisplayValue !== textValue) {
            this.textDisplayValue = textValue;
            textDisplay.textContent = textValue;
        }

        const numberValue = numDevice && numDevice.showNumber
            ? (numDevice.numberMode === "signed" && (numDevice.displayNumber & 0x80)
                ? numDevice.displayNumber - 256
                : numDevice.displayNumber).toString()
            : "";

        if (force || this.numDisplayValue !== numberValue) {
            this.numDisplayValue = numberValue;
            numDisplay.textContent = numberValue;
        }
    }

    render(force = false) {

        this.setStatus(this.cpu.running);

        this.updateFlags(force);
        this.updateStack(force);
        this.updateRegisters(force);
        this.updateMemory(force);
        this.updatePixels(force);
        this.updateDisplays(force);

        const pcText = this.cpu.pc !== 0
            ? `PC: ${String(this.cpu.pc - 1).padStart(4, "0")}`
            : `PC: ----`;

        if (force || this.lastPC !== pcText) {
            this.lastPC = pcText;
            document.querySelector(
                "#cpu-status-bar div:nth-child(2)"
            ).textContent = pcText;
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

        this.charSet = [' ', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '.', '!', '?'];

    }

    write(addr, value) {

        switch (addr) {
            case 247: this.writeChar(value); break;
            case 248: this.flushChars(); break;
            case 249: this.clearCharsBuffer(); break;
        }

    }

    valueToChar(val) {
        if (val < 0 || val > 29) return;

        return this.charSet[val];
    }

    writeChar(c) {

        if (this.buffer.length >= 10) return;

        const char = this.valueToChar(c);

        this.buffer.push(char);

    }

    flushChars() {

        this.front = this.buffer.join("");
        this.updateCharsDisplay();

    }

    clearCharsBuffer() {

        this.buffer = [];

    }

    updateCharsDisplay() {

        textDisplay.textContent = this.front;

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
        machine.measuredSpeedHz = targetSpeed;
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
    ui.render(true);
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
    ui.render(true);
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
    ui.render(true);
}

init();
