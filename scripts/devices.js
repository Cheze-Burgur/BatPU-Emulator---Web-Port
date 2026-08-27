import { clamp } from "./utils.js";

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

    constructor(memory, textDisplay) {

        super(247, 249);
        memory.register(this);

        this.textDisplay = textDisplay;
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

        this.textDisplay.textContent = this.front;

    }

    reset() {

        this.clearCharsBuffer();
        this.flushChars();

    }

}

class NumberDevice extends Device {

    constructor(memory, numDisplay) {

        super(250, 253);
        memory.register(this);

        this.numDisplay = numDisplay;
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
            this.numDisplay.textContent = "";
        } else {
            let val = this.displayNumber;
            if (this.numberMode === "signed" && val & 0x80) val = val - 256;
            this.numDisplay.textContent = val;
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

    constructor(memory, onMemoryUpdate = null) {

        super(255);
        memory.register(this);

        this.memory = memory;
        this.onMemoryUpdate = onMemoryUpdate;

        this.liveState = {
            left: 0,
            down: 0,
            right: 0,
            up: 0,
            b: 0,
            a: 0,
            one: 0,
            two: 0
        }
        this.latchedState = {
            left: 0,
            down: 0,
            right: 0,
            up: 0,
            b: 0,
            a: 0,
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

        if (this.onMemoryUpdate) this.onMemoryUpdate();

    }

    updateState(key, value) {

        this.liveState[key] = value;
        this.latchedState = {
            ...this.liveState
        };
        this.syncMemory();

    }

    initBtns() {

        ["btn-lft", "btn-dwn", "btn-rgt", "btn-up"].forEach((id, i) =>
            this.bindButton(id, ["left", "down", "right", "up"][i])
        );

        this.bindButton("ctr-btn-b", "b");
        this.bindButton("ctr-btn-a", "a");

        this.bindButton("ctr-btn-one", "one");
        this.bindButton("ctr-btn-two", "two");

        this.setupKeyboard();

    }

    readButtons() {

        let v = 0;

        v |= this.latchedState.left << 0;
        v |= this.latchedState.down << 1;
        v |= this.latchedState.right << 2;
        v |= this.latchedState.up << 3;
        v |= this.latchedState.b << 4;
        v |= this.latchedState.a << 5;
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

export { Device, ScreenDevice, CharacterDevice, NumberDevice, RandomNumberDevice, ControllerDevice };