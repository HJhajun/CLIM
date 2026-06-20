const fs = require("fs");
const { spawnSync } = require('child_process');
const prompt = require('prompt-sync')();

const argv = process.argv;
const command = argv[2];
const filename = argv[3];

// 기본 사용법 안내
if (!command) {
    console.log("Usage: clim <new|n|run|r|edit|e|delete|d|list|l> <filename>");
    process.exit(1);
}

if (command === "new" || command === "n") {
    // 새 매크로 파일 생성
    const lines = [];
    while (true) {
        const index = lines.length + 1;
        const padding = " ".repeat(6 - String(index).length);
        const inputLine = prompt(`${padding}${index}| `);
        if (inputLine === "" || inputLine === "^C") {
            break;
        }
        lines.push(inputLine);
    }
    fs.writeFileSync(filename, lines.join("\n"));
    console.log(`${filename} was saved`);
} else if (command === "run" || command === "r") {
    // 매크로 파일 실행
    if (!fs.existsSync(filename)) {
        console.error(`${filename} not found`);
        process.exit(1);
    }
    const macro = fs.readFileSync(filename, "utf-8");
    const commands = macro.split(/\r?\n/).filter(line => line.trim() !== "");
    for (const cmd of commands) {
        console.log(`> ${cmd}`);
        const result = spawnSync(cmd, { shell: true, stdio: 'inherit' });
        if (result.error) {
            console.error(result.error.message);
            process.exit(1);
        }
        if (result.status !== 0) {
            process.exit(result.status);
        }
    }
} else if (command === "edit" || command === "e") {
    // 매크로 파일 편집 기능
    if (!filename) {
        console.error("Filename required for edit command.");
        process.exit(1);
    }
    const lines = fs.existsSync(filename)
        ? fs.readFileSync(filename, "utf-8").split(/\r?\n/)
        : [];

    while (true) {
        console.log(`\n=== ${filename} ===`);
        if (lines.length === 0) {
            console.log("(empty file)");
        } else {
            lines.forEach((line, index) => {
                console.log(`${index + 1}: ${line}`);
            });
        }

        const action = prompt("[a]ppend [r]eplace [d]elete [s]ave [q]uit > ").trim().toLowerCase();
        if (action === "a") {
            const newLine = prompt("Append line: ");
            if (newLine !== "") {
                lines.push(newLine);
            }
        } else if (action === "r") {
            const lineNumber = Number(prompt("Replace line number: "));
            if (Number.isInteger(lineNumber) && lineNumber >= 1 && lineNumber <= lines.length) {
                const newText = prompt("New text: ");
                lines[lineNumber - 1] = newText;
            } else {
                console.log("Please enter a valid line number.");
            }
        } else if (action === "d") {
            const lineNumber = Number(prompt("Delete line number: "));
            if (Number.isInteger(lineNumber) && lineNumber >= 1 && lineNumber <= lines.length) {
                lines.splice(lineNumber - 1, 1);
            } else {
                console.log("Please enter a valid line number.");
            }
        } else if (action === "s") {
            fs.writeFileSync(filename, lines.join("\n"));
            console.log(`${filename} was saved`);
            break;
        } else if (action === "q") {
            console.log("Edit cancelled.");
            break;
        } else {
            console.log("Unknown command. Try again.");
        }
    }
} else if (command === "delete" || command === "del" || command === "rm") {
    // 파일 삭제 기능
    if (!filename) {
        console.error("Filename required for delete command.");
        process.exit(1);
    }
    if (!fs.existsSync(filename)) {
        console.error(`${filename} not found`);
        process.exit(1);
    }
    fs.unlinkSync(filename);
    console.log(`${filename} was deleted`);
} else if (command === "list" || command === "ls") {
    // 파일 목록 보기 기능
    const files = fs.readdirSync(process.cwd()).filter(file => fs.statSync(file).isFile());
    if (files.length === 0) {
        console.log("No files found.");
    } else {
        files.forEach(file => console.log(file));
    }
} else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}