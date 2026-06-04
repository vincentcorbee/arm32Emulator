.global _start

.text
_start:
	ldr r0, =list
	ldr r1, =list_length
	ldr r1, [r1]

  ldr r8, [r0]

	push {r0, r1}
	bl sum_array
	pop {r0, r1}

	mov r0, #0
	mov r7, #1
	svc #0

@ args r0 = array, r1 = array length
sum_array:
	@ r1 = array length
	@ r5 = current element
	mov r2, r0		@ array
	mov r0, #0		@ result
	mov r3, #0		@ loop counter
	mov r4, #0		@ byte offset

	b loop_test

	loop_body:
		@ load current element
		ldr r5, [r2, r4]
		@ add to total
		add r0, r0, r5
		@ increment counter
		add r3, r3, #1
		@ increment byte offset
		add r4, r4, #4
	loop_test:
		cmp r3, r1
		blt loop_body
	bx lr

.data
list:
	.word 1,2,3,4,5,6
list_length:
	.word 6
