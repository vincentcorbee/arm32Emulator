export const createBinaryExpressionNode = (value: any) => {
  if (!Array.isArray(value)) return value

  return {
    type: 'BinaryExpression',
    left: value[0],
    operator: value[1],
    right: value[2]
  }
}