import {
    formatBinaryRows,
    formatHex
} from "./utils.js";
import { CharacterDevice, NumberDevice } from "./devices.js";

class UI {

    constructor(cpu, memory, screenDevice, textDisplay, numDisplay) {

        this.cpu = cpu;
        this.memory = memory;
        this.screenDevice = screenDevice;
        this.textDisplay = textDisplay;
        this.numDisplay = numDisplay;

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
        this.displayMode = "binary";

        this.cacheElements();
        this.createPixels();
        this.createRegisterCells();
        this.createMemoryCells();

    }

    cacheElements() {

        this.cpuStatusText = document.getElementById("cpu-status-text");
        this.pcText = document.querySelector("#cpu-status-bar div:nth-child(2)");
        this.zeroFlag = document.getElementById("flag-zero");
        this.carryFlag = document.getElementById("flag-carry");
        this.regDisplay = document.getElementById("reg-file-display");
        this.memoryDisplay = document.getElementById("data-memory-display");
        this.stackSize = document.getElementById("stack-size");
        this.stackTop = document.getElementById("stack-top");
        this.pixelGrid = document.getElementById("pixel-grid");

    }

    createPixels() {

        for (let y = 31; y >= 0; y--) {
            for (let x = 0; x < 32; x++) {
                const pixel = document.createElement("div");
                pixel.className = "pixel";
                this.pixelGrid.appendChild(pixel);
            }
        }

    }

    createRegisterCells() {

        this.regCells = {};
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
            this.regDisplay.appendChild(cell);
            this.regCells[i] = {
                dec: cell.querySelector(".reg-dec"),
                binTop: cell.querySelector(".bin-top"),
                binBottom: cell.querySelector(".bin-bottom"),
            };
        }

    }

    createMemoryCells() {

        this.memCells = [];
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
            this.memoryDisplay.appendChild(cell);
            this.memCells.push({
                dec: cell.querySelector(".mem-dec"),
                binTop: cell.querySelector(".bin-top"),
                binBottom: cell.querySelector(".bin-bottom"),
            });
        }

    }

    setDisplayMode(mode) {
        this.displayMode = ["binary", "hex"].includes(mode) ? mode : "binary";
        this.render(true);
    }

    formatDisplayValue(value) {
        if (this.displayMode === "hex") {
            const hex = formatHex(value);
            return { top: hex, bottom: "" };
        }

        return formatBinaryRows(value);
    }

    setStatus(running) {

        if (this.lastStatus === running) return;
        this.lastStatus = running;

        this.cpuStatusText.textContent = running ? "RUNNING" : "HALTED";
        this.cpuStatusText.classList.toggle(
            "status-running", running
        );

    }

    updateFlags(force = false) {

        if (force || this.lastFlags.Z !== this.cpu.flags.Z) {
            this.zeroFlag.querySelector(".flag-value").textContent = this.cpu.flags.Z;
            this.zeroFlag.classList.toggle("active", this.cpu.flags.Z === 1);
            this.lastFlags.Z = this.cpu.flags.Z;
        }

        if (force || this.lastFlags.C !== this.cpu.flags.C) {
            this.carryFlag.querySelector(".flag-value").textContent = this.cpu.flags.C;
            this.carryFlag.classList.toggle("active", this.cpu.flags.C === 1);
            this.lastFlags.C = this.cpu.flags.C;
        }

    }

    updateStack(force = false) {

        const size = this.cpu.stack.length;
        const addr = size > 0 ? this.cpu.stack[size - 1] : null;
        const placeholder = this.displayMode === "hex" ? "---" : "----------";
        const topText = addr !== null
            ? (this.displayMode === "hex"
                ? formatHex(addr)
                : addr.toString(2).padStart(8, "0").toUpperCase())
            : placeholder;

        if (force || this.lastStackSize !== size) {
            this.stackSize.querySelector(".stack-value").textContent = size;
            this.lastStackSize = size;
        }

        if (force || this.lastStackTop !== topText) {
            this.stackTop.querySelector(".stack-value").textContent = topText;
            this.lastStackTop = topText;
        }
    }

    updateRegisters(force = false) {
        for (let i = 1; i < 16; i++) {
            const v = this.cpu.registers[i];
            if (!force && this.lastRegisters[i] === v) continue;
            this.lastRegisters[i] = v;

            this.regCells[i].dec.textContent = v;
            const display = this.formatDisplayValue(v);
            this.regCells[i].binTop.textContent = display.top;
            this.regCells[i].binBottom.textContent = display.bottom;
        }
    }

    updateMemory(force = false) {
        for (let i = 0; i < 256; i++) {
            const v = this.memory.data[i];
            if (!force && this.lastMemory[i] === v) continue;
            this.lastMemory[i] = v;

            this.memCells[i].dec.textContent = v;
            const display = this.formatDisplayValue(v);
            this.memCells[i].binTop.textContent = display.top;
            this.memCells[i].binBottom.textContent = display.bottom;
        }
    }

    updatePixels(force = false) {
        const pixels = this.screenDevice ? this.screenDevice.frontBuffer : null;

        for (let i = 0; i < 32 * 32; i++) {
            const row = Math.floor(i / 32);
            const col = i % 32;
            const sourceIndex = (31 - row) * 32 + col;
            const v = pixels ? pixels[sourceIndex] : 0;
            if (!force && this.pixelState[i] === v) continue;
            this.pixelState[i] = v;
            this.pixelGrid.children[i].classList.toggle("active", !!v);
        }
    }

    updateDisplays(force = false) {
        const charsDevice = this.memory.devices.find(d => d instanceof CharacterDevice);
        const numDevice = this.memory.devices.find(d => d instanceof NumberDevice);

        const textValue = charsDevice ? charsDevice.front : "";
        if (force || this.textDisplayValue !== textValue) {
            this.textDisplayValue = textValue;
            this.textDisplay.textContent = textValue;
        }

        const numberValue = numDevice && numDevice.showNumber
            ? (numDevice.numberMode === "signed" && (numDevice.displayNumber & 0x80)
                ? numDevice.displayNumber - 256
                : numDevice.displayNumber).toString()
            : "";

        if (force || this.numDisplayValue !== numberValue) {
            this.numDisplayValue = numberValue;
            this.numDisplay.textContent = numberValue;
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
            this.pcText.textContent = pcText;
        }

    }

}

