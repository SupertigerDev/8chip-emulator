import { returnInstructionName } from "./disassemble";
const dt = 0, st = 1;
export default class CPU {
    constructor() {
        this.pc = 0;
        this.ram = new Uint8Array(4 * 1024);
        this.v = new Uint8Array(16)
        this.I = 0;
        this.stack = new Array(16);
        this.timers = new Uint16Array(2);
        this.display = new Uint8Array(64*32);

        this.keyboard;
        this.waitForKeyPress = false;

    
        setInterval(() => {
            if (this.timers[dt] > 0) {
                this.timers[dt]-= 1;
            }
    
        }, 60);
    }
    loadProgram(program) {
        for (let i = 0; i < program.length; i++) {
            this.ram[i + 512] = program[i];            
        }
        this.pc = 512;
        const numbers = new Uint8Array([0xF0,0x90,0x90,0x90,0xF0,0x20,0x60,0x20,0x20,0x70,0xF0,0x10,0xF0,0x80,0xF0,0xF0,0x10,0xF0,0x10,0xF0,0x90,0x90,0xF0,0x10,0x10,0xF0,0x80,0xF0,0x10,0xF0,0xF0,0x80,0xF0,0x90,0xF0,0xF0,0x10,0x20,0x40,0x40,0xF0,0x90,0xF0,0x90,0xF0,0xF0,0x90,0xF0,0x10,0xF0,0xF0,0x90,0xF0,0x90,0x90,0xE0,0x90,0xE0,0x90,0xE0,0xF0,0x80,0x80,0x80,0xF0,0xE0,0x90,0x90,0x90,0xE0,0xF0,0x80,0xF0,0x80,0xF0,0xF0,0x80,0xF0,0x80,0x80])

        for (let index = 0; index < numbers.length; index++) {
            this.ram[index] = numbers[index];
        }
    }

