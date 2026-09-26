import { keyBindingLabel, keyEventToBinding } from "./utils.js";

class SettingsManager {

    constructor(modal) {

        this.modal = modal;

        this.storageKey = "batpu-settings";

        this.themes = {
            default: "Default",
            light: "Light",
            "high-contrast": "High Contrast (Dark)",
            "high-contrast-light": "High Contrast (Light)",
            machine: "Machine",
            nord: "Nord",
        };

        this.defaults = {
            theme: "default",
            confirmReset: true,
            defaultMobilePanel: "center",
            autosaveInterval: 0,
            syntaxHighlighting: true,
            showLineNumbers: true,
            highlightCurrentLine: false,
            registerMemoryFormat: "binary",
            controllerDisplaysKeys: false,
            keybindings: {
                run: "Ctrl+Enter",
                step: "F10",
                reset: "Ctrl+R",
                saveProgram: "Ctrl+S",
                loadProgram: "Ctrl+O",
                closeModal: "Escape",
                controllerUp: "ArrowUp",
                controllerDown: "ArrowDown",
                controllerLeft: "ArrowLeft",
                controllerRight: "ArrowRight",
                controllerA: "KeyZ",
                controllerB: "KeyX",
                controllerOne: "Digit1",
                controllerTwo: "Digit2"
            }
        };

        this.listeners = new Set();
        this.settings = this.loadSettings();

        this.applyTheme();

    }

    loadSettings() {

        const saved =
            localStorage.getItem(this.storageKey);

        if (!saved) return structuredClone(this.defaults);

        try {

            const savedSettings = JSON.parse(saved);
            const settings = structuredClone(this.defaults);

            if (this.themes[savedSettings.theme]) {
                settings.theme = savedSettings.theme;
            }

            if (typeof savedSettings.confirmReset === "boolean") {
                settings.confirmReset = savedSettings.confirmReset;
            }

            if (["left", "center", "right"].includes(savedSettings.defaultMobilePanel)) {
                settings.defaultMobilePanel = savedSettings.defaultMobilePanel;
            }

            if ([0, 5, 15, 30, 60, 300].includes(savedSettings.autosaveInterval)) {
                settings.autosaveInterval = savedSettings.autosaveInterval;
            }

            if (typeof savedSettings.syntaxHighlighting === "boolean") {
                settings.syntaxHighlighting = savedSettings.syntaxHighlighting;
            }

            if (["binary", "hex"].includes(savedSettings.registerMemoryFormat)) {
                settings.registerMemoryFormat = savedSettings.registerMemoryFormat;
            }

            if (typeof savedSettings.showLineNumbers === "boolean") {
                settings.showLineNumbers = savedSettings.showLineNumbers;
            }

            if (typeof savedSettings.highlightCurrentLine === "boolean") {
                settings.highlightCurrentLine = savedSettings.highlightCurrentLine;
            }

            if (typeof savedSettings.controllerDisplaysKeys === "boolean") {
                settings.controllerDisplaysKeys = savedSettings.controllerDisplaysKeys;
            }

            if (savedSettings.keybindings && typeof savedSettings.keybindings === "object") {
                Object.keys(settings.keybindings).forEach(action => {
                    if (typeof savedSettings.keybindings[action] === "string") {
                        settings.keybindings[action] = savedSettings.keybindings[action];
                    }
                });
            }

            return settings;

        } catch {
            // Ignore invalid settings
        }

        return structuredClone(this.defaults);

    }