class MobileUI {

    constructor(settings = null) {

        this.settings = settings;
        this.app = document.getElementById("app");
        this.mobileNav = document.getElementById("mobile-nav");
        this.mobilePanelButtons = [...document.querySelectorAll(".mobile-nav-panel-button")];
        this.mobileProblemsButton = document.getElementById("mobile-problems-button");
        this.workspacePanels = [...document.querySelectorAll("#workspace .panel")];

        this.init();

    }

    updateLayoutState() {

        if (!this.app) return;

        const navOpen = !!this.mobileNav && this.mobileNav.classList.contains("open");
        const problemsPanel = document.getElementById("bottom-panel");
        const problemsOpen = !!problemsPanel && problemsPanel.classList.contains("open");

        this.app.classList.toggle("mobile-sheet-open", navOpen || problemsOpen);
        this.app.classList.toggle("mobile-problems-open", problemsOpen);

    }

    updateProblemsButtonVisibility() {

        if (!this.mobileProblemsButton) return;

        const isMobile = window.innerWidth <= 920;
        const editorIsActive = document.getElementById("right")?.classList.contains("active");

        this.mobileProblemsButton.style.display = isMobile && editorIsActive ? "inline-flex" : "none";

    }

    setActivePanel(panelId) {

        this.workspacePanels.forEach(panel => {
            panel.classList.toggle("active", panel.id === panelId);
        });

        this.mobilePanelButtons.forEach(button => {
            button.classList.toggle("active", button.dataset.panel === panelId);
        });

        this.updateProblemsButtonVisibility();

    }

    toggleNav(forceOpen) {

        if (!this.mobileNav) return;

        const shouldOpen = typeof forceOpen === "boolean"
            ? forceOpen
            : !this.mobileNav.classList.contains("open");

        this.mobileNav.classList.toggle("open", shouldOpen);
        this.mobileNav.classList.toggle("closed", !shouldOpen);

        const navHandle = document.getElementById("mobile-nav-handle");
        if (navHandle) {
            navHandle.setAttribute("aria-expanded", String(shouldOpen));
        }

        this.updateLayoutState();

    }

