import { disassemble } from './disassemble'
import CPU from './CPU'

const fileInput = document.getElementById("fileInput");
const opList = document.getElementById("opList");
const info = document.getElementById("info");
const pauseButton = document.getElementById("pauseButton");
const stepButton = document.getElementById("stepButton");
const keyboard = document.getElementById("keyboard");
const canvas = document.getElementById("canvas");
const romsArea = document.getElementById("romsArea");
const context = canvas.getContext("2d");

fileInput.onchange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = (e => {
    loadProgram(new Uint8Array(reader.result))
  })
  reader.readAsArrayBuffer(file);
}

let cpu = new CPU();

keyboard.addEventListener("mousedown", event => {
  const target = event.target;
  if (!target.classList.contains("button")) return;
  cpu.keyboard = parseInt(`0x${target.innerText}`)
})

keyboard.addEventListener("mouseup", event => {
  cpu.keyboard = undefined;
})

context.scale(7, 7)
function frame() {
  context.clearRect(0, 0, 600, 600);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      if (cpu.display[x + y * 64]) {
        context.fillStyle = "white";
        context.fillRect(x, y, 1, 1);
      }
      
    }
    
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame)

let stepInterval = null;
let stepInterval2 = null;

stepButton.addEventListener("click", () => {
  currentOpcode(cpu.pc);
  info.innerHTML = `VX: ${cpu.vx} VY: ${cpu.vy}\nReg: ${cpu.v.join(",")}`
  cpu.step()
})
pauseButton.addEventListener("click", () => {
  clearInterval(stepInterval)
  clearInterval(stepInterval2)
})

romsArea.addEventListener("click", event => {
  if (event.target.classList.contains("rom")) {
    fetch(event.target.innerText).then(res => {
      res.body.getReader().read().then(r => {
        loadProgram(r.value)
      })
    })
  }
})


function loadProgram(program) {
  populateOpcodes(program);
  cpu = new CPU();
  clearInterval(stepInterval)
  clearInterval(stepInterval2)
  cpu.loadProgram(program);
  stepInterval = setInterval(() => {
    info.innerHTML = `VX: ${cpu.vx} VY: ${cpu.vy}\nReg: ${cpu.v.join(",")}`
    currentOpcode(cpu.pc);
    cpu.step();
  }, 0);
  stepInterval2 = setInterval(() => {
    //  currentOpcode(cpu.pc);
      cpu.step();
    }, 0);

}


function currentOpcode(pc) {
  setTimeout(() => {
    const all = document.querySelectorAll(".op-list .op");
    all.forEach(e => e.classList.remove("current"))
    const selected = document.getElementById("pc-0x" + pc.toString(16).toUpperCase());
    if (!selected) return;
    selected.classList.add("current");
    // selected.scrollIntoView({
    //   block: "center",
    //   inline: "center"
    // });
  });
}


function populateOpcodes(program) {
  // disassemble program
  const opItem = data => `<div class="op" id="pc-${data.pc}"><span class="pc">${data.pc}</span><span class="opcode">${data.op}</span><span class="name">${data.name}</span></div>`
  const arr = disassemble(program);
  let divs = "";
  for (let index = 0; index < arr.length; index++) {
    divs += opItem(arr[index])
  }
  opList.innerHTML = divs;



}