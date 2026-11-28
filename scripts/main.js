import CPU from "./cpu.js";
import Assembler from "./assembler.js";
import Memory from "./memory.js";
import SaveManager from "./saveManager.js";
import SettingsManager from "./settingsManager.js";

import {
    ScreenDevice,
    CharacterDevice,
    NumberDevice,
    RandomNumberDevice,
    ControllerDevice
} from "./devices.js";

import {
    UI,
    MobileUI,
    ProblemsPanel,
    Modal,
    DiagramModal
} from "./ui.js";

import { DocumentationManager, Documentation, DiagramComponents, Presets } from "./docs.js";

import {
    matchesKeyBinding,
    updateEditorGutter,
    highlightAssembly,
    escapeHtml,
    updateSpeedText,
    showToast,
} from "./utils.js";

class Machine {

    constructor(cpu, memory, ui, breakpoints) {

        this.cpu = cpu;
        this.memory = memory;
        this.ui = ui;
        this.breakpoints = breakpoints;
        this.breakpointPaused = false;
        this.skipBreakpointOnce = false;

        this.interval = null;
        this.animationFrameId = null;
        this.lastStepTime = 0;
        this.lastSpeedSampleTime = performance.now();
        this.ticksSinceLastSpeedSample = 0;
        this.measuredSpeedHz = Number(speedSlider.value);
        this.intervalMode = "timer";
        this.accumulator = 0;

        this.history = [];
        this.historyLimit = 5000;
        this.stepBackButton = document.getElementById("step-back");

    }

    tick(ignoreBreakpoint = false) {

        const instruction = this.cpu.program[this.cpu.pc];
        if (
            !ignoreBreakpoint &&
            !this.skipBreakpointOnce &&
            instruction &&
            this.breakpoints.has(instruction.line)
        ) {
            this.breakpointPaused = true;
            this.stop();
            return false;
        }

        this.skipBreakpointOnce = false;
        this.breakpointPaused = false;

        this.recordHistory();
        this.memory.tick();
        this.cpu.step();

        this.ticksSinceLastSpeedSample++;

    }

    captureState() {

        return {
            pc: this.cpu.pc,
            flags: { ...this.cpu.flags },
            registers: this.cpu.registers.slice(),
            memory: this.memory.data.slice(),
            stack: [...this.cpu.stack],
            lastExecutedLine: this.cpu.lastExecutedLine,
            devices: this.memory.devices.map(device => device.snapshot()),
            problems: this.cpu.problems.items.map(problem => ({ ...problem }))
        };

    }

    restoreState(state) {

        this.cpu.pc = state.pc;
        this.cpu.flags = { ...state.flags };
        this.cpu.registers = state.registers.slice();
        this.memory.data = state.memory.slice();
        this.cpu.stack = [...state.stack];
        this.cpu.lastExecutedLine = state.lastExecutedLine;
        this.memory.devices.forEach((device, index) => {
            if (state.devices[index]) {
                device.restore(state.devices[index]);
            }
        });
        this.cpu.problems.items = state.problems.map(problem => ({ ...problem }));

        this.cpu.running = false;
        this.breakpointPaused = false;
        this.skipBreakpointOnce = false;
        this.accumulator = 0;
        this.cpu.problems.set(state.problems);
        this.ui.render(true);

    }

    recordHistory() {
        this.history.push(this.captureState());

        if (this.history.length > this.historyLimit) {
            this.history.shift();
        }

        this.stepBackButton.disabled = this.history.length === 0;
    }

    clearHistory() {
        this.history = [];
        this.stepBackButton.disabled = true;
    }

    stepBack() {

        if (this.history.length === 0) return;

        this.stop();
        const previousState = this.history.pop();
        this.restoreState(previousState);
        this.stepBackButton.disabled = this.history.length === 0;
        applyEditorHighlighting();

    }