    init() {

        if (!this.mobileNav) return;

        document.addEventListener("mobile-open-panel", (e) => {
            const panelId = e?.detail?.panel;
            if (panelId && window.innerWidth <= 920) {
                this.setActivePanel(panelId);
            }
        });

        const defaultPanel = this.settings?.get("defaultMobilePanel") || "center";
        this.setActivePanel(window.matchMedia("(max-width: 920px)").matches ? defaultPanel : "left");

        this.settings?.subscribe(() => {
            if (window.matchMedia("(max-width: 920px)").matches) {
                this.setActivePanel(this.settings.get("defaultMobilePanel"));
            }
        });
        window.addEventListener("resize", () => {
            this.updateProblemsButtonVisibility();
            this.updateLayoutState();
        });

        document.getElementById("mobile-nav-handle").addEventListener("click", () => this.toggleNav());

        this.mobilePanelButtons.forEach(button => {
            button.addEventListener("click", () => {
                this.setActivePanel(button.dataset.panel);
                this.toggleNav(true);
            });
        });

        document.querySelectorAll(".mobile-nav-action-button").forEach(button => {
            button.addEventListener("click", () => {
                const target = document.getElementById(`${button.dataset.action}-button`);
                target?.click();
            });
        });

        this.mobileProblemsButton?.addEventListener("click", () => {
            document.getElementById("problems-toggle")?.click();
        });

        document.addEventListener("mobile-layout-update", () => this.updateLayoutState());
        this.updateLayoutState();

    }

}

class ProblemsPanel {

    constructor(element) {

        this.panel = document.getElementById("bottom-panel");
        this.element = element;
        this.toggle = document.getElementById("problems-toggle");
        this.items = [];

        this.initToggle();

    }

    open() {

        this.panel.classList.add("open");
        document.dispatchEvent(new Event("mobile-layout-update"));

        if (window.innerWidth <= 920) {
            document.dispatchEvent(new CustomEvent("mobile-open-panel", { detail: { panel: "right" } }));
        }

    }

    close() {

        this.panel.classList.remove("open");
        document.dispatchEvent(new Event("mobile-layout-update"));

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

    initToggle() {

        this.toggle.addEventListener("click", () => {
            this.panel.classList.toggle("open");
            document.dispatchEvent(new Event("mobile-layout-update"));
        });

    }

    render() {

        this.toggle.textContent = `Problems (${this.items.length})`;
        this.toggle.classList.toggle("has-problems", this.items.length > 0);

        if (this.items.length === 0) {

            this.element.innerHTML =
                "<div>No problems.</div>";

            this.close();
            return;

        }

        this.open();

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

    constructor(prefix = "modal") {

        this.overlay =
            document.getElementById(`${prefix}-overlay`);

        this.title =
            document.getElementById(`${prefix}-title`);

        this.body =
            document.getElementById(`${prefix}-body`);

        this.closeButton =
            document.getElementById(`${prefix}-close`);

        this.lastFocusedElement = null;
        this.keydownHandler = (event) => {
            if (event.key === "Escape") this.close();
        };

        this.closeButton.onclick = () => this.close();

        this.overlay.onclick = e => {

            if (e.target === this.overlay)
                this.close();

        };

    }

    focusFirstElement() {

        const focusable = this.overlay.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusable.length > 0) {
            focusable[0].focus();
            return;
        }

        this.body.focus();

    }

    open(title, html) {

        this.lastFocusedElement = document.activeElement;
        this.title.textContent = title;
        this.body.innerHTML = html;
        this.overlay.classList.remove("hidden");
        this.overlay.setAttribute("aria-hidden", "false");
        document.addEventListener("keydown", this.keydownHandler);
        this.focusFirstElement();

    }

    close() {

        if (this.overlay.classList.contains("hidden")) return;

        this.overlay.classList.add("hidden");
        this.overlay.setAttribute("aria-hidden", "true");
        document.removeEventListener("keydown", this.keydownHandler);

        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === "function") {
            this.lastFocusedElement.focus();
        }

    }

}

class DiagramModal extends Modal {

