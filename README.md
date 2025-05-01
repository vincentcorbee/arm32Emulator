All ARM instructions are 32 bits long.
Instructions are stored word-aligned.

https://developer.arm.com/documentation/dui0473/m/overview-of-the-arm-architecture/arm-and-thumb-instruction-set-overview

Bits 27–25	Instruction TypeExamples
000	Data Processing/Multiply	ADD, SUB, MOV, AND, CMP, MUL
001	Data Processing Immediate	ADD, SUB with immediate value
010	Load/Store Single Data	LDR, STR
011	Undefined	Reserved
100	Load/Store Multiple	LDM, STM
101	Branch	B, BL
110	Coprocessor	MRC, CDP
111	SVC or Exception (Bit 24 = 1)	SVC

ARM7DI

Instruction decoding:

https://developer.arm.com/documentation/ddi0597/2024-12/A32-Instructions-by-Encoding?lang=en

Overflow and carry

https://teaching.idallen.com/dat2343/10f/notes/040_overflow.txt

ELF

https://man7.org/linux/man-pages/man5/elf.5.html

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




https://tc39.es/ecma262/#sec-runtime-semantics-stringnumericvalue