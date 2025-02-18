ARM7DI

Instruction decoding:

https://developer.arm.com/documentation/ddi0597/2024-12/A32-Instructions-by-Encoding?lang=en

3.4.6 Vector table

| Address     | Exception             | Mode on entry |
|-------------|-----------------------|---------------|
| 0x00000000  | Reset                 | Supervisor    |
| 0x00000004  | Undefined instruction | Undefined     |
| 0x00000008  | Software interrupt    | Supervisor    |
| 0x0000000C  | Abort (prefetch)      | Abort         |
| 0x00000010  | Abort (data)          | Abort         |
| 0x00000014  | -- reserved --        | --            |
| 0x00000018  | IRQ                   | IRQ           |
| 0x0000001C  | FIQ                   | FIQ           |

Grammar

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
  | ImmidiateExpression

ImmidiateExpression :
    ImmidiateExpressionStart ImmidiateExpressionPart

ImmidiateExpressionStart :
    "#"

ImmidiateExpressionPart :
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