    updateSpeedDisplay() {

        const now = performance.now();
        const elapsed = now - this.lastSpeedSampleTime;

        if (elapsed >= 250) {
            const measuredHz = Math.max(1, Math.round((this.ticksSinceLastSpeedSample / elapsed) * 1000));
            this.measuredSpeedHz = measuredHz;
            this.ticksSinceLastSpeedSample = 0;
            this.lastSpeedSampleTime = now;
            updateSpeedText(this.measuredSpeedHz, speedValue);
        }

    }

    start() {

        if (this.cpu.running) return;

        if (this.breakpointPaused) {
            this.skipBreakpointOnce = true;
            this.breakpointPaused = false;
        }

        this.cpu.running = true;

        this.accumulator = 0;
        this.lastFrame = performance.now();

        const loop = (now) => {

            if (!this.cpu.running) {
                this.animationFrameId = null;
                return;
            }

            const elapsed = now - this.lastFrame;
            this.lastFrame = now;

            const targetHz = Number(speedSlider.value);

            this.accumulator += elapsed * targetHz / 1000;

            while (this.accumulator >= 1 && this.cpu.running) {
                this.tick();
                this.accumulator--;
            }

            applyEditorHighlighting();
            this.ui.render();
            this.updateSpeedDisplay();

            this.animationFrameId = requestAnimationFrame(loop);
        };

        this.animationFrameId = requestAnimationFrame(loop);

    }

    stop() {

        this.cpu.running = false;

        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        updateSpeedText(Number(speedSlider.value), speedValue);
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
        this.breakpointPaused = false;
        this.skipBreakpointOnce = false;
        this.clearHistory();

    }

}

const pixelGrid = document.getElementById("pixel-grid");
const textDisplayElement = document.getElementById("text-display");
const numDisplayElement = document.getElementById("num-display");
const speedSlider = document.getElementById("program-speed-slider");
let speedValue = document.getElementById("speed-value");
const editorGutter = document.getElementById("editor-gutter");
const editorHighlight = document.getElementById("editor-highlight");
const codeEditor = document.getElementById("code-editor");
const editorLineMap = [];
const breakpoints = new Set();

const problems = new ProblemsPanel(
    document.getElementById("problems-list"),
    item => focusEditorLine(item.line)
);

const modal = new Modal();
const settings = new SettingsManager(modal);
const diagramModal = new DiagramModal(DiagramComponents, settings);
const docs = new DocumentationManager(modal, Documentation, diagramModal);
const memory = new Memory();
const cpu = new CPU(memory, problems);
const screen = new ScreenDevice(memory, pixelGrid);
const charsDisplay = new CharacterDevice(memory, textDisplayElement);
const numDisplay = new NumberDevice(memory, numDisplayElement);
const randNum = new RandomNumberDevice(memory, settings);
const ui = new UI(cpu, memory, screen, textDisplayElement, numDisplayElement);
const mobileUI = new MobileUI(settings);
const controller = new ControllerDevice(memory, null, settings);

const machine = new Machine(cpu, memory, ui, breakpoints);
const saveManager = new SaveManager(codeEditor, problems, cpu, machine, loadProgram, settings);

function applyEditorHighlighting() {
    const executedLine = cpu.lastExecutedLine;
    const syntaxHighlighting = settings.get("syntaxHighlighting");
    const highlightCurrentLine = settings.get("highlightCurrentLine");

    editorHighlight.innerHTML = codeEditor.value.split("\n").map((line, index) => {
        const content = syntaxHighlighting
            ? highlightAssembly(line).replace(/\n$/, "")
            : escapeHtml(line);
        const currentClass = highlightCurrentLine && index + 1 === executedLine
            ? " editor-highlight-line-current"
            : "";
        return `<span class="editor-highlight-line${currentClass}">${content}</span>`;
    }).join("");

    editorGutter.classList.toggle("hide-line-numbers", !settings.get("showLineNumbers"));
}

