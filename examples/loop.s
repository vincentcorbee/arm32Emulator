.global _start

.equiv EXIT, 1
.equiv WRITE, 4

_start:
  ldr r1, =str          @ Load the address of the string into r1
  ldr r2, =str_length   @ Load the length of the string into r2
  mov r3, #0

loop:
  cmp r3, r2
  bge end

  ldrb r0, [r1, r3]

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