    constructor(DiagramComponents) {
        super("diagram-modal");
        this.components = [
            { id: "instr-memory", label: "Instruction\nMemory", color: "#ff00ff", textColor: "#333333", x: 150, y: 0, width: 200, height: 200 },
            { id: "alu", label: "ALU", color: "#ff8800", textColor: "#333333", x: 600, y: 25, width: 75, height: 150 },
            { id: "registers", label: "Register File", color: "#00ffff", textColor: "#333333", x: 400, y: 25, width: 150, height: 150 },
            { id: "program-counter", label: "Program\nCounter", color: "#ffff00", textColor: "#333333", x: 0, y: 125, width: 100, height: 75 },
            { id: "data-memory", label: "Data\nMemory", color: "#ff0000", textColor: "#333333", x: 725, y: 0, width: 100, height: 200 },
            { id: "stack", label: "Call Stack", color: "#00ff00", textColor: "#333333", x: 0, y: 0, width: 100, height: 100 },
            { id: "control", label: "Control ROM", color: "#0000ff", textColor: "#cccccc", x: 275, y: 250, width: 300, height: 100 },
            { id: "clock", label: "Clock", color: "#8f8f8f", textColor: "#333333", x: 625, y: 250, width: 100, height: 100 },
        ];
        this.componentDescriptions = DiagramComponents;
        this.muxes = [
            // Starts at (x, y), extends down for length
            { x: 575, y: 130, length: 30 },
            { x: 385, y: 100, length: 30 },
            { x: 385, y: 135, length: 30 },
        ];
        this.connections = [
            // (x[0], y[0]) -> (x[1], y[1]) -> (x[2], y[2]) ...
            { x: [550, 600], y: [62, 62] },
            { x: [550, 575], y: [138, 138] },
            { x: [575, 600], y: [145, 145] },
            { x: [675, 725], y: [100, 100] },
            { x: [675, 700, 700, 370, 370, 385], y: [100, 100, 195, 195, 163, 163] },
            { x: [550, 555, 555, 725], y: [138, 138, 182, 182] },
            { x: [350, 370, 370, 400], y: [75, 75, 50, 50] },
            { x: [350, 400], y: [75, 75] },
            { x: [350, 370, 370, 385], y: [75, 75, 102, 102] },
            { x: [350, 370, 370, 385], y: [75, 75, 115, 115] },
            { x: [350, 370, 370, 385], y: [75, 75, 128, 128] },
            { x: [385, 400], y: [115, 115] },
            { x: [350, 370, 370, 385], y: [75, 75, 137, 137] },
            { x: [385, 400], y: [150, 150] },
            { x: [825, 835, 835, 365, 365, 385], y: [100, 100, 205, 205, 150, 150] },
        ];
        this.resizeObserver = null;
        this.selectedComponent = null;
        this.canvas = null;
        this.context = null;
        this.detailsTitle = null;
        this.detailsText = null;
        this.componentButtons = [];
    }

    openDiagram() {
        this._disconnectDiagram();
        this.selectedComponent = null;
        super.open("CPU Diagram", this._renderDiagram());
        this._initializeDiagram();
    }

    close() {
        this._disconnectDiagram();
        super.close();
    }

    _renderDiagram() {
        return `
            <div class="doc-page cpu-diagram-page">
                <div class="doc-header">
                    <h1>CPU Diagram</h1>
                    <p>Explore the CPU components. Work in progress.</p>
                </div>

                <div class="cpu-diagram-layout">
                    <div class="doc-card diagram-container">
                        <canvas
                            id="cpu-diagram-canvas"
                            role="img"
                            aria-label="Interactive CPU diagram. Select a component to view its information."
                        ></canvas>
                        <div class="cpu-diagram-component-list" role="group" aria-label="CPU components">
                            ${this.components.map(component => `
                                <button
                                    type="button"
                                    class="cpu-diagram-component-button"
                                    data-diagram-component="${component.id}"
                                    aria-pressed="false"
                                >${component.label}</button>
                            `).join("")}
                        </div>
                    </div>

                    <section class="doc-card cpu-diagram-details" aria-live="polite">
                        <h2 id="cpu-diagram-details-title">Select a component</h2>
                        <p id="cpu-diagram-details-text">
                            Click a block in the diagram or choose a component button to learn more.
                        </p>
                    </section>
                </div>
            </div>
        `;
    }

    _initializeDiagram() {
        this.canvas = this.body.querySelector("#cpu-diagram-canvas");
        this.context = this.canvas.getContext("2d");
        this.detailsTitle = this.body.querySelector("#cpu-diagram-details-title");
        this.detailsText = this.body.querySelector("#cpu-diagram-details-text");
        this.componentButtons = [...this.body.querySelectorAll("[data-diagram-component]")];

        this.canvas.addEventListener("click", event => {
            const bounds = this.canvas.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width) * 850;
            const y = ((event.clientY - bounds.top) / bounds.height) * 450;
            const component = [...this.components].reverse().find(item =>
                x >= item.x && x <= item.x + item.width &&
                y >= item.y && y <= item.y + item.height
            );

            if (component) this._selectComponent(component.id);
        });

        this.componentButtons.forEach(button => {
            button.addEventListener("click", () => {
                this._selectComponent(button.dataset.diagramComponent);
            });
        });