    get(name) {
        return this.settings[name];
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.settings));

    }

    save() {

        localStorage.setItem(
            this.storageKey,
            JSON.stringify(this.settings)
        );

        this.notify();

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

        const keybindingGroups = [
            {
                title: "Emulator",
                actions: [
                    ["run", "Run / pause"],
                    ["step", "Step instruction"],
                    ["reset", "Reset CPU"],
                    ["saveProgram", "Save program"],
                    ["loadProgram", "Load program"]
                ]
            },
            {
                title: "Menus",
                actions: [
                    ["closeModal", "Close modal"]
                ]
            },
            {
                title: "Controller",
                actions: [
                    ["controllerUp", "Up"],
                    ["controllerDown", "Down"],
                    ["controllerLeft", "Left"],
                    ["controllerRight", "Right"],
                    ["controllerA", "A"],
                    ["controllerB", "B"],
                    ["controllerOne", "1"],
                    ["controllerTwo", "2"]
                ]
            }
        ];

        const keybindingMarkup = keybindingGroups.map(group => `
			<div class="settings-shortcut-group">
				<div class="settings-label">${group.title}</div>
				${group.actions.map(([action, label]) => `
					<div class="settings-shortcut-row">
						<span>${label}</span>
						<button type="button" class="settings-shortcut" data-keybinding="${action}" aria-label="Change shortcut for ${label}">
							${keyBindingLabel(this.settings.keybindings[action])}
						</button>
					</div>
				`).join("")}
			</div>
		`).join("");

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
							<label class="settings-label" for="theme-select">Theme</label>
							<div class="settings-description">
								Choose the appearance of the emulator.
							</div>
						</div>

						<select id="theme-select" class="settings-select" aria-label="Theme">
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

				<div class="doc-card">
					<div class="doc-card-header">
						<h2>Behavior</h2>
					</div>

					<div class="doc-section settings-section">
						<div class="settings-meta">
							<label class="settings-label" for="confirm-reset">Confirm before reset</label>
							<div class="settings-description">Ask before clearing the current CPU state.</div>
						</div>
						<input id="confirm-reset" class="settings-checkbox" type="checkbox" ${this.settings.confirmReset ? "checked" : ""} aria-label="Confirm before reset">
					</div>

					<div class="doc-section settings-section">
						<div class="settings-meta">
							<label class="settings-label" for="default-mobile-panel">Default mobile panel</label>
							<div class="settings-description">Choose which workspace panel opens first on mobile.</div>
						</div>
						<select id="default-mobile-panel" class="settings-select" aria-label="Default mobile panel">
							<option value="left" ${this.settings.defaultMobilePanel === "left" ? "selected" : ""}>Input</option>
							<option value="center" ${this.settings.defaultMobilePanel === "center" ? "selected" : ""}>Control</option>
							<option value="right" ${this.settings.defaultMobilePanel === "right" ? "selected" : ""}>Editor</option>
						</select>
					</div>

					<div class="doc-section settings-section">
						<div class="settings-meta">
							<label class="settings-label" for="autosave-interval">Autosave interval</label>
							<div class="settings-description">Save the current program to LocalStorage automatically.</div>
						</div>
						<select id="autosave-interval" class="settings-select" aria-label="Autosave interval">
							${[[0, "Off"], [5, "Every 5 seconds"], [15, "Every 15 seconds"], [30, "Every 30 seconds"], [60, "Every minute"], [300, "Every 5 minutes"]].map(([value, label]) => `
								<option value="${value}" ${this.settings.autosaveInterval === value ? "selected" : ""}>${label}</option>
							`).join("")}
						</select>
					</div>

					<div class="doc-section settings-section">
						<div class="settings-meta">
							<label class="settings-label" for="syntax-highlighting">Syntax highlighting</label>
							<div class="settings-description">Highlight assembly keywords and registers in the editor.</div>
						</div>
						<input id="syntax-highlighting" class="settings-checkbox" type="checkbox" ${this.settings.syntaxHighlighting ? "checked" : ""} aria-label="Syntax highlighting">
					</div>

                    <div class="doc-section settings-section">
                        <div class="settings-meta">
                            <label class="settings-label" for="show-line-numbers">Show line numbers</label>
                            <div class="settings-description">Show line numbers beside the editor.</div>
                        </div>
                        <input id="show-line-numbers" class="settings-checkbox" type="checkbox" ${this.settings.showLineNumbers ? "checked" : ""} aria-label="Show line numbers">
                    </div>

                    <div class="doc-section settings-section">
                        <div class="settings-meta">
                            <label class="settings-label" for="highlight-current-line">Highlight current line</label>
                            <div class="settings-description">Highlight the instruction currently being executed.</div>
                        </div>
                        <input id="highlight-current-line" class="settings-checkbox" type="checkbox" ${this.settings.highlightCurrentLine ? "checked" : ""} aria-label="Highlight current line">
                    </div>

                    <div class="doc-section settings-section">
                        <div class="settings-meta">
                            <label class="settings-label" for="controller-displays-keys">Show controller key bindings</label>
                            <div class="settings-description">Display assigned keyboard shortcuts on controller buttons.</div>
                        </div>
                        <input id="controller-displays-keys" class="settings-checkbox" type="checkbox" ${this.settings.controllerDisplaysKeys ? "checked" : ""} aria-label="Show controller key bindings">
                    </div>

					<div class="doc-section settings-section">
						<div class="settings-meta">
							<label class="settings-label" for="register-display-mode">Registers and memory format</label>
							<div class="settings-description">Choose how register and memory values are displayed.</div>
						</div>
						<select id="register-display-mode" class="settings-select" aria-label="Registers and memory format">
							<option value="binary" ${this.settings.registerMemoryFormat === "binary" ? "selected" : ""}>Binary</option>
							<option value="hex" ${this.settings.registerMemoryFormat === "hex" ? "selected" : ""}>Hexadecimal</option>
						</select>
					</div>
				</div>

				<div class="doc-card">
					<div class="doc-card-header">
						<h2>Keyboard Shortcuts</h2>
					</div>
					<div class="doc-section settings-shortcuts">
						<div class="settings-description">Select a shortcut, then press the key or key combination to assign it.</div>
						<button type="button" id="reset-keybindings" class="settings-reset-button">Reset Keybinds</button>
						${keybindingMarkup}
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

        document.getElementById("confirm-reset").addEventListener(
            "change",
            event => this.update("confirmReset", event.target.checked)
        );

        document.getElementById("default-mobile-panel").addEventListener(
            "change",
            event => this.update("defaultMobilePanel", event.target.value)
        );

        document.getElementById("autosave-interval").addEventListener(
            "change",
            event => this.update("autosaveInterval", Number(event.target.value))
        );

        document.getElementById("syntax-highlighting").addEventListener(
            "change",
            event => this.update("syntaxHighlighting", event.target.checked)
        );

        document.getElementById("show-line-numbers").addEventListener(
            "change",
            event => this.update("showLineNumbers", event.target.checked)
        );

        document.getElementById("highlight-current-line").addEventListener(
            "change",
            event => this.update("highlightCurrentLine", event.target.checked)
        );

        document.getElementById("controller-displays-keys").addEventListener(
            "change",
            event => this.update("controllerDisplaysKeys", event.target.checked)
        );

        document.getElementById("register-display-mode").addEventListener(
            "change",
            event => this.update("registerMemoryFormat", event.target.value)
        );

        document.getElementById("reset-keybindings").addEventListener(
            "click",
            () => this.resetKeybindings()
        );

        document.querySelectorAll(".settings-shortcut").forEach(button => {
            button.addEventListener("click", () => {
                button.textContent = "Press a key...";

                const capture = event => {
                    const modifierKeys = [
                        "Control", "Shift", "Alt", "Meta",
                        "ControlLeft", "ControlRight",
                        "ShiftLeft", "ShiftRight",
                        "AltLeft", "AltRight",
                        "MetaLeft", "MetaRight"
                    ];

                    if (modifierKeys.includes(event.key) || modifierKeys.includes(event.code)) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();

                    const action = button.dataset.keybinding;
                    this.settings.keybindings[action] = keyEventToBinding(event);
                    this.save();
                    button.textContent = keyBindingLabel(this.settings.keybindings[action]);
                    document.removeEventListener("keydown", capture, true);
                };

                document.addEventListener("keydown", capture, true);
            });
        });

    }

    update(name, value) {
        this.settings[name] = value;
        this.save();
        document.dispatchEvent(new CustomEvent("settings-updated"));
    }

    resetKeybindings() {
        this.settings.keybindings = structuredClone(this.defaults.keybindings);
        this.save();

        document.querySelectorAll(".settings-shortcut").forEach(button => {
            const action = button.dataset.keybinding;
            button.textContent = keyBindingLabel(this.settings.keybindings[action]);
        });
    }

}

export default SettingsManager;
