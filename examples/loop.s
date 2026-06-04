.global _start

.equiv EXIT, 1          @ syscall number for exit
.equiv WRITE, 4         @ syscall number for write

_start:
  ldr r1, =str          @ Load the address of the string into r1
  ldr r2, =str_length   @ Load the length of the string into r2
  mov r3, #0
  mov r4, #'\n'         @ Set r4 to the newline character

loop:
  cmp r3, r2
  bge end

  push {r1, r2}
  sub sp, sp, #2

  ldrb r0, [r1, r3]
  strb r0, [sp]
  strb r4, [sp, #1]

  mov r0, #1
  mov r1, sp
  mov r2, #2
  mov r7, #WRITE
  svc #0

  add sp, sp, #2
  pop {r1, r2}

  add r3, r3, #1
  b loop

end:
  mov r0, #1
  ldr r1, =out_message
  ldr r2, =out_message_length
  mov r7, #WRITE
  svc #0

  mov r0, #0
  mov r7, #EXIT
  svc #0

.data
str: .ascii "Hello, World!\n"
str_length = . - str

out_message: .ascii "Goodbye, World!\n"
out_message_length = . - out_message
