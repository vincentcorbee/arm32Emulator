.global _start

_start:
mov r0, #'H'

stmfd sp!, {r0}   @ Store r0 on the stack

mov r0, #1

ldmfd sp!, {r0}   @ Pop r0 from the stack

mov r7, #1        @ Exit
svc #0
