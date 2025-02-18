
import { ADD, B, CMP, LDR, LDRB, MOV, LDM, STM, STR, STRB, SVC, BX, PUSH, POP, SUB, MUL, BL } from "../../constants/codes/op-codes";
import { b, bx, ldm, ldr, mov, stm, str, svc } from "../../instructions";
import { cmp } from "../../instructions/data-processing/arithmetic/cmp";
import { dataProcessing } from "../../instructions/data-processing/data-processing";
import { mul } from "../../instructions/multiply";
import { Memory } from "../types";
import { evalExpression } from "./eval-expression";
import { program } from "./parsers";
import { preProcess, PreProcessOptions } from "./pre-process";
import { Section } from "./types";

export type CPUType = 'arm7di'

export type AssemblerArgs = {
  e?: string
  mcpu?: CPUType
}

export const VECTOR_TABLE_END = 0x0000001c

export const getPreprocessOptions = (cpuType: CPUType): PreProcessOptions => {
  switch (cpuType) {
    case 'arm7di':
      return {
        commentIdentifier: '@'
      }
    default:
      throw Error('Unknown CPU type')
  }
}

export const assemble = (source: string, memory: Memory, args?: AssemblerArgs) => {
  const { e = '_start', mcpu = 'arm7di' } = args ?? {}
  const startAddress = VECTOR_TABLE_END
  const preProcessOptions = getPreprocessOptions(mcpu)
  const preProcessResult = preProcess(source, preProcessOptions)

  if (!preProcessResult.success) {
    console.error(preProcessResult)
    process.exit(1)
  }

  const { value } = preProcessResult
  const result = program.parse(value)

  if (!result.success) {
    console.error(result)
    process.exit(1)
  } else {
    const program = result.value
    const body = program.body as any[]
    const globalSymbols = new Set<string>()
    const symbolTable = new Map<string, { type: string; value: number }>()

    const textSection: Section = { type: 'text', locationCounter: startAddress, entries: [], symbols: new Set(), literalPool: [] }
    const dataSection: Section = { type: 'data', locationCounter: startAddress, entries: [], symbols: new Set(), literalPool: [] }

    let currentSection: Section = textSection
    let currentSymbols: string[] = []

    body.filter((statement) => {
      const { type } = statement

      switch (type) {
        case 'Label': {
          const { name } = statement

          if (!symbolTable.has(name)) {
            currentSymbols.push(name)

            symbolTable.set(name, { type: 'label', value: 0 })

            currentSection.symbols.add(name)
          }

          break
        }
        case 'Directive': {
          const { name } = statement

          switch (name) {
            case 'DATA': {
              currentSection = dataSection

              break;
            }
            case 'TEXT': {
              currentSection = textSection

              break;
            }
            case 'GLOBAL': {
              const { value } = statement

              globalSymbols.add(value)

              break;
            }
            case 'ASCII':
            case 'ZERO':
            case 'STRING':
            case 'WORD': {
              const { value } = statement

              currentSymbols.forEach(label => symbolTable.get(label)!.value = currentSection.locationCounter)
              currentSymbols = []

              statement.location = currentSection.locationCounter

              if (name === 'WORD') {
                currentSection.locationCounter += value.length * 4
              } else {
                currentSection.locationCounter += value.length
              }

              currentSection.entries.push(statement)

              break;
            }
            case 'EQUIV': {
              const { symbol } = statement

              symbolTable.set(symbol, { type: 'constant', value: currentSection.locationCounter })

              return true
            }
          }

          break
        }
        case 'SymbolAssignment': {
          const { name } = statement

          symbolTable.set(name, { type: 'constant', value: currentSection.locationCounter })

          return true
        }
        case 'Instruction': {
          currentSymbols.forEach(label => {
            const type = symbolTable.get(label)?.type || 'label'

            symbolTable.set(label, { type, value: currentSection.locationCounter })
          })
          currentSymbols = []

          statement.location = currentSection.locationCounter
          currentSection.locationCounter += 4

          const { opCode } = statement

          switch (opCode) {
            case LDR: {
              const { offset } = statement

              if (offset?.type === 'LabelExpression') {
                const { value: { name } } = offset
                const symbolName = `${name}_LITERAL`

                offset.value.name = symbolName

                currentSection.literalPool.push({ location: 0, name, symbolName })
                currentSection.symbols.add(symbolName)

                symbolTable.set(symbolName, { type: 'literal', value: 0 })
              }

              break;
            }
          }

          if (currentSection.type === 'text') {
            currentSection.entries.push(statement)
          } else {
            throw Error('Instruction outside of text section')
          }

          break
        }
      }

      return false
    }).forEach((statement: any) => {
      const { type } = statement

      switch (type) {
        case 'SymbolAssignment': {
          const { name, value } = statement
          const type = symbolTable.get(name)?.type || 'label'

          symbolTable.set(name, { type, value: evalExpression(value, symbolTable, symbolTable.get(name)!.value) })

          return false
        }
        case 'Directive': {
          const { name } = statement

          switch (name) {
            case 'EQUIV': {
              const { symbol, value } = statement
              const type = symbolTable.get(symbol)?.type || 'label'

              symbolTable.set(symbol, { type, value: evalExpression(value, symbolTable, symbolTable.get(symbol)!.value) })

              return false
            }
          }
        }
      }

      return true
    })

    const offsetDataSection = textSection.locationCounter + textSection.literalPool.length * 4

    dataSection.symbols.forEach((name) => symbolTable.get(name)!.value += offsetDataSection)

    textSection.literalPool.forEach(({ name, symbolName }) => {
      const location = textSection.locationCounter

      symbolTable.get(symbolName)!.value = location

      memory.writeUint32(location, symbolTable.get(name)!.value)

      textSection.locationCounter += 4
    })

    textSection.entries.forEach((statement: any) => {
      const { type } = statement

      switch (type) {
        case 'Instruction': {
          const { opCode, location, ...rest } = statement

          let instruction: number

          switch(opCode) {
            case MOV: {
              const { rd, operand2, i } = rest

              if (operand2.type === 'ImmidiateExpression') operand2.value = evalExpression(operand2, symbolTable, location)

              const { shift } = operand2

              if (shift?.amount) shift.amount = evalExpression(shift.amount, symbolTable, location)

              instruction = mov({ rd, operand2, i })

              break
            }
            case SUB:
            case ADD: {
              const { rd, rn, i, s, cond, operand2 } = rest

              if (operand2.type === 'ImmidiateExpression') operand2.value = evalExpression(operand2, symbolTable, location)

              const { shift } = operand2

              if (shift?.amount) shift.amount = evalExpression(shift.amount, symbolTable, location)

              instruction = dataProcessing({ rd, rn, i, s, cond, operand2, opCode })

              break
            }
            case B:
            case BL: {
              const { offset: offsetOrValue, cond, l } = rest

              let offset

              if (offsetOrValue.type === 'Label') {
                const { name } = offsetOrValue

                if (!symbolTable.has(name)) throw Error(`Label ${name} not found`)

                const address = symbolTable.get(name)!.value
                const currentAddress = location + 8

                offset = address - currentAddress
              } else {
                offset = offsetOrValue.value
              }

              instruction = b({ offset, cond, l })

              break;
            }
            case BX: {
              const { rn, cond } = rest

              instruction = bx({ rn, cond })

              break;
            }
            case SVC: {
              instruction = svc({ comment: evalExpression(rest.comment, symbolTable, location) })

              break
            }
            case STRB:
            case STR: {
              const { rd, rn, offset, writeBack, prePost, i } = rest
              const b = opCode === STRB ? 1 : 0

              if (offset.type === 'ImmidiateExpression') {
                offset.value = evalExpression(offset, symbolTable, location)
              } else {
                const { shift } = offset

                if (shift?.amount) shift.amount = evalExpression(shift.amount, symbolTable, location);
              }

              instruction = str({ i, rd, rn, offset, b, w: writeBack, p: prePost });

              break
            }
            case LDRB:
            case LDR: {
              const { rd, rn, byteWord, offset } = rest

              if (offset?.type === 'LabelExpression') {
                const address = evalExpression(offset, symbolTable, location)
                const currentAddress = location + 8
                const delta = address - currentAddress
                const upDown = delta > 1 ? 1 : 0

                instruction = ldr({ rd, rn, i: 1, offset: { type: 'ImmidiateExpression', value: Math.abs(delta) }, u: upDown, b: byteWord })
              } else {
                const { writeBack, prePost, i } = rest

                if (offset.type === 'ImmidiateExpression') {
                  offset.value = evalExpression(offset, symbolTable, location)
                } else {
                  const { shift } = offset

                  if (shift?.amount) shift.amount = evalExpression(shift.amount, symbolTable, location)
                }

                instruction = ldr({ i, rd, rn, offset, b: byteWord, w: writeBack, p: prePost })
              }

              break
            }
            case PUSH:
            case STM: {
              const { cond, rn, registerList, p, u, s, w } = rest

              instruction = stm({ cond, rn, registerList, p, u, s, w })

              break
            }
            case POP:
            case LDM: {
              const { cond, rn, registerList, p, u, s, w } = rest

              instruction = ldm({ cond, rn, registerList, p, u, s, w })

              break
            }
            case CMP: {
              const { rn, operand2, i } = rest

              const valueOfOperand2 = i ? evalExpression(operand2, symbolTable, location) : operand2.value

              instruction = cmp({ rn, operand2: valueOfOperand2, i })

              break
            }
            case MUL: {
              const { rd, rn, rs, rm } = rest

              instruction = mul({ rd, rn, rs, rm })

              break
            }
            default:
              throw Error('Bad instruction')
          }

          memory.writeUint32(location, instruction)

          break
        }
        case 'Directive': {
          const { name, location } = statement

          switch(name) {
            case 'ASCII': {
              const { value } = statement

              for (let i = 0, l = value.length; i < l; i++) {
                memory.writeUint8(i + location, value.charCodeAt(i))
              }

              break;
            }
            case 'ZERO': {
              const { size } = statement

              const value = evalExpression(size, symbolTable, location)

              for (let i = 0; i < value; i++) {
                memory.writeUint8(i + location, 0)
              }

              break;
            }
            case 'WORD': {
              const { value } = statement

              for (let i = 0; i < value.length; i++) {
                memory.writeUint32(location + i * 4, evalExpression(value[i], symbolTable, location))
              }

              break;
            }
            case 'STRING': {
              const { value } = statement

              for (let i = 0, l = value.length; i < l; i++) {
                memory.writeUint8(i + location, value.charCodeAt(i))
              }

              break;
            }
          }
        }
      }
    })

    dataSection.entries.forEach((statement: any) => {
      const { type, location } = statement
      const address = textSection.locationCounter + location

      switch (type) {
        case 'Directive': {
          const { name } = statement

          switch(name) {
            case 'ASCII': {
              const { value } = statement

              for (let i = 0, l = value.length; i < l; i++) {
                memory.writeUint8(address + i, value.charCodeAt(i))
              }

              break;
            }
            case 'WORD': {
              const { value } = statement

              for (let i = 0; i < value.length; i++) {
                memory.writeUint32(address + i * 4, evalExpression(value[i], symbolTable, address))
              }

              break;
            }
            case 'STRING': {
              const { value } = statement

              for (let i = 0, l = value.length; i < l; i++) {
                memory.writeUint8(address + i, value.charCodeAt(i))
              }

              break;
            }
            case 'ZERO': {
              const { size } = statement

              const value = evalExpression(size, symbolTable, address)

              for (let i = 0; i < value; i++) {
                memory.writeUint8(i + address, 0)
              }

              break;
            }
          }
        }
      }
    })

    if (!globalSymbols.has(e)) console.warn(`Warning: cannot find entry symbol ${e}, defaulting to 0x${startAddress.toString(16).padStart(8, '0')}`)

    return symbolTable.get(e)?.value || 0
  }
}