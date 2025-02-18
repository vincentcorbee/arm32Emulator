.global main
.text
main:
ldr r0, =my_space
mov r1, #'H'
strb r1, [r0]
ldrb r2, [r0]

.data
my_space: .zero 4
