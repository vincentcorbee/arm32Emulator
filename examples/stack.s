.global _start

.text
_start:

/*
int main (void)
{
	int result = mul(1, 2, 3, 4, 5);

	return 0;
}

int mul (int a, int b, int c, int d, int e)
{
  return a * b * c * d * e;
}
*/

@ int main(void)
main:
	@ push return address to the stack
	push {lr}

	@ reserve space on stack
	sub sp, sp, #4

	@ store fifth argument on the stack
	mov r0, #5
	str r0, [sp]

	@ load remaining arguments into registers r0 - r3
	mov r0, #1
	mov r1, #2
	mov r2, #3
	mov r3, #4

	@ 1 * 2 * 3 * 4 * 5
	bl mul

	@ reset stack pointer
	add sp, sp, #4

	@ pop return address of the stack
	pop {lr}

	@ store return value into r0
	mov r0, #0

	@ Exit program
	mov r7, #1
	svc #0

@ int mul(int a, int b, int c, int d, int e)
mul:
	@ multiply first four arguments
	mul r0, r0, r1
	mul r0, r0, r2
	mul r0, r0, r3

	@ get fifth argument from the stack
	ldr r1, [sp]

	@ multiply fifth argument
	mul r0, r0, r1

	@ branch back to return address
	bx lr
