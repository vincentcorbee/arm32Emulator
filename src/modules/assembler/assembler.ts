import { ADD, B, BL, BX, CMP, LDM, LDR, LDRB, MOV, MUL, MVN, POP, PUSH, STM, STR, STRB, SUB, SVC } from "../../constants/codes";
import { ASCII, DATA, EQUIV, FLOAT, GLOBAL, STRING, TEXT, WORD, ZERO } from "../../constants/mnemonics";
import { b, bx, ldr, mul, str, svc } from "../../instructions";
import { blockDataTransfer } from "../../instructions/block-data-transfer/block-data-transfer";
import { dataProcessing } from "../../instructions/data-processing/data-processing";
import { char, either, map } from "../parser-combinators";
import { Memory } from "../types";
import { AssemblerArgs, getPreprocessOptions, VECTOR_TABLE_END } from "./assemble";
import { evalExpression } from "./eval-expression";
import { program } from "./parsers";
import { comment, multilineComment } from "./parsers/comments";
import { not } from "./parsers/not";
import { doubleQuote, endMultilineComment, stringConstant } from "./parsers/tokens";
import { toIEEE754SinglePrecision } from "./to-ieee754-single-precision";
import { Context, DirectiveHandler, GlobalSymbols, Handler, InstructionHandler, PreProcessOptions, Section, SymbolTable } from "./types";

export class Assembler {
  #handlers: Record<string, Handler>
  #instructionHandlers: Record<number, InstructionHandler>
  #directiveHandlers: Record<string, DirectiveHandler>
  #singleDataTransferHandlers: Record<number, InstructionHandler>

  constructor() {
    this.#handlers = {
      'Directive': this.#directiveHandler,
      'Instruction': this.#instructionHandler,
      'Label': this.#labelHandler,
      'SymbolAssignment': this.#symbolAssignmentHandler,
    }

