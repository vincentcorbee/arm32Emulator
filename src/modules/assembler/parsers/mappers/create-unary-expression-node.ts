export const createUnaryExpressionNode = (operator: string, value: any) => {
  return {
    type: 'UnaryExpression',
    operator,
    value
  }
}