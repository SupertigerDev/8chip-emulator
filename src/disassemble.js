export function disassemble(program) {
    let pc = 512;
    const arr = []

    while (true) {
        if (pc - 512 >= program.length) break; 
        if (pc - 512 >= 100000) break;
        const opcode = (program[pc++ - 512] << 8) | program[pc++ - 512]
        arr.push({pc: "0x" + (pc - 2).toString(16).toUpperCase(), op: "0x" + opcode.toString(16).toUpperCase(), name: returnInstructionName(opcode)})
    }
    return arr;
}

export function returnInstructionName(opcode) {
    const nibble = opcode & 0xF000;
    switch(nibble) {
        case(0x0000): {
            switch(opcode) {
                case 0x00E0: {
                    return "CLS";
                }
                case 0x00EE: {
                    return "RET"
                }
                default: return "UNKNOWN"
            }
            break;
        }
        case 0x1000: {
            return "JP addr"
        }
        case 0x2000: {
            return "CALL addr"
        }
        case 0x3000: {
            return "SE Vx, byte"
        }
        case 0x4000: {
            return "SNE Vx, byte"
        }
        case 0x5000: {
            return "SE Vx, Vy"
        }
        case 0x6000: {
            return "LD Vx, byte"
        }
        case 0x7000: return "ADD Vx, byte"
        case 0x8000: {
            const n = opcode & 0x000F;
            switch (n) {
                case 0x0: return "LD Vx, Vy"
                case 0x1: return "OR Vx, Vy"
                case 0x2: return "AND Vx, Vy"
                case 0x3: return "XOR Vx, Vy"
                case 0x4: return "ADD Vx, Vy"
                case 0x5: return "SUB Vx, Vy"
                case 0x6: return "SHR Vx {, Vy}"
                case 0x7: return "SUBN Vx, Vy"
                case 0xe: return "SHL Vx {, Vy}"
                default: return "UNKNOWN"
            }
            break;
        }
        case 0x9000: return "SNE Vx, Vy"
        case 0xA000: return "LD I, addr"
        case 0xB000: return "JP V0, addr"
        case 0xC000: return "RND Vx, byte"
        case 0xD000: return "DRW Vx, Vy, nibble"
        case 0xE000: return "SKP Vx"
        case 0xF000: {
            const n = opcode & 0x000F;
            switch (n) {

                default: return "UNKNOWN"
            }
            break
        }
        default: return "UNKNOWN"
    }
}