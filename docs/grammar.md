# Assembly Grammar

The grammar below describes what the assembler accepts. It is enforced by the parser
combinators in [`src/modules/assembler/parsers/`](../src/modules/assembler/parsers).
When extending the syntax, update this file alongside the parsers.

## Lexical notes

- Comments are stripped by the pre-processor before parsing:
  - `@ ...` single-line (comment character is configured per CPU type; `@` for arm7di)
  - `/* ... */` multi-line
- All keywords are matched case-insensitively: mnemonics, condition codes, shift types,
  register names, directive names, and the `0x` / `0b` number prefixes.
- `Whitespace` is one or more spaces or tabs. `NewLine` is `\n`.

## Grammar

```
Program :
    Statements

Statements :
    Statement
  | Statement Statements

Statement :
    Label* (Instruction | Directive | SymbolAssignment)? NewLine+

Label :
    Symbol ":"

SymbolAssignment :
    Symbol "=" Expression

Directive :
    DataDirective
  | TextDirective
  | GlobalDirective
  | AsciiDirective
  | StringDirective
  | WordDirective
  | FloatDirective
  | ZeroDirective
  | EquivDirective

DataDirective :
    ".data"

TextDirective :
    ".text" (Whitespace StringConstant)?

GlobalDirective :
    ".global" Whitespace Symbol

AsciiDirective :
    ".ascii" Whitespace StringConstant

StringDirective :
    ".string" Whitespace StringConstant

WordDirective :
    ".word" Whitespace Expression ("," Expression)*

FloatDirective :
    ".float" Whitespace [+-]? [0-9]+ ("." [0-9]+)? (("e" | "E") [+-]? [0-9]+)?

ZeroDirective :
    ".zero" Whitespace Expression

EquivDirective :
    ".equiv" Whitespace Symbol "," Expression

Instruction :
    DataProcessingInstruction
  | MultiplyInstruction
  | SingleDataTransferInstruction
  | BlockDataTransferInstruction
  | StackTransferInstruction
  | BranchInstruction
  | BranchExchangeInstruction
  | SupervisorCallInstruction

DataProcessingInstruction :
    ("MOV" | "MVN" | "CMP") Whitespace Register "," Operand2
  | ("ADD" | "SUB") SFlag? Condition? Whitespace Register "," Register "," Operand2

MultiplyInstruction :
    "MUL" Condition? SFlag? Whitespace Register "," Register "," Register

SingleDataTransferInstruction :
    "LDR" "B"? Whitespace Register "," (AddressExpression | OffsetAddressing)
  | "STR" Condition? "B"? "T"? Whitespace Register "," OffsetAddressing

BlockDataTransferInstruction :
    ("LDM" | "STM") Condition? StackMode Whitespace Register "!"? "," "{" RegisterList "}"

StackMode :
    "FD" | "ED" | "FA" | "EA" | "IA" | "IB" | "DA" | "DB"

StackTransferInstruction :
    ("PUSH" | "POP") Condition? Whitespace "{" RegisterList "}"

BranchInstruction :
    ("B" | "BL") Condition? Whitespace LabelExpression

BranchExchangeInstruction :
    "BX" Condition? Whitespace Register

SupervisorCallInstruction :
    "SVC" Whitespace ImmediateExpression

SFlag :
    "S"

Condition :
    "EQ" | "NE" | "CS" | "CC" | "MI" | "PL" | "VS" | "VC"
  | "HI" | "LS" | "GE" | "LT" | "GT" | "LE" | "AL"

Operand2 :
    ImmediateExpression
  | Register Shift?

Shift :
    "," ShiftType (ImmediateExpression | Register)

ShiftType :
    "LSL" | "LSR" | "ASR" | "ROR"

AddressExpression :
    "=" Expression

OffsetAddressing :
    "[" Register ("," ImmediateExpression)? "]" "!"?                      -- pre-indexed, immediate offset
  | "[" Register "," Register ("," "LSL" ImmediateExpression)? "]" "!"?   -- pre-indexed, register offset
  | "[" Register "]" "," ImmediateExpression                              -- post-indexed, immediate offset
  | "[" Register "]" "," Register Shift?                                  -- post-indexed, register offset

RegisterList :
    RegisterListItem ("," RegisterListItem)*

RegisterListItem :
    Register
  | Register "-" Register

ImmediateExpression :
    "#" Expression

Expression :
    AdditiveExpression

AdditiveExpression :
    BitwiseExpression (("+" | "-") BitwiseExpression)*

BitwiseExpression :
    ShiftExpression (("|" | "&" | "^" | "!") ShiftExpression)*

ShiftExpression :
    MultiplicativeExpression (("<<" | ">>") MultiplicativeExpression)*

MultiplicativeExpression :
    UnaryExpression (("*" | "/" | "%") UnaryExpression)*

UnaryExpression :
    ("-" | "~")? PrimaryExpression

PrimaryExpression :
    Number
  | LabelExpression
  | CharacterConstant
  | ParenthesizedExpression

ParenthesizedExpression :
    "(" Expression ")"

CharacterConstant :
    "'" [^'] "'"

StringConstant :
    "\"" [^"]* "\""

Number :
    Hexadecimal
  | Binary
  | Decimal

Hexadecimal :
    "0x" [0-9A-Fa-f]+

Binary :
    "0b" [01]+

Decimal :
    [0-9]+

Register :
    "R0" | "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "R7"
  | "R8" | "R9" | "R10" | "R11" | "R12" | "R13" | "R14" | "R15"
  | "PC" | "LR" | "SP" | "FP"

LabelExpression :
    Symbol

Symbol :
    SymbolStart SymbolPart*

SymbolStart :
    [a-zA-Z_.]

SymbolPart :
    [a-zA-Z0-9_$]
```

## Operator precedence

From lowest to highest (parsers nest outermost → innermost):

1. `+` `-`         (additive)
2. `|` `&` `^` `!` (bitwise)
3. `<<` `>>`       (shift)
4. `*` `/` `%`     (multiplicative)
5. `-` `~`         (unary prefix)

So `1 + 2 * 3` parses as `1 + (2 * 3)`, and `a | b & c` as `(a | b) & c` (same precedence level,
left-associative).

## Notes / limitations

- `MOV`, `MVN`, `CMP`, `LDR`, and `SVC` do not accept a `{cond}` suffix in the current parsers.
  Branch and most transfer / arithmetic instructions do.
- The `T` flag on `LDR` is accepted only on `STR` in the parser.
- `LDM` / `STM` stack-mode suffix (one of `FD|ED|FA|EA|IA|IB|DA|DB`) is **required**, not optional.
- The `^` suffix (PSR / force user mode) on `LDM` / `STM` register lists is not yet implemented.
