import { formatBinaryRows } from "./utils.js";
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
        const topText = addr !== null ? addr.toString(2).padStart(10, "0").toUpperCase() : "----------";

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
            const bin = formatBinaryRows(v);
            this.regCells[i].binTop.textContent = bin.top;
            this.regCells[i].binBottom.textContent = bin.bottom;
        }
    }

    updateMemory(force = false) {
        for (let i = 0; i < 256; i++) {
            const v = this.memory.data[i];
            if (!force && this.lastMemory[i] === v) continue;
            this.lastMemory[i] = v;

            this.memCells[i].dec.textContent = v;
            const bin = formatBinaryRows(v);
            this.memCells[i].binTop.textContent = bin.top;
            this.memCells[i].binBottom.textContent = bin.bottom;
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

class DocumentationManager {

    constructor(modal, documentation) {

        this.modal = modal;
        this.documentation = documentation;

    }

    open(page) {

        if (!this.documentation[page]) return;

        this.modal.open(
            this.documentation[page].title,
            this.documentation[page].render()
        );

    }

}

class SettingsManager {

    constructor(modal) {

        this.modal = modal;

        this.storageKey = "batpu-settings";

        this.themes = {
            default: "Default",
            light: "Light",
            machine: "Machine",
            nord: "Nord",
        };

        this.settings = {
            theme: this.loadTheme()
        };

        this.applyTheme();

    }

    loadTheme() {

        const saved =
            localStorage.getItem(this.storageKey);

        if (!saved) {
            return "default";
        }

        try {

            const settings = JSON.parse(saved);

            if (this.themes[settings.theme]) {
                return settings.theme;
            }

        } catch {
            // Ignore invalid settings
        }

        return "default";

    }

    save() {

        localStorage.setItem(
            this.storageKey,
            JSON.stringify(this.settings)
        );

    }

    applyTheme() {

        document.documentElement.dataset.theme =
            this.settings.theme;

    }

    setTheme(theme) {

        if (!this.themes[theme]) return;

        this.settings.theme = theme;

        this.applyTheme();
        this.save();

    }

    open() {

        this.modal.open(
            "Settings",
            this.render()
        );

        this.bindEvents();

    }

    render() {

        return `

            <div class="doc-page">

                <div class="doc-header">
                    <h1>Settings</h1>
                    <p>Manage emulator appearance and theme preferences.</p>
                </div>

                <div class="doc-card">
                    <div class="doc-card-header">
                        <h2>Appearance</h2>
                    </div>

                    <div class="doc-section settings-section">
                        <div class="settings-meta">
                            <div class="settings-label">Theme</div>
                            <div class="settings-description">
                                Choose the appearance of the emulator.
                            </div>
                        </div>

                        <select id="theme-select" class="settings-select">
                            ${Object.entries(this.themes)
                .map(([value, name]) => `
                                    <option
                                        value="${value}"
                                        ${value === this.settings.theme
                        ? "selected"
                        : ""}
                                    >
                                        ${name}
                                    </option>
                                `)
                .join("")}
                        </select>
                    </div>
                </div>

            </div>

        `;

    }

    bindEvents() {

        const themeSelect =
            document.getElementById("theme-select");

        themeSelect.addEventListener(
            "change",
            () => this.setTheme(themeSelect.value)
        );

    }

}

export { UI, ProblemsPanel, Modal, DocumentationManager, SettingsManager };