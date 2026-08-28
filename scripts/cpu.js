import Assembler from "./assembler.js";

export default class CPU {

    constructor(memory, problems) {

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

        this.problems = problems;

    }

    setFlags(result) {

        this.flags.Z = (result & 0xff) === 0 ? 1 : 0;

    }

    parseRegister(r) {

        if (typeof r !== "string" || !r.startsWith("r")) throw new Error("Invalid register: " + r);

        return Number(r.slice(1));

    }

    parseRegisters(args, requiredCount, opName) {

        if (args.length !== requiredCount) {
            throw new Error(`${opName} requires ${requiredCount} operands`);
        }

        return args.map(arg => this.parseRegister(arg));

    }

    getMemoryAddress(baseRegister, offsetValue = 0) {

        return (this.registers[baseRegister] + Assembler.parseImmediate(offsetValue)) & 0xff;

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
            this.problems.add("error", err.message, instruction.line);
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

        const [rA, rB] = this.parseRegisters(args.slice(0, 2), 2, "LOD");
        const offset = args.length === 3 ? Assembler.parseImmediate(args[2]) : 0;
        const addr = this.getMemoryAddress(rA, offset);

        this.writeRegister(rB, this.memory.read(addr));
    }

    executeSTR(args) {

        const [rA, rB] = this.parseRegisters(args.slice(0, 2), 2, "STR");
        const offset = args.length === 3 ? Assembler.parseImmediate(args[2]) : 0;
        const addr = this.getMemoryAddress(rA, offset);

        this.memory.write(addr, this.registers[rB]);
    }

    execute({ op, args }) {

        const fn = this.instructions[op];

        if (!fn) throw new Error(`Unknown opcode: "${op}"`);

        fn(args);

    }

}