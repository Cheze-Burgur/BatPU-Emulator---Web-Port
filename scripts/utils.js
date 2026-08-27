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

export { clamp, toBin, formatBinaryRows, getSpeedDelay, updateSpeedText, updateEditorGutter, showToast };