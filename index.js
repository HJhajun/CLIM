#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require('child_process');
const prompt = require('prompt-sync')();

const argv = process.argv;
const command = argv[2];
let filename = argv[3];

// 홈 디렉토리 아래 .clim 폴더 경로
const dataDir = path.join(os.homedir(), ".clim");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// 파일명에 .clim 확장자 추가/처리
function getClimFilePath(name) {
    if (!name.endsWith(".clim")) {
        name = name + ".clim";
    }
    return path.join(dataDir, name);
}

// 기본 사용법 안내
if (!command) {
    console.log("Usage: clim <new|n|run|r|edit|e|delete|d|list|l> [filename]");
    process.exit(1);
}

if (command === "new" || command === "n") {
    // 새 매크로 파일 생성
    if (!filename) {
        console.error("Filename required for new command.");
        process.exit(1);
    }
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
    const filepath = getClimFilePath(filename);
    fs.writeFileSync(filepath, lines.join("\n"));
    console.log(`${path.basename(filepath)} was saved`);
} else if (command === "run" || command === "r") {
    // 매크로 파일 실행
    if (!filename) {
        console.error("Filename required for run command.");
        process.exit(1);
    }
    const filepath = getClimFilePath(filename);
    if (!fs.existsSync(filepath)) {
        console.error(`${path.basename(filepath)} not found`);
        process.exit(1);
    }
    const macro = fs.readFileSync(filepath, "utf-8");
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
    const filepath = getClimFilePath(filename);
    const lines = fs.existsSync(filepath)
        ? fs.readFileSync(filepath, "utf-8").split(/\r?\n/)
        : [];

    while (true) {
        console.log(`\n=== ${path.basename(filepath)} ===`);
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
            fs.writeFileSync(filepath, lines.join("\n"));
            console.log(`${path.basename(filepath)} was saved`);
            break;
        } else if (action === "q") {
            console.log("Edit cancelled.");
            break;
        } else {
            console.log("Unknown command. Try again.");
        }
    }
} else if (command === "delete" || command === "d") {
    // 파일 삭제 기능
    if (!filename) {
        console.error("Filename required for delete command.");
        process.exit(1);
    }
    const filepath = getClimFilePath(filename);
    if (!fs.existsSync(filepath)) {
        console.error(`${path.basename(filepath)} not found`);
        process.exit(1);
    }
    fs.unlinkSync(filepath);
    console.log(`${path.basename(filepath)} was deleted`);
} else if (command === "list" || command === "ls") {
    // 파일 목록 보기 기능 (.clim 파일만)
    const files = fs.readdirSync(dataDir).filter(file => {
        const fullPath = path.join(dataDir, file);
        return fs.statSync(fullPath).isFile() && file.endsWith(".clim");
    });
    if (files.length === 0) {
        console.log("No .clim files found.");
    } else {
        files.forEach(file => console.log(path.basename(file, ".clim")));
    }
} else {
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}