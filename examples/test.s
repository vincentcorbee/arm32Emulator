.global _start

_start:
ldr r2, =str
ldrb r3, [r2] blaat
ldr r4, =str_length
ldr r5, =error_message_socket
ldrb r6, [r5]

cmp r3, #'H'

beq match

mov r0, #2

end:
  mov r7, #1
  svc #0

match:
  mov r0, #9
  b end

.data
  str: .ascii "Hello, World!\n"
  str_length = . - str

  error_message_socket: .string "Could not create socket\n"
  error_message_socket_len = . - error_message_socket