function loadProgram() {
    const source = codeEditor.value;
    const assembly = Assembler.assembleWithDiagnostics(source);

    cpu.program = assembly.program;
    cpu.pc = 0;
    cpu.lastExecutedLine = null;
    cpu.loaded = !assembly.problems.some(problem => problem.type === "error");
    problems.set(assembly.problems.map(problem => ({
        ...problem,
        line: problem.line
    })));
    updateEditorGutter(source, codeEditor, editorGutter, editorLineMap, Assembler, breakpoints);
    applyEditorHighlighting();
    editorHighlight.scrollTop = codeEditor.scrollTop;
    editorHighlight.scrollLeft = codeEditor.scrollLeft;
    machine.clearHistory();
    ui.render(true);
}

function resetRuntimeState() {
    machine.reset();
    cpu.loaded = false;
    cpu.program = [];
    ui.render(true);
}

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
    resetRuntimeState();
    updateEditorGutter(codeEditor.value, codeEditor, editorGutter, editorLineMap, Assembler, breakpoints);
    modal.close();
}

window.loadPreset = loadPreset;

function focusEditorLine(line) {
    if (!Number.isInteger(line) || line < 1) return;

    const lines = codeEditor.value.split("\n");
    const lineIndex = line - 1;
    if (lineIndex >= lines.length) return;

    const start = lines
        .slice(0, lineIndex)
        .reduce((offset, sourceLine) => offset + sourceLine.length + 1, 0);
    const end = start + lines[lineIndex].length;

    if (window.innerWidth <= 920) {
        document.dispatchEvent(
            new CustomEvent("mobile-open-panel", { detail: { panel: "right" } })
        );
    }

    codeEditor.focus();
    codeEditor.setSelectionRange(start, end);
}

const docButtons = {
    isa: document.getElementById("isa-button"),
    io: document.getElementById("io-button"),
    diagram: document.getElementById("diagram-button"),
    help: document.getElementById("help-button"),
    presets: document.getElementById("presets-button"),
    about: document.getElementById("about-button"),
    changelog: document.getElementById("changelog-button")
};

Object.entries(docButtons).forEach(([page, button]) => {
    button.addEventListener("click", () => docs.open(page));
});

document.getElementById("settings-button").addEventListener(
    "click", () => settings.open()
);

document.addEventListener("settings-updated", () => {
    ui.setDisplayMode(settings.get("registerMemoryFormat"));
    applyEditorHighlighting();
});

document.getElementById("project-repo-button").onclick = () => {
    window.open("https://github.com/Cheze-Burgur/BatPU-Emulator---Web-Port", "_blank");
};

document.getElementById("clock-toggle").onclick = () => {
    if (cpu.running) {
        machine.stop();
        return;
    }

    if (!cpu.loaded) loadProgram();
    if (problems.items.length > 0 || cpu.program.length === 0) return;
    machine.start();
};

document.getElementById("line-step").onclick = () => {
    if (cpu.program.length === 0) loadProgram();
    if (problems.items.length > 0) return;
    machine.tick(true);
    applyEditorHighlighting();
    ui.render(true);
};

document.getElementById("step-back").addEventListener("click", () => machine.stepBack());

async function resetProgram() {

    if (settings.get("confirmReset")) {
        const result = await Swal.fire({
            title: "Reset CPU?",
            text: "This will clear the current CPU state.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Reset",
            cancelButtonText: "Cancel",
            buttonsStyling: false,
            allowOutsideClick: false
        });

        if (!result.isConfirmed) return;
    }

    loadProgram();
    resetRuntimeState();

}

document.getElementById("reset-program").onclick = resetProgram;

window.addEventListener("beforeunload", event => {

    if (!settings.get("confirmReset")) return;

    event.preventDefault();

});

