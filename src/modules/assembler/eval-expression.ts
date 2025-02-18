function evalBinaryExpression(node: any, symbolTable: any, locationCounter: number): any {
  const { left, operator, right } = node
  const leftValue = evalExpression(left, symbolTable, locationCounter)
  const rightValue = evalExpression(right, symbolTable, locationCounter)

  switch (operator) {
    case '+': return leftValue + rightValue
    case '-': return leftValue - rightValue
    case '*': return leftValue * rightValue
    case '/': return leftValue / rightValue
    case '%': return leftValue % rightValue
    case '&': return leftValue & rightValue
    case '|': return leftValue | rightValue
    case '^': return leftValue ^ rightValue
    case '<<': return leftValue << rightValue
    case '>>': return leftValue >> rightValue
  }
}

export function evalExpression(node: any, symbolTable: any, locationCounter: number): any {
  const { type } = node

  switch (type) {
    case 'BinaryExpression': {
      return evalBinaryExpression(node, symbolTable, locationCounter)
    }
    case 'LabelExpression': {
      const { value: { name } } = node

      if (name === '.') return locationCounter

      if (!symbolTable.has(name)) throw Error(`Unknown symbol ${name}`)

      return symbolTable.get(name).value
    }
    case 'CharacterConstant':
    case 'Number': {
      return node.value
    }
    case 'ImmidiateExpression': {
      return evalExpression(node.value, symbolTable, locationCounter)
    }
    default:
      throw Error(`Unknown expression: ${type}`)
  }
}