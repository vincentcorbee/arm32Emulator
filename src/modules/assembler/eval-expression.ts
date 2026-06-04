function evalBinaryExpression(node: any, symbolTable: any, locationCounter: number): any {
  const { left, operator, right } = node;
  const leftValue = evalExpression(left, symbolTable, locationCounter);
  const rightValue = evalExpression(right, symbolTable, locationCounter);

  switch (operator) {
    case '+':
      return leftValue + rightValue;
    case '-':
      return leftValue - rightValue;
    case '*':
      return leftValue * rightValue;
    case '/':
      return leftValue / rightValue;
    case '%':
      return leftValue % rightValue;
    case '&':
      return leftValue & rightValue;
    case '|':
      return leftValue | rightValue;
    case '^':
      return leftValue ^ rightValue;
    case '<<':
      return leftValue << rightValue;
    case '>>':
      return leftValue >> rightValue;
  }
}

function evalUnaryExpression(node: any, symbolTable: any, locationCounter: number): any {
  const { operator, value } = node;
  const argumentValue = evalExpression(value, symbolTable, locationCounter);

  switch (operator) {
    case '+':
      return +argumentValue;
    case '-':
      return -argumentValue;
    case '~':
      return ~argumentValue;
  }
}

export function evalExpression(node: any, symbolTable: any, locationCounter: number): any {
  const { type } = node;

  switch (type) {
    case 'BinaryExpression': {
      return evalBinaryExpression(node, symbolTable, locationCounter);
    }
    case 'UnaryExpression': {
      return evalUnaryExpression(node, symbolTable, locationCounter);
    }
    case 'LabelExpression': {
      const {
        value: { name },
      } = node;

      if (name === '.') return locationCounter;

      if (!symbolTable.has(name)) throw Error(`Unknown symbol ${name}`);

      return symbolTable.get(name).value;
    }
    case 'CharacterConstant':
    case 'Number': {
      return node.value;
    }
    case 'ImmediateExpression': {
      return evalExpression(node.value, symbolTable, locationCounter);
    }
    default:
      throw Error(`Unknown expression: ${type}`);
  }
}
