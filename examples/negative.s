.global _start
_start:

mov r1, #-9
mov r2, #2
subs r0, r1, r2
sub sp, sp, #4
str r1, [sp]
mov r7, #1
svc #0