window.addEventListener("keydown", event => {

    if (event.target?.classList?.contains("cell-value-editor")) return;

    const keybindings = settings.get("keybindings");

    if (matchesKeyBinding(event, keybindings.closeModal)) {
        modal.close();
        return;
    }

    if (matchesKeyBinding(event, keybindings.run)) {
        event.preventDefault();
        document.getElementById("clock-toggle").click();
        return;
    }

    if (matchesKeyBinding(event, keybindings.step)) {
        event.preventDefault();
        document.getElementById("line-step").click();
    }

    if (matchesKeyBinding(event, keybindings.reset)) {
        event.preventDefault();
        resetProgram();
    }

    if (matchesKeyBinding(event, keybindings.saveProgram)) {
        event.preventDefault();
        saveManager.openSaveMenu();
    }

    if (matchesKeyBinding(event, keybindings.loadProgram)) {
        event.preventDefault();
        saveManager.openLoadMenu();
    }
});

codeEditor.addEventListener("input", loadProgram);
codeEditor.addEventListener("scroll", () => {
    editorGutter.scrollTop = codeEditor.scrollTop;
    editorHighlight.scrollTop = codeEditor.scrollTop;
    editorHighlight.scrollLeft = codeEditor.scrollLeft;
});

editorGutter.addEventListener("click", event => {
    const button = event.target.closest(".breakpoint-toggle");
    if (!button || button.disabled) return;

    const lineNumber = Number(button.dataset.line);
    if (breakpoints.has(lineNumber)) breakpoints.delete(lineNumber);
    else breakpoints.add(lineNumber);

    button.setAttribute("aria-pressed", String(breakpoints.has(lineNumber)));
})

function updateSpeedDisplay(value) {
    if (speedValue instanceof HTMLInputElement) {
        speedValue.value = String(value);
    } else {
        updateSpeedText(value, speedValue);
    }
}

function editSpeedValue() {
    if (speedValue instanceof HTMLInputElement) return;

    const input = document.createElement("input");
    input.id = "speed-value-input";
    input.type = "number";
    input.min = speedSlider.min;
    input.max = speedSlider.max;
    input.step = speedSlider.step;
    input.required = true;
    input.value = speedSlider.value;
    input.setAttribute("aria-label", "Execution rate in hertz");
    input.setAttribute("aria-invalid", "false");
    input.title = `Enter a whole number from ${speedSlider.min} to ${speedSlider.max} Hz`;

    speedValue.replaceWith(input);
    speedValue = input;

    let canceled = false;
    let invalidSpeedToastShown = false;
    const getValidSpeed = () => {
        const targetSpeed = input.valueAsNumber;
        const isValid = input.validity.valid && Number.isInteger(targetSpeed);
        input.setAttribute("aria-invalid", String(!isValid));

        if (!isValid) {
            if (!invalidSpeedToastShown) {
                showToast(
                    `Enter a whole number from ${speedSlider.min} to ${speedSlider.max} Hz.`,
                    "error"
                );
                invalidSpeedToastShown = true;
            }
            return null;
        }

        invalidSpeedToastShown = false;
        return targetSpeed;
    };

    input.addEventListener("input", () => {
        invalidSpeedToastShown = false;
        const isValid = input.validity.valid && Number.isInteger(input.valueAsNumber);
        input.setAttribute("aria-invalid", String(!isValid));
    });

    input.addEventListener("blur", () => {
        if (speedValue !== input) return;

        const targetSpeed = canceled ? null : getValidSpeed();
        if (targetSpeed !== null) {
            speedSlider.value = String(targetSpeed);
            speedSlider.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const display = document.createElement("span");
        display.id = "speed-value";
        display.setAttribute("role", "button");
        display.tabIndex = 0;
        display.setAttribute("aria-label", "Set execution rate");
        input.replaceWith(display);
        speedValue = display;
        updateSpeedDisplay(Number(speedSlider.value));
    }, { once: true });

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            if (getValidSpeed() !== null) input.blur();
        } else if (event.key === "Escape") {
            event.preventDefault();
            canceled = true;
            input.blur();
        }
    });

    input.focus();
}

document.getElementById("speed-header").addEventListener("click", event => {
    if (event.target.id === "speed-value") {
        editSpeedValue();
    }
});

