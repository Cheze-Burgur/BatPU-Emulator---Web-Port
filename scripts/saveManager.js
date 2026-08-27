import Assembler from "./assembler.js";
import { showToast } from "./utils.js";

export default class SaveManager {

    constructor(codeEditor, problems, cpu, machine, loadProgram) {

        this.codeEditor = codeEditor;
        this.problems = problems;
        this.cpu = cpu;
        this.machine = machine;
        this.loadProgram = loadProgram;

        this.storageKey = "batpu-current-program";

        this.saveButton =
            document.getElementById("save-program");

        this.loadButton =
            document.getElementById("load-program");

        this.saveButton.addEventListener(
            "click",
            () => this.openSaveMenu()
        );

        this.loadButton.addEventListener(
            "click",
            () => this.openLoadMenu()
        );

    }

    async openSaveMenu() {

        const result = await Swal.fire({

            title: "Save Program",

            text: "Choose how you want to save the current program.",

            showCloseButton: true,

            showDenyButton: true,
            showCancelButton: true,

            confirmButtonText: "LocalStorage",
            denyButtonText: "Export Assembly (.as)",
            cancelButtonText: "Export Binary (.mc)",

            buttonsStyling: false,

            allowOutsideClick: true

        });

        if (result.isConfirmed) {

            this.saveToLocalStorage();

        } else if (result.isDenied) {

            this.exportAssembly();

        } else if (
            result.dismiss === Swal.DismissReason.cancel
        ) {

            this.exportMachineCode();

        }

    }

    async openLoadMenu() {

        const result = await Swal.fire({

            title: "Load Program",

            text: "Choose where you want to load from.",

            showCloseButton: true,

            showDenyButton: true,
            showCancelButton: true,

            confirmButtonText: "LocalStorage",
            denyButtonText: "Import Assembly (.as)",
            cancelButtonText: "Import Binary (.mc)",

            buttonsStyling: false,

            allowOutsideClick: true

        })

        if (result.isConfirmed) {

            this.loadFromLocalStorage();

        } else if (result.isDenied) {

            this.importAssembly();

        } else if (
            result.dismiss === Swal.DismissReason.cancel
        ) {

            this.importMachineCode();

        }

    }

    saveToLocalStorage() {

        localStorage.setItem(
            this.storageKey,
            this.codeEditor.value
        );

        showToast("Program saved to LocalStorage");

    }

    loadFromLocalStorage() {

        const savedProgram =
            localStorage.getItem(this.storageKey);

        if (savedProgram === null) {

            showToast("No saved program found", "info");

            return false;

        }

        this.codeEditor.value = savedProgram;

        // Assemble and load the program
        this.loadProgram();

        // Reset CPU and machine state
        this.machine.reset();

        showToast("Program loaded from LocalStorage");

        return true;

    }

    exportAssembly() {

        const source = this.codeEditor.value;

        const output =
            source.endsWith("\n")
                ? source
                : source + "\n";

        this.downloadFile(
            "program.as",
            output
        );

        showToast("Program exported as program.as");

    }

    async importAssembly() {

        const file = await this.pickFile(".as,text/plain");

        if (!file) return false;

        try {

            const source = await file.text();

            if (source.trim().length === 0) {

                showToast("Selected file is empty", "warning");

                return false;

            }

            const assembly =
                Assembler.assembleWithDiagnostics(source);

            if (assembly.problems.length > 0) {

                this.problems.set(
                    assembly.problems
                );

                showToast("Assembly file contains errors, cannot import", "error");

                return false;

            }

            this.codeEditor.value = source;

            this.loadProgram();

            this.machine.reset();

            showToast("Assembly program imported successfully");

            return true;

        } catch (error) {

            showToast("Failed to import the selected file", "error");

            return false;

        }

    }

    exportMachineCode() {

        const assembly =
            Assembler.assembleWithDiagnostics(
                this.codeEditor.value
            );

        if (assembly.problems.length > 0) {

            this.problems.set(
                assembly.problems
            );

            showToast("Program contains errors, cannot export", "error");

            return;

        }

        if (assembly.program.length === 0) {

            showToast("There was nothing to export", "warning");

            return;

        }

        const machineCode =
            Assembler
                .encodeProgram(assembly.program)
                .join("\n");

        this.downloadFile(
            "program.mc",
            machineCode + "\n"
        );

        showToast("Program exported as program.mc");

    }

    async importMachineCode() {

        const file = await this.pickFile(".mc,text/plain");

        if (!file) return false;

        try {

            const text = await file.text();

            const lines = text
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (lines.length === 0) {

                showToast("Selected file is empty", "warning");

                return false;

            }

            for (let i = 0; i < lines.length; i++) {

                if (!/^[01]{16}$/.test(lines[i])) {

                    showToast(`Line ${i + 1} is invalid, import aborted`, "error");

                    return false;

                }

            }

            const assemblyLines =
                Assembler.decodeProgram(lines);

            const source =
                assemblyLines.join("\n");

            this.codeEditor.value = source;

            this.loadProgram();

            this.machine.reset();

            showToast("Machine code program imported successfully");

            return true;

        } catch (error) {

            await Swal.fire({

                title: "Import Failed",

                text: `Could not decode the selected file: ${error.message}`,

                icon: "error",

                confirmButtonText: "OK",

                buttonsStyling: false

            });

            showToast(`Failed to import the selected file: ${error.message}`, "error");

            return false;

        }

    }

    downloadFile(filename, contents) {

        const blob = new Blob(
            [contents],
            {
                type: "text/plain;charset=utf-8"
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download = filename;

        document.body.appendChild(link);

        link.click();

        link.remove();

        setTimeout(() => {

            URL.revokeObjectURL(url);

        }, 0);

    }

    async pickFile(accept) {

        return new Promise(resolve => {

            const input =
                document.createElement("input");

            input.type = "file";
            input.accept = accept;

            let resolved = false;

            const finish = file => {

                if (resolved) return;

                resolved = true;

                input.remove();

                resolve(file);

            };

            input.addEventListener(
                "change",
                () => {

                    finish(
                        input.files?.[0] ?? null
                    );

                },
                { once: true }
            );

            input.addEventListener(
                "cancel",
                () => {

                    finish(null);

                },
                { once: true }
            );

            input.click();

        });

    }

}