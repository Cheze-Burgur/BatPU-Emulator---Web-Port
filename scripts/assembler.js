export default class Assembler {

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

        const addRangeProblem = (label, value, min, max) => {
            const parsed = this.parseImmediate(value);
            if (parsed < min || parsed > max) {
                problems.push({
                    type: "error",
                    message: `${label} must be between ${min} and ${max}`,
                    line
                });
            }
        };

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

                addRangeProblem(`${op} immediate value`, args[1], 0, 255);
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

                addRangeProblem(`${op} address`, args[0], 0, 1023);
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

                addRangeProblem("BRH address", args[1], 0, 1023);
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

                if (args.length === 3) {
                    addRangeProblem(`${op} offset`, args[2], -8, 7);
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

    static OPCODES = Object.freeze({
        NOP: 0,
        HLT: 1,

        ADD: 2,
        SUB: 3,
        NOR: 4,
        AND: 5,
        XOR: 6,
        RSH: 7,

        LDI: 8,
        ADI: 9,

        JMP: 10,
        BRH: 11,
        CAL: 12,
        RET: 13,

        LOD: 14,
        STR: 15
    });

    static BRANCH_CONDITIONS = Object.freeze({
        "0": 0,
        "Z": 0,

        "!0": 1,
        "!Z": 1,

        "C": 2,

        "!C": 3
    });

    static encodeInstruction(instruction) {

        const { op, args } = instruction;

        const opcode = this.OPCODES[op];

        if (opcode === undefined) {
            throw new Error(`Cannot encode unknown opcode "${op}"`);
        }

        const register = value => Number(value.slice(1));
        const immediate = value => this.parseImmediate(value);

        let machineCode = opcode << 12;

        switch (op) {

            // No operands
            case "NOP":
            case "HLT":
            case "RET":
                break;


            // 3 Registers
            case "ADD":
            case "SUB":
            case "NOR":
            case "AND":
            case "XOR": {

                const rA = register(args[0]);
                const rB = register(args[1]);
                const rC = register(args[2]);

                machineCode |=
                    (rA << 8) |
                    (rB << 4) |
                    rC;

                break;
            }


            // 2 Registers
            case "RSH": {

                const rA = register(args[0]);
                const rC = register(args[1]);

                machineCode |=
                    (rA << 8) |
                    rC;

                break;
            }


            // Register and Immediate
            case "LDI":
            case "ADI": {

                const rA = register(args[0]);
                const value = immediate(args[1]);

                machineCode |=
                    (rA << 8) |
                    (value & 0xff);

                break;
            }


            // PC Address
            case "JMP":
            case "CAL": {

                const address = immediate(args[0]);

                machineCode |= address & 0x3ff;

                break;
            }


            // Condition and PC Address
            case "BRH": {

                const condition =
                    this.BRANCH_CONDITIONS[args[0].toUpperCase()];

                const address = immediate(args[1]);

                if (condition === undefined) {
                    throw new Error(
                        `Cannot encode invalid branch condition "${args[0]}"`
                    );
                }

                machineCode |=
                    (condition << 10) |
                    (address & 0x3ff);

                break;
            }


            // 2 Registers and Signed Offset
            case "LOD":
            case "STR": {

                const rA = register(args[0]);
                const rB = register(args[1]);

                const offset =
                    args.length === 3
                        ? immediate(args[2])
                        : 0;

                machineCode |=
                    (rA << 8) |
                    (rB << 4) |
                    (offset & 0x0f);

                break;
            }


            default:
                throw new Error(
                    `No machine-code encoder exists for "${op}"`
                );

        }

        return machineCode;
    }

    static encodeProgram(program) {

        return program.map(instruction => {

            const machineCode =
                this.encodeInstruction(instruction);

            return machineCode
                .toString(2)
                .padStart(16, "0");

        });

    }

    static decodeMachineCode(machineCode) {

        const opcode =
            (machineCode >> 12) & 0x0f;

        const rA =
            (machineCode >> 8) & 0x0f;

        const rB =
            (machineCode >> 4) & 0x0f;

        const rC =
            machineCode & 0x0f;

        const immediate =
            machineCode & 0xff;

        const address =
            machineCode & 0x3ff;

        const condition =
            (machineCode >> 10) & 0x03;

        const opcodeEntry =
            Object.entries(this.OPCODES)
                .find(([, value]) => value === opcode);

        if (!opcodeEntry) {

            throw new Error(
                `Unknown opcode: ${opcode}`
            );

        }

        const op =
            opcodeEntry[0];

        switch (op) {

            case "NOP":
            case "HLT":
            case "RET":

                return op;


            case "ADD":
            case "SUB":
            case "NOR":
            case "AND":
            case "XOR":

                return `${op} r${rA} r${rB} r${rC}`;


            case "RSH":

                return `${op} r${rA} r${rC}`;


            case "LDI":
            case "ADI":

                return `${op} r${rA} ${immediate}`;


            case "JMP":
            case "CAL":

                return `${op} ${address}`;


            case "BRH": {

                const conditions = [
                    "Z",
                    "!Z",
                    "C",
                    "!C"
                ];

                return `BRH ${conditions[condition]} ${address}`;

            }


            case "LOD":
            case "STR": {

                let offset =
                    machineCode & 0x0f;

                // Convert 4-bit two's complement
                // back into a signed integer.
                if (offset >= 8) {
                    offset -= 16;
                }

                if (offset === 0) {

                    return `${op} r${rA} r${rB}`;

                }

                return `${op} r${rA} r${rB} ${offset}`;

            }


            default:

                throw new Error(
                    `Cannot decode opcode "${op}"`
                );

        }

    }

    static decodeProgram(machineCodeLines) {

        return machineCodeLines.map(line => {

            const machineCode =
                parseInt(line, 2);

            return this.decodeMachineCode(machineCode);

        });

    }

}

class Instruction {

    constructor(op, args, line = null) {

        this.op = op;
        this.args = args;
        this.line = line;

    }

}