        this.resizeObserver = new ResizeObserver(() => this._drawDiagram());
        this.resizeObserver.observe(this.canvas);
        this._drawDiagram();
    }

    _drawDiagram() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        if (!width || !height) return;

        const pixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(width * pixelRatio);
        this.canvas.height = Math.round(height * pixelRatio);
        this.context.setTransform(
            (width / 850) * pixelRatio,
            0,
            0,
            (height / 450) * pixelRatio,
            0,
            0
        );

        const styles = getComputedStyle(document.documentElement);
        const textColor = styles.getPropertyValue("--text").trim() || "#e8e8e8";
        const mutedColor = styles.getPropertyValue("--muted").trim() || "#a0a0a0";
        const accentColor = styles.getPropertyValue("--accent-blue").trim() || "#00bbff";
        const borderColor = styles.getPropertyValue("--border").trim() || "#59616b";

        this.context.clearRect(0, 0, 850, 450);
        this.context.lineWidth = 3;
        this.context.beginPath();
        for (const connection of this.connections) {
            this.context.strokeStyle = connection.color || mutedColor;
            const pointCount = Math.min(connection.x.length, connection.y.length);
            if (pointCount === 0) continue;

            this.context.moveTo(connection.x[0], connection.y[0]);
            for (let i = 1; i < pointCount; i++) {
                this.context.lineTo(connection.x[i], connection.y[i]);
            }
        }
        this.context.stroke();

        for (const connection of this.connections) {
            this.context.fillStyle = connection.color || mutedColor;
            const pointCount = Math.min(connection.x.length, connection.y.length);
            if (pointCount < 2) continue;

            const tip = {
                x: connection.x[pointCount - 1],
                y: connection.y[pointCount - 1]
            };
            let previousIndex = pointCount - 2;

            while (
                previousIndex >= 0 &&
                connection.x[previousIndex] === tip.x &&
                connection.y[previousIndex] === tip.y
            ) {
                previousIndex--;
            }

            if (previousIndex < 0) continue;

            this.context.fillStyle = connection.color || mutedColor;
            const angle = Math.atan2(
                tip.y - connection.y[previousIndex],
                tip.x - connection.x[previousIndex]
            );
            const arrowLength = 12;
            const arrowWidth = 7;

            this.context.beginPath();
            this.context.moveTo(tip.x, tip.y);
            this.context.lineTo(
                tip.x - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
                tip.y - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
            );
            this.context.lineTo(
                tip.x - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
                tip.y - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
            );
            this.context.closePath();
            this.context.fill();
        }

        for (const component of this.components) {
            this.context.fillStyle = component.color || "#20252b";
            this.context.fillRect(component.x, component.y, component.width, component.height);
        }

        this.context.strokeStyle = "#0073ff";
        this.context.lineWidth = 3;
        this.context.beginPath();
        for (const mux of this.muxes) {
            if (!Number.isFinite(mux.x) || !Number.isFinite(mux.y) ||
                !Number.isFinite(mux.length) || mux.length <= 0) {
                continue;
            }

            this.context.moveTo(mux.x, mux.y);
            this.context.lineTo(mux.x, mux.y + mux.length);
        }
        this.context.stroke();

        for (const component of this.components) {
            const isSelected = component.id === this.selectedComponent;
            this.context.strokeStyle = isSelected ? accentColor : borderColor;
            this.context.lineWidth = isSelected ? 5 : 2;
            this.context.strokeRect(component.x, component.y, component.width, component.height);
            this.context.fillStyle = component.textColor || textColor;
            this.context.font = "bold 20px sans-serif";
            this.context.textAlign = "center";
            this.context.textBaseline = "middle";
            const labelLines = component.label.split("\n");
            const lineHeight = 24;
            const firstLineY = component.y + component.height / 2 -
                ((labelLines.length - 1) * lineHeight) / 2;

            labelLines.forEach((line, index) => {
                this.context.fillText(
                    line,
                    component.x + component.width / 2,
                    firstLineY + index * lineHeight,
                    component.width - 20
                );
            });
        }
    }

    _selectComponent(id) {
        const component = this.components.find(item => item.id === id);
        if (!component) return;

        this.selectedComponent = id;
        this.detailsTitle.textContent = component.label;
        this.detailsText.textContent =
            this.componentDescriptions[id]
            || "Component information will be added when the final CPU diagram and descriptions are defined.";
        this.componentButtons.forEach(button => {
            button.setAttribute(
                "aria-pressed",
                String(button.dataset.diagramComponent === id)
            );
        });
        this._drawDiagram();
    }

    _disconnectDiagram() {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

}

export { UI, MobileUI, ProblemsPanel, Modal, DiagramModal };
