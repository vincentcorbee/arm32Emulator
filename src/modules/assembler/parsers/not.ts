import { Parser } from "../../parser-combinators"

export const not = <T = string>(parser: Parser<T>) => new Parser<string>((input, state) => {
  const result = parser.parse(input, { ...state })

  if (result.success) return { success: false, message: `Expected not ${result.value}`, ...state }

  const { position } = result

  const value = input[position.index]

  if (value === '\n') {
    return { success: true, value, position: { column: 1, index: position.index + 1, line: position.line + 1  }  }
  }

  return { success: true, value, position: { ...position, column: position.column + 1, index: position.index + 1  }  }
})