document.getElementById("speed-header").addEventListener("keydown", event => {
    if (event.target.id === "speed-value" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        editSpeedValue();
    }
});

speedSlider.addEventListener("input", () => {
    const targetSpeed = Number(speedSlider.value);
    updateSpeedDisplay(targetSpeed);

    if (machine.cpu.running) {
        machine.measuredSpeedHz = targetSpeed;
        machine.restart();
    }
});

let activeCellEditor = null;

function editCellValue(valueElement, currentValue, writeValue) {
    if (activeCellEditor) return;
    if (cpu.running) machine.stop();

    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "e.g. 0x2A";
    input.value = String(currentValue);
    input.className = "cell-value-editor";
    input.setAttribute("aria-label", valueElement.getAttribute("aria-label") || "Edit value");
    input.setAttribute("aria-invalid", "false");
    document.body.appendChild(input);

    activeCellEditor = input;

    const positionEditor = () => {
        const rect = valueElement.getBoundingClientRect();
        const left = Math.min(
            Math.max(8, rect.left + (rect.width - input.offsetWidth) / 2),
            window.innerWidth - input.offsetWidth - 8
        );
        const top = Math.min(
            Math.max(8, rect.top + (rect.height - input.offsetHeight) / 2),
            window.innerHeight - input.offsetHeight - 8
        );
        input.style.left = `${left}px`;
        input.style.top = `${top}px`;
    };

    const resizeEditor = () => {
        const width = Math.min(12, Math.max(7, input.value.length + 2));
        input.style.width = `${width}ch`;
        positionEditor();
    };

    const parseCellValue = () => {
        const normalizedValue = input.value.trim().replace(
            /^0([bBxX])/,
            (_, radix) => `0${radix.toLowerCase()}`
        );
        return Assembler.parseImmediate(normalizedValue);
    };
    const isValidCellValue = value =>
        Number.isInteger(value) && value >= 0 && value <= 255;

    resizeEditor();
    window.addEventListener("scroll", positionEditor, true);
    window.addEventListener("resize", positionEditor);
    input.addEventListener("input", () => {
        resizeEditor();
        input.setAttribute("aria-invalid", String(!isValidCellValue(parseCellValue())));
    });
    input.focus();
    input.select();

    let finished = false;
    const finish = commit => {
        if (finished) return;

        let value;
        if (commit) {
            value = parseCellValue();
            if (!isValidCellValue(value)) {
                input.setAttribute("aria-invalid", "true");
                showToast("Enter a value from 0 to 255 in decimal, 0x hex, or 0b binary", "error");
                input.focus();
                input.select();
                return;
            }

            input.setAttribute("aria-invalid", "false");
        }

        finished = true;
        input.remove();
        activeCellEditor = null;
        window.removeEventListener("scroll", positionEditor, true);
        window.removeEventListener("resize", positionEditor);

        if (commit) {
            writeValue(value);
            machine.clearHistory();
        }

        ui.render(true);
    };

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            finish(true);
        } else if (event.key === "Escape") {
            event.preventDefault();
            finish(false);
        }
    });

    input.addEventListener("blur", () => finish(true));
}

document.querySelectorAll(".reg-dec").forEach(cell => {
    cell.addEventListener("click", () => {
        if (activeCellEditor) return;

        const regIndex = Number(cell.closest(".reg-cell").dataset.register);
        editCellValue(cell, machine.cpu.registers[regIndex], value => {
            machine.cpu.writeRegister(regIndex, value);
        });
    });
});

document.querySelectorAll(".mem-dec").forEach(cell => {
    cell.addEventListener("click", () => {
        if (activeCellEditor) return;

        const address = Number(cell.closest(".mem-cell").dataset.address);
        if (address >= 254) return;

        editCellValue(cell, machine.memory.data[address], value => {
            machine.memory.write(address, value);
        });
    });
});

updateSpeedDisplay(Number(speedSlider.value));
ui.setDisplayMode(settings.get("registerMemoryFormat"));
loadProgram();
ui.render(true);