    step() {

        const opcode = this.readWord(this.pc);
        // console.log(`0x${opcode.toString(16)} 0x${this.pc.toString(16)} (${returnInstructionName(opcode)})`)


        // console.log(this.keyboard)
        if (this.waitForKeyPress) {
            if (this.keyboard !== undefined) {
                console.log("KEY PRESSED")
                this.vx = this.keyboard;
                this.keyboard = undefined;
                this.waitForKeyPress = false
            }
            return;
        }

        const nibble = opcode & 0xF000;
        this.pc += 2;
        switch(nibble) {
            case 0x0000: {
                switch(opcode) {
                    case 0x00e0: { // CLS
                        this.display = new Uint8Array(64*32);
                        break;
                    }
                    case 0x00ee: { // RET
                        this.pc = this.stack.pop();
                        break;
                    }
                    default: def(opcode)
                }
                break;
            }
            case 0x1000: this.pc = opcode & 0x0FFF; break; // 1nnn - JP addr
            case 0x2000: { // 2nnn - CALL addr
                this.stack.push(this.pc);
                this.pc = opcode & 0x0FFF;
                break;
            } 
            case 0x3000: { // 3xkk - SE Vx, byte
                if (this.vx === this.kk) {
                    this.pc += 2;
                }
                break;
            }
            case 0x4000: { // 4xkk - SNE Vx, byte
                if (this.vx !== this.kk) {
                    this.pc += 2;
                }
                break;
            }
            case 0x5000: { // 5xy0 - SE Vx, Vy
                if (this.vx === this.vy) {
                    this.pc += 2;
                }
                break;
            }
            case 0x6000: { // 6xkk - LD Vx, byte
                this.vx = this.kk;
                break;
            }
            case 0x7000: {
                this.vx = this.vx + this.kk;
                break;
            }
            case 0x8000: {
                const n = opcode & 0x000F;
                switch(n) {
                    case 0x0: {
                        this.vx = this.vy;
                        break;
                    }
                    case 0x1: this.vx = this.vx | this.vy; break;
                    case 0x2: this.vx = this.vx & this.vy; break;
                    case 0x3: this.vx = this.vx ^ this.vy; break;
                    case 0x4: {
                        this.v[15] = (this.vx + this.vy) > 255;
                        this.vx = ((this.vx + this.vy) & 0x00FF);;

                        break;
                    }
                    case 0x5: {
                        this.v[15] = (this.vx > this.vy) ? 1:0;
                        this.vx = (this.vx - this.vy) & 0x00FF;
                        break;
                    }
                    case 0x6: { // 8xy6 - SHR Vx {, Vy}
                        // LSB of VX
                        this.v[15] = this.vx & 0x0001;
                        this.vx = this.vx >> 1;
                        break;
                    }
                    case 0x7: {
                        this.v[15] = (this.vy > this.vx) ? 1: 0;
                        this.vx =((this.vy - this.vx) & 0x00FF);
                        break;
                    }
                    case 0xe: { //8xyE - SHL Vx {, Vy}
                        // MSB of VX
                        this.v[15] =  ((this.vx & 0x80) == 0x80) ? 1 : 0;
                        this.vx = this.vx << 1;
                        break;
                    }
                    default: def(opcode)
                }
                break;
            }
            case 0x9000: {
                if (this.vx !== this.vy) {
                    this.pc+=2;
                }
                break;
            }
            case 0xA000: {
                this.I = opcode & 0x0FFF;
                break;
            }
            case 0xB000:{
                this.pc = (opcode & 0x0FFF) + this.v[0];
                break;
            }
            case 0xC000: { // Cxkk - RND Vx, byte
                this.vx = Math.round(Math.random() * 255) & (opcode & 0x00FF);
                break;
            }
            case 0xD000: { // Dxyn - DRW Vx, Vy, nibble
                const x = this.vx;
                const y = this.vy;
                const n = opcode & 0x000F;

                this.v[15] = 0

                for (let i = 0; i < n; i++) {
                    const mem = this.ram[this.I + i];
                    for (let j = 0; j < 8; j++) {
                        const pixel = (mem >> (7 - j)) & 0x01;
                        const displayIndex = x + j + (y + i) * 64;
                        if (displayIndex > 2047) continue;

                        const oldpixel = this.display[displayIndex];

                        this.display[displayIndex] = pixel ^ oldpixel;


                        if (this.display[displayIndex] === 0 && oldpixel == 1) {
                            this.v[15] = 1;
                        }
                        // this.display[displayIndex] = this.display[displayIndex] ^ pixel
                    }
                    
                }
                break
            }
            case 0xe000: {
                const n = opcode & 0x00FF;
                switch(n) {
                    case 0x9e: {
                        if (this.vx === this.keyboard) {
                            this.pc += 2;
                        }
                        break;
                    }
                    case 0xA1: {
                        if (this.vx !== this.keyboard) {
                            this.pc += 2;
                        }
                        break;
                    }
                    default: def(opcode)
                }
                break;
            }
            case 0xF000: {
                const n = opcode & 0x00FF;
                switch(n) {
                    case 0x07: {
                        this.vx = this.timers[dt];
                        break;
                    }
                    case 0x0A: {
                        this.waitForKeyPress = true;
                        // this.pc -= 2;
                        break;
                    }
                    case 0x15: {
                        this.timers[dt] = this.vx;
                        break;
                    }
                    case 0x18: {
                        this.timers[st] = this.vx;
                        break;
                    }
                    case 0x1E: {
                        this.I = this.I + this.vx;
                        break;
                    }
                    case 0x29: {
                        this.I = this.vx * 5;
                        break;
                    }
                    case 0x33:
                        this.ram[this.I] = (this.vx / 100);
                        this.ram[this.I + 1] = (this.vx % 100) / 10;
                        this.ram[this.I + 2] = this.vx % 10
                        break;
                    case 0x55: {
                        for (let index = 0; index <= (opcode & 0x0F00) >> 8; index++) {
                            this.ram[this.I + index] = this.v[index]; 
                        }
                        break;
                    }
                    case 0x65: {
                        for (let index = 0; index <= (opcode & 0x0F00) >> 8; index++) {
                            this.v[index] = this.ram[this.I + index]
                        }
                        break;
                    }
                    default: def(opcode)
                }
                break;
            }
            default: def(opcode)
        }
    }
    get vx() {
        const x = (this.readWord(this.pc - 2) & 0x0F00) >> 8;
        return this.v[x];
    }
    set vx(val) {
        const x = (this.readWord(this.pc - 2) & 0x0F00) >> 8;
        this.v[x] = val;
    }
    get vy() {
        const y = (this.readWord(this.pc - 2) & 0x00F0) >> 4;
        return this.v[y];
    }
    get kk() {
        return this.readWord(this.pc - 2) & 0x00FF;
    }
    readWord(address) {
        return this.ram[address] << 8 | this.ram[address + 1]
    }
}

function def(op) {
    console.log(`Unknown Instruction: 0x${op.toString(16)} (${returnInstructionName(op)})`)
}