    this.#singleDataTransferHandlers = {
      [LDR]: this.#ldrHandler,
      [LDRB]: this.#ldrHandler,
      [STR]: this.#strHandler,
      [STRB]: this.#strHandler,
    }

    this.#instructionHandlers = {
      [MOV]: this.#dataProcessingHandler,
      [MVN]: this.#dataProcessingHandler,
      [SUB]: this.#dataProcessingHandler,
      [ADD]: this.#dataProcessingHandler,
      [CMP]: this.#dataProcessingHandler,
      [MUL]: this.#multiplyHandler,
      [LDR]: this.#singleDataTransferHandler,
      [LDRB]: this.#singleDataTransferHandler,
      [STR]: this.#singleDataTransferHandler,
      [STRB]: this.#singleDataTransferHandler,
      [PUSH]: this.#blockDataTransferHandler,
      [STM]: this.#blockDataTransferHandler,
      [POP]: this.#blockDataTransferHandler,
      [LDM]: this.#blockDataTransferHandler,
      [B]: this.#branchHandler,
      [BL]: this.#branchHandler,
      [BX]: this.#branchExchangeHandler,
      [SVC]: this.#softWareInterruptHandler,
    }

    this.#directiveHandlers = {
      [ASCII]: this.#asciiHandler,
      [STRING]: this.#stringHandler,
      [WORD]: this.#wordHandler,
      [ZERO]: this.#zeroHandler,
      [DATA]: this.#dataHandler,
      [TEXT]: this.#textHandler,
      [GLOBAL]: this.#globalHandler,
      [EQUIV]: this.#equivHandler,
      [FLOAT]: this.#floatHandler,
    }
  }

  assemble(source: string, memory: Memory, args?: AssemblerArgs): number {
    const { e = '_start', mcpu = 'arm7di' } = args ?? {}
    const startAddress = VECTOR_TABLE_END
    const preProcessOptions = getPreprocessOptions(mcpu)
    const preProcessResult = this.#preProcess(source, preProcessOptions)

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
      const body = result.value.body as any[]
      const globalSymbols: GlobalSymbols = new Set()
      const symbolTable: SymbolTable = new Map()
      const textSection: Section = { type: 'text', locationCounter: startAddress, entries: [], symbols: new Set(), literalPool: [] }
      const dataSection: Section = { type: 'data', locationCounter: startAddress, entries: [], symbols: new Set(), literalPool: [] }
      const context: Context = {
        symbolTable,
        textSection,
        dataSection,
        globalSymbols,
        currentSection: textSection,
        currentSymbols: []
      }

      /* First pass */
      body.filter((statement) => this.#handler(statement, context, 1, memory))
      /* Second pass */
      .forEach((statement: any) => {
        const { type } = statement

        switch (type) {
          case 'SymbolAssignment': {
            return this.#symbolAssignmentHandler(statement, context, 2)
          }
          case 'Directive': {
            const { name } = statement

            switch (name) {
              case EQUIV: {
                return this.#equivHandler(statement, context, 2)
              }
            }
          }
        }
      })

      this.#relocateDataSymbols(context)

      this.#updateLiteralPool(context, memory)

      /* Third pass */

      context.currentSection = textSection

      textSection.entries.forEach((statement: any) => {
        const { type } = statement

        switch (type) {
          case 'Instruction': {
            this.#instructionHandler(statement, context, 3, memory)

            break
          }
          case 'Directive': {
            this.#directiveHandler(statement, context, 3, memory)

            break
          }
        }
      })

      context.currentSection = dataSection

      dataSection.entries.forEach((statement: any) => {
        const { type } = statement

        switch (type) {
          case 'Directive': {
            this.#directiveHandler(statement, context, 3, memory)
          }
        }
      })

      if (!globalSymbols.has(e)) console.warn(`Warning: cannot find entry symbol ${e}, defaulting to 0x${startAddress.toString(16).padStart(8, '0')}`)

      // memory.view()

      return symbolTable.get(e)?.value || 0
    }
  }

  #relocateDataSymbols(context: Context) {
    const { dataSection, textSection, symbolTable } = context
    const offsetDataSection = textSection.locationCounter + textSection.literalPool.length * 4

    dataSection.symbols.forEach((name) => symbolTable.get(name)!.value += offsetDataSection)
  }

  #updateLiteralPool(context: Context, memory: Memory): void {
    const { textSection, symbolTable } = context

    textSection.literalPool.forEach(({ name, symbolName }) => {
      const location = textSection.locationCounter

      symbolTable.get(symbolName)!.value = location

      memory.writeUint32(location, symbolTable.get(name)!.value)

      textSection.locationCounter += 4
    })
  }

  #updateLabels(context: Context): void {
    const { symbolTable, currentSection, currentSymbols } = context

    currentSymbols.forEach(label => symbolTable.get(label)!.value = currentSection.locationCounter)
    context.currentSymbols = []
  }

  #updateSymbolTable(name: string, value: any, context: Context): void {
    const { symbolTable } = context
    const symbolValue = symbolTable.get(name)!.value

    symbolTable.get(name)!.value = evalExpression(value, symbolTable, symbolValue)
  }

  #addToLiteralPool(name: string, context: Context): string {
    const { currentSection, symbolTable } = context
    const symbolName = `${name}_LITERAL`

    currentSection.literalPool.push({ location: 0, name, symbolName })
    currentSection.symbols.add(symbolName)

    symbolTable.set(symbolName, { type: 'literal', value: 0 })

    return symbolName
  }

  #handler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): void | boolean | number => {
    const { type } = statement
    const handler = this.#handlers[type]

    if (!handler) return false

    return handler(statement, context, pass, memory)
  }

  #instructionHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): void | boolean | number => {
    const { opCode, location } = statement
    const handler = this.#instructionHandlers[opCode]

    if(!handler) throw Error('Bad instruction')

    if (pass === 1) {
      const { currentSection } = context
      const { type } = currentSection

      if (type !== 'text') throw Error('Instruction outside of text section')

      const { entries, locationCounter } = currentSection

      this.#updateLabels(context)

      statement.location = locationCounter
      currentSection.locationCounter += 4

      entries.push(statement)

      if (opCode === LDR) handler(statement, context, pass, memory)

      return false
    }

    const instruction = handler(statement, context, pass, memory)

    if(typeof instruction === 'number') memory.writeUint32(location, instruction)
  }

  #directiveHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): void | boolean => {
    const { name } = statement
    const handler = this.#directiveHandlers[name]

    if (!handler) throw Error('Bad directive')

    return handler(statement, context, pass, memory)
  }

  #dataProcessingHandler = (statement: any, context: Context): number => {
    const { rd, rn, i, s, cond, operand2, opCode, location } = statement
    const { symbolTable } = context

    if (operand2.type === 'ImmidiateExpression') operand2.value = evalExpression(operand2, symbolTable, location)

    const { shift } = operand2

    if (shift?.amount) shift.amount = evalExpression(shift.amount, symbolTable, location)

    if (opCode === MOV && operand2.value < 0) {
      operand2.value = Math.abs(operand2.value - 1)

      return dataProcessing({ rd, rn, i, s, cond, operand2, opCode: MVN })
    } else {
      return dataProcessing({ rd, rn, i, s, cond, operand2, opCode })
    }
  }

  #branchHandler = (statement: any, context: Context): number => {
    const { offset: offsetOrValue, cond, l, location } = statement
    const { symbolTable } = context

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

    return b({ offset, cond, l })
  }

  #branchExchangeHandler = (statement: any): number => {
    const { rn, cond } = statement

    return bx({ rn, cond })
  }

  #multiplyHandler = (statement: any): number => {
    const { rd, rn, rs, rm } = statement

    return mul({ rd, rn, rs, rm })
  }

  #softWareInterruptHandler = (statement: any, context: Context): number => {
    const { comment, location } = statement
    const { symbolTable } = context

    return svc({ comment: evalExpression(comment, symbolTable, location) })
  }

  #singleDataTransferHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): number | void | boolean => {
    const { opCode } = statement

    return this.#singleDataTransferHandlers[opCode](statement, context, pass, memory)
  }

  #blockDataTransferHandler = (statement: any): number => {
    const { cond, rn, registerList, p, u, s, w, l } = statement

    return blockDataTransfer({ cond, rn, registerList, p, u, s, w, l })
  }

  #ldrHandler = (statement: any, context: Context, pass: 1 | 2 | 3): number | boolean => {
    const { rd, rn, byteWord, offset, location } = statement
    const { symbolTable } = context

    if (pass === 1) {
      const { offset } = statement

      if (offset?.type === 'LabelExpression') {
        const { value: { name } } = offset

        offset.value.name = this.#addToLiteralPool(name, context)
      }

      return false
    }

    if (offset?.type === 'LabelExpression') {
      const address = evalExpression(offset, symbolTable, location)
      const currentAddress = location + 8
      const delta = address - currentAddress
      const upDown = delta > 1 ? 1 : 0

      return ldr({ rd, rn, i: 1, offset: { type: 'ImmidiateExpression', value: Math.abs(delta) }, u: upDown, b: byteWord })
    } else {
      const { writeBack, prePost, i } = statement

      if (offset.type === 'ImmidiateExpression') {
        offset.value = evalExpression(offset, symbolTable, location)
      } else {
        const { shift } = offset

        if (shift?.amount) shift.amount = evalExpression(shift.amount, symbolTable, location)
      }

      return ldr({ i, rd, rn, offset, b: byteWord, w: writeBack, p: prePost })
    }
  }

  #strHandler = (statement: any, context: Context, pass: 1 | 2 | 3): number => {
    const { opCode, rd, rn, offset, writeBack, prePost, i, location } = statement
    const { symbolTable } = context
    const b = opCode === STRB ? 1 : 0

    if (offset.type === 'ImmidiateExpression') {
      offset.value = evalExpression(offset, symbolTable, location)
    } else {
      const { shift } = offset

      if (shift?.amount) shift.amount = evalExpression(shift.amount, symbolTable, location);
    }

    return str({ i, rd, rn, offset, b, w: writeBack, p: prePost });
  }

  /* Directive handlers */

  #asciiHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): void | boolean => {
    const { currentSection, textSection } = context
    const { type } = currentSection
    const { value } = statement

    if (pass === 1) {
      const { locationCounter, entries } = currentSection

      this.#updateLabels(context)

      statement.location = locationCounter
      currentSection.locationCounter += value.length
      entries.push(statement)

      return false
    }

    const { location } = statement
    const address = location + (type === 'data' ? textSection.locationCounter : 0)

    for (let i = 0, l = value.length; i < l; i++) {
      memory.writeUint8(address + i, value.charCodeAt(i))
    }
  }

  #stringHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): void | boolean => {
    const { currentSection, textSection } = context
    const { type } = currentSection
    const { value } = statement

    if (pass === 1) {
      const { locationCounter, entries } = currentSection

      this.#updateLabels(context)

      statement.location = locationCounter
      currentSection.locationCounter += value.length
      entries.push(statement)

      return false
    }

    const { location } = statement
    const address = location + (type === 'data' ? textSection.locationCounter : 0)

    for (let i = 0, l = value.length; i < l; i++) {
      memory.writeUint8(address + i, value.charCodeAt(i))
    }
  }

  #wordHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): void | boolean => {
    const { currentSection, textSection, symbolTable } = context
    const { type } = currentSection
    const { value } = statement

    if (pass === 1) {
      const { entries, locationCounter } = currentSection

      this.#updateLabels(context)

      statement.location = locationCounter
      currentSection.locationCounter += value.length * 4
      entries.push(statement)

      return false
    }

    const { location } = statement
    const address = location + (type === 'data' ? textSection.locationCounter : 0)

    for (let i = 0; i < value.length; i++) {
      memory.writeUint32(address + i * 4, evalExpression(value[i], symbolTable, address))
    }
  }

  #zeroHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): void | boolean => {
    const { currentSection, textSection } = context
    const { type } = currentSection
    const { value } = statement

    if (pass === 1) {
      const { entries, locationCounter } = currentSection
      this.#updateLabels(context)

      statement.location = locationCounter
      currentSection.locationCounter += value.length
      entries.push(statement)

      return false
    }

    const { location } = statement
    const address = location + (type === 'data' ? textSection.locationCounter : 0)

    for (let i = 0; i < value; i++) {
      memory.writeUint8(address + i, 0)
    }
  }

  #dataHandler = (_statement: any, context: Context): boolean => {
    context.currentSection = context.dataSection

    return false
  }

  #textHandler = (_statement: any, context: Context): boolean => {
    context.currentSection = context.textSection

    return false
  }

  #globalHandler = (statement: any, context: Context): boolean => {
    const { value } = statement

    context.globalSymbols.add(value)

    return false
  }

  #equivHandler = (statement: any, context: Context, pass: 1 | 2 | 3): boolean => {
    const { symbol, value } = statement

    if (pass === 1) {
      const { symbolTable, currentSection } = context

      if (symbolTable.has(symbol)) throw Error(`Symbol ${symbol} already defined`)

      symbolTable.set(symbol, { type: 'constant', value: currentSection.locationCounter })

      return true
    }

    if (pass === 2) {
      this.#updateSymbolTable(symbol, value, context)

      return false
    }

    return false
  }

  #floatHandler = (statement: any, context: Context, pass: 1 | 2 | 3, memory: Memory): void | boolean => {
    const { currentSection, textSection } = context
    const { type } = currentSection
    const { value } = statement

    if (pass === 1) {
      const { locationCounter, entries } = currentSection

      this.#updateLabels(context)

      statement.location = locationCounter
      currentSection.locationCounter += 4
      entries.push(statement)

      return false
    }

    const { location } = statement
    const address = location + (type === 'data' ? textSection.locationCounter : 0)

    memory.writeUint32(address, toIEEE754SinglePrecision(value))

  }

  #labelHandler = (statement: any, context: Context, pass: 1 | 2 | 3): boolean => {
    if (pass === 1) {
      const { name } = statement
      const { symbolTable, currentSection, currentSymbols } = context

      if (!symbolTable.has(name)) {
        currentSymbols.push(name)

        symbolTable.set(name, { type: 'label', value: 0 })

        currentSection.symbols.add(name)
      }
    }

    return false
  }

  #symbolAssignmentHandler = (statement: any, context: Context, pass: 1 | 2 | 3): boolean => {
    const { name, value } = statement

    if (pass === 1) {
      const { symbolTable, currentSection } = context

      symbolTable.set(name, { type: 'constant', value: currentSection.locationCounter })

      return true
    }

    if (pass === 2) {
      this.#updateSymbolTable(name, value, context)

      return false
    }

    return false
  }

  #preProcess(src: string, options?: PreProcessOptions) {
    const { commentIdentifier = ';' } = options || {}
    let current = 0
    let value = ''
    let state = { position: { index: 0, line: 1, column: 1 } }

    while (current < src.length) {
      const result = either(
        map(stringConstant, value => `"${value.value}"`),
        map(multilineComment, () => ''),
        map(comment(commentIdentifier), () => ''),
        map(either(
          not(char(commentIdentifier)),
          not(doubleQuote),
          not(endMultilineComment)
        ),
        value => value.replace(/[ ]+/g, ' '))
      ).parse(src, state)

      if (!result.success) break

      current = result.position.index

      value += result.value

      state.position =  { ...result.position }
    }

    return { success: true, value, ...state }
  }
}