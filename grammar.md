#Grammar

Program :
    Statements

Statements :
    Statement
  | Statement Statements

Statement :
    Label? Instruction NewLine
  | Label? Directive NewLine
  | Label NewLine

Directive :
    DataDirective
  | AsciiDirective
  | TextDirective
  | GlobalDirective
  | SymbolAssignment

Label :
    Symbol ":"

Instruction :
    MoveInstruction
  | BranchInstruction

MoveInstruction :
    MoveOpcode Register Operand

BranchInstruction :
    BranchOpCode LabelExpression

BranchOpCode :
    "B"
  | "b"

MoveOpCode :
    "MOV"
  | "mov"

Operand :
    Register
  | ImmediateExpression

ImmediateExpression :
    ImmediateExpressionStart ImmediateExpressionPart

ImmediateExpressionStart :
    "#"

ImmediateExpressionPart :
    Expression

Expression :
    IntegerExpression

IntegerExpression :
    MultiplicativeExpression

MultiplicativeExpression :
    ShiftExpression
  | ShiftExpression "*" MultiplicativeExpression
  | ShiftExpression "/" MultiplicativeExpression
  | ShiftExpression "%" MultiplicativeExpression

ShiftExpression :
    BinaryExpression
  | BinaryExpression "<<" ShiftExpression
  | BinaryExpression ">>" ShiftExpression

BinaryExpression :
    UnaryExpression
  | UnaryExpression "&" BinaryExpression
  | UnaryExpression "|" BinaryExpression
  | UnaryExpression "^" BinaryExpression

UnaryExpression :
    AdditiveExpression
  | "-" AdditiveExpression
  | "~" AdditiveExpression

AdditiveExpression :
    PrimaryExpression
  | AdditiveExpression "+" PrimaryExpression
  | AdditiveExpression "-" PrimaryExpression

PrimaryExpression :
    Number
  | LabelExpression
  | CharacterConstant
  | ParenthesizedExpression

CharacterConstant :
    "'" [^'] "'"


ParenthesizedExpression :
    "(" Expression ")"

Number :
    Hexadecimal
  | Decimal

Hexadecimal :
    "0x" [0-9A-Fa-f]+

Decimal :
    [0-9]+

Register :
    GeneralPurposeRegister
  | SpecialRegister

GeneralPurposeRegister :
    RegisterNamePrefix RegisterNumber

RegisterNamePrefix :
    "R"
  | "r"

RegisterNumber :
    [0-15]

SpecialPurposeRegister
    ProgramCounter
  | LinkRegister
  | FramePointer
  | StackPointer
  | IntraProceduralCall

LabelExpression :
    LabelName

LabelName :
    Symbol

Symbol :
    SymbolStart
  | SymbolStart SymbolPart

SymbolStart :
    [a-zA-Z_.$]

Symbol :
    [a-zA-Z0-9_.$]*
