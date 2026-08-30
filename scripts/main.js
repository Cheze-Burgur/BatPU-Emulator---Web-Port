import CPU from "./cpu.js";
import Assembler from "./assembler.js";
import Memory from "./memory.js";
import SaveManager from "./saveManager.js";

import {
    ScreenDevice,
    CharacterDevice,
    NumberDevice,
    RandomNumberDevice,
    ControllerDevice
} from "./devices.js";

import {
    UI,
    ProblemsPanel,
    Modal,
    DocumentationManager,
    SettingsManager
} from "./ui.js";

import Documentation, { Presets } from "./docs.js";

import {
    updateEditorGutter,
    updateSpeedText
} from "./utils.js";

class Machine {

    constructor(cpu, memory, ui) {

        this.cpu = cpu;
        this.memory = memory;
        this.ui = ui;

        this.interval = null;
        this.animationFrameId = null;
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
            updateSpeedText(this.measuredSpeedHz, speedValue);
        }

    }

    start() {

        if (this.cpu.running) return;

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

    }

}

const pixelGrid = document.getElementById("pixel-grid");
const textDisplayElement = document.getElementById("text-display");
const numDisplayElement = document.getElementById("num-display");
const speedSlider = document.getElementById("program-speed-slider");
const speedValue = document.getElementById("speed-value");
const editorGutter = document.getElementById("editor-gutter");
const codeEditor = document.getElementById("code-editor");
const editorLineMap = [];

const mobileNav = document.getElementById("mobile-nav");
const mobilePanelButtons = [...document.querySelectorAll(".mobile-nav-panel-button")];
const mobileProblemsButton = document.getElementById("mobile-problems-button");
const workspacePanels = [...document.querySelectorAll("#workspace .panel")];

function updateMobileProblemsButtonVisibility() {
    if (!mobileProblemsButton) return;

    const isMobile = window.innerWidth <= 920;
    const editorIsActive = document.getElementById("right")?.classList.contains("active");

    mobileProblemsButton.style.display = isMobile && editorIsActive ? "inline-flex" : "none";
}

function setActivePanel(panelId) {
    workspacePanels.forEach(panel => {
        panel.classList.toggle("active", panel.id === panelId);
    });

    mobilePanelButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.panel === panelId);
    });

    updateMobileProblemsButtonVisibility();
}

function toggleMobileNav(forceOpen) {
    if (!mobileNav) return;

    const shouldOpen = typeof forceOpen === "boolean"
        ? forceOpen
        : !mobileNav.classList.contains("open");

    mobileNav.classList.toggle("open", shouldOpen);
    mobileNav.classList.toggle("closed", !shouldOpen);
}

const isMobileViewport = () => window.matchMedia("(max-width: 920px)").matches;

if (mobileNav) {
    setActivePanel(isMobileViewport() ? "center" : "left");
    window.addEventListener("resize", updateMobileProblemsButtonVisibility);
    document.getElementById("mobile-nav-handle").addEventListener("click", () => toggleMobileNav());

    mobilePanelButtons.forEach(button => {
        button.addEventListener("click", () => {
            setActivePanel(button.dataset.panel);
            toggleMobileNav(true);
        });
    });

    document.querySelectorAll(".mobile-nav-action-button").forEach(button => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;

            switch (action) {
                case "isa":
                    document.getElementById("isa-button").click();
                    break;
                case "io":
                    document.getElementById("io-button").click();
                    break;
                case "help":
                    document.getElementById("help-button").click();
                    break;
                case "presets":
                    document.getElementById("presets-button").click();
                    break;
                case "about":
                    document.getElementById("about-button").click();
                    break;
                case "changelog":
                    document.getElementById("changelog-button").click();
                    break;
                case "settings":
                    document.getElementById("settings-button").click();
                    break;
                case "project-repo":
                    document.getElementById("project-repo-button").click();
                    break;
                default:
                    break;
            }
        });
    });
}

if (mobileProblemsButton) {
    mobileProblemsButton.addEventListener("click", () => {
        document.getElementById("problems-toggle").click();
    });
}

const problems = new ProblemsPanel(document.getElementById("problems-list"));
const modal = new Modal();
const docs = new DocumentationManager(modal, Documentation);
const settings = new SettingsManager(modal);
const memory = new Memory();
const cpu = new CPU(memory, problems);
const screen = new ScreenDevice(memory, pixelGrid);
const charsDisplay = new CharacterDevice(memory, textDisplayElement);
const numDisplay = new NumberDevice(memory, numDisplayElement);
const randNum = new RandomNumberDevice(memory);
const ui = new UI(cpu, memory, screen, textDisplayElement, numDisplayElement);
const controller = new ControllerDevice(memory);

const machine = new Machine(cpu, memory, ui);
const saveManager = new SaveManager(codeEditor, problems, cpu, machine, loadProgram);

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
    updateEditorGutter(source, codeEditor, editorGutter, editorLineMap, Assembler);
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
    updateEditorGutter(codeEditor.value, codeEditor, editorGutter, editorLineMap, Assembler);
    modal.close();
}

window.loadPreset = loadPreset;

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

document.getElementById("settings-button").addEventListener(
    "click", () => settings.open()
);

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
    machine.tick();
    ui.render(true);
};

document.getElementById("reset-program").onclick = () => {
    loadProgram();
    resetRuntimeState();
};

codeEditor.addEventListener("input", loadProgram);
codeEditor.addEventListener("scroll", () => {
    editorGutter.scrollTop = codeEditor.scrollTop;
});

speedSlider.addEventListener("input", () => {
    const targetSpeed = Number(speedSlider.value);
    updateSpeedText(targetSpeed, speedValue);

    if (machine.cpu.running) {
        machine.measuredSpeedHz = targetSpeed;
        machine.restart();
    }
});

updateSpeedText(Number(speedSlider.value), speedValue);
loadProgram();
ui.render(true);