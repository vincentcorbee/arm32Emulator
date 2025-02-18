// import { assemble } from "./modules/assembler";
// import { CPU } from "./modules/cpu";
// import { Memory } from "./modules/memory";
// import { MemoryController } from "./modules/memory-controller";

import { assemble } from "../src/modules/assembler";
import { log } from "../src/modules/assembler/helpers";
import { program } from "../src/modules/assembler/parsers";
import { mov } from "../src/modules/assembler/parsers/instructions/mov";
import { stm } from "../src/modules/assembler/parsers/instructions/stm";
import { Memory } from "../src/modules/memory";
import { stm as stm_instruction } from "../src/instructions";

// const source = `
// .global _start

// _start:
// ldr r2, =str
// ldrb r3, [r2]
// ldr r4, =str_length
// ldr r5, =error_message_socket
// ldrb r6, [r5]

// b start

// end:
//   mov r7, #1
//   svc #0

// start:
//   mov r0, #9
//   b end

// .data
//   str: .ascii "Hello, World!\n"
//   str_length = . - str

//   error_message_socket: .string "Could not create socket\n"
//   error_message_socket_len = . - error_message_socket
// `

// const memoryController = new MemoryController()

// const memory = new Memory(1024);
// const cpu = new CPU(memoryController);


// // const program = (memory: Memory, cpu: CPU) => {
// //   const data = 'Hello, World!\n'
// //   const ADDRESS_DATA = 4 * 20

// //   const instructions = [
// //     mov({ rd: R0, operand2: 1 }),
// //     mov({ rd: R1, operand2: ADDRESS_DATA }),
// //     mov({ rd: R2, operand2: data.length }),
// //     mov({ rd: R7, operand2: 4 }),
// //     svc({ imm24: 0 }),
// //     ldr({ rn: PC, rd: R3, imm12: 8 }),
// //     ldrb({ rn: R3, rd: R4 }),
// //     mov({ rd: R0, operand2: 1 }),
// //     mov({ rd: R1, operand2: 2 }),
// //     ADDRESS_DATA,
// //     mov({ rd: R0, operand2: 2 }),
// //     mov({ rd: R7, operand2: 1 }),
// //     svc({ imm24: 0 }),
// //   ]

// //   instructions.forEach((instruction, i) => memory.setUint32(i * 4, instruction))

// //   for (let i = 0, l = data.length; i < l; i++) {
// //     memory.setUint8(ADDRESS_DATA + i, data[i].charCodeAt(0));
// //   }

// //   cpu.viewMemoryAt(ADDRESS_DATA, { length: 40 })
// // }

// // const programB = (memory: Memory) => {
// //   const instructions = [
// //     // B PC + #4
// //     b({ offset: 0x4}),
// //     // MOV R7, #1
// //     mov({ rd: R7, operand2: 1 }),
// //     // SVC #0
// //     svc({ imm24: 0 }),
// //     // MOV R0, #1
// //     mov({ rd: R0, operand2: 1 }),
// //     // B PC - #20
// //     b({ offset: -0x14}),
// //   ]

// //   instructions.forEach((instruction, i) => memory.setUint32(i * 4, instruction))

// //   console.log(instructions.map((instruction, i) => `${i * 4}: ${instruction.toString(2).padStart(32, '0')}`).join('\n'))
// // }

// // programB(memory)

// // const input = process.stdin

// // input.setRawMode(true)

// // input.on('data', (data) => {
// //   const token = data.toString()

// //   switch (token) {
// //     case '\x03': {
// //       process.exit()
// //     }
// //     case '\r': {
// //       cpu.cycle()
// //       cpu.viewRegisters()
// //     }
// //   }
// // })

// const start = assemble(source, memory)

// cpu.setPC(start)

// const input = process.stdin

// input.setRawMode(true)

// input.on('data', (data) => {
//   const token = data.toString()

//   switch (token) {
//     case '\x03': {
//       process.exit()
//     }
//     case '\r': {
//       cpu.cycle()
//       cpu.viewRegisters()
//     }
//   }
// })
const memory = new Memory(1024);
// const result = program.parse('mov r0, r1, LSL #(1 + 1)\n')


  // assemble('mov r0, r1, LSL #(1 + 1)\n', memory)

const result = stm.parse('STMFD R0, {R0, r4-R7}')

if (result.success) {
  const { cond, rn, registerList, p, u, w } = result.value

  const instruction = stm_instruction({ cond, rn, registerList, p, u, w })

  console.log(instruction.toString(2).padStart(32, '0'))
}

