const clamp = (v, max) => Math.min(max - 1, Math.max(0, v));
const toBin = v => (v & 0xff).toString(2).padStart(8, "0");
const formatBinaryRows = v => {
    const b = toBin(v);
    return { top: b.slice(0, 4), bottom: b.slice(4) };
};
const getSpeedDelay = speedSlider => Math.max(1, Math.round(1000 / Number(speedSlider.value)));

function updateSpeedText(value, speedValue) {
    speedValue.textContent = `${value} Hz`;
}

function keyEventToBinding(event) {
    const modifiers = [];

    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");

    return [...modifiers, event.code].join("+");
}

function matchesKeyBinding(event, binding) {
    if (!binding) return false;

    const parts = binding.split("+");
    const code = parts.at(-1);

    return event.code === code
        && event.ctrlKey === parts.includes("Ctrl")
        && event.altKey === parts.includes("Alt")
        && event.shiftKey === parts.includes("Shift")
        && event.metaKey === parts.includes("Meta");
}

function keyBindingLabel(binding) {
    if (!binding) return "Unassigned";

    return binding
        .split("+")
        .map(part => {
            if (part.startsWith("Key")) return part.slice(3);
            if (part.startsWith("Digit")) return part.slice(5);
            if (part === "Escape") return "Esc";
            if (part === "Space") return "Space";
            if (part.startsWith("Arrow")) return part.slice(5);
            return part;
        })
        .join(" + ");
}

function updateEditorGutter(source, codeEditor, editorGutter, editorLineMap, Assembler) {
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

function escapeHtml(value) {
    return value.replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}

function highlightAssembly(source) {
    const opcodes = new Set([
        "NOP", "HLT", "ADD", "SUB", "NOR", "AND", "XOR", "RSH",
        "LDI", "ADI", "JMP", "BRH", "CAL", "RET", "LOD", "STR"
    ]);

    return source.split("\n").map(line => {
        const commentStart = line.search(/[;#]|\/\//);
        const code = commentStart === -1 ? line : line.slice(0, commentStart);
        const comment = commentStart === -1 ? "" : line.slice(commentStart);
        const highlighted = code
            .replace(/\b(?:0b[01]+|0x[\da-f]+|\d+)\b|\br(?:1[0-5]|[0-9])\b/gi, token => {
                const className = /^r(?:1[0-5]|[0-9])$/i.test(token)
                    ? "syntax-register"
                    : "syntax-number";
                return `<span class="${className}">${escapeHtml(token)}</span>`;
            })
            .replace(/^\s*([a-z]+)\b/i, (match, token) => {
                if (!opcodes.has(token.toUpperCase())) return match;
                return match.replace(token, `<span class="syntax-opcode">${escapeHtml(token)}</span>`);
            });

        return highlighted + (comment ? `<span class="syntax-comment">${escapeHtml(comment)}</span>` : "");
    }).join("\n") + "\n";
}

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    background: "#171717",
    color: "#ddd",
    customClass: {
        popup: "toast-popup"
    }
});

function showToast(title, icon = "success") {

    Toast.fire({
        icon,
        title
    });

}

export {
    clamp,
    toBin,
    formatBinaryRows,
    getSpeedDelay,
    updateSpeedText,
    updateEditorGutter,
    highlightAssembly,
    showToast,
    keyEventToBinding,
    matchesKeyBinding,
    keyBindingLabel
};