export const ET_REL = 1; // Relocatable file
export const ET_EXEC = 2; // Executable file

export const EV_CURRENT = 1; // Current version
export const ELFDATA2LSB = 1; // Little-endian data alignment
export const ELFCLASS32 = 1; // 32-bit objects
export const EI_NIDENT = 0x10; // Size of e_ident[]

export const E_EHSIZE_32 = 0x34; // ELF header size
export const E_PHENTSIZE_32 = 0x20; // Program header table entry size 32 bit
export const E_SHENTSIZE_32 = 0x28; // Section header table entry size 32 bit

export const PT_LOAD = 1; // Loadable segment

export const EM_ARM = 0x28; // ARM architecture

export const PF_NONE = 0; // All access denied    All access denied
export const PF_X = 1; // Execute only	        Read, execute
export const PF_W = 2; // Write only	          Read, write, execute
export const PF_WX = 3; // Write, execute	      Read, write, execute
export const PF_R = 4; // Read only            Read, execute
export const PF_RX = 5; // Read, execute        Read, execute
export const PF_RW = 6; // Read, write          Read, write, execute
export const PF_RWX = 7; // Read, write execute  Read, write, execute

export const EI_MAG0 = 0x7f;
export const EI_MAG1 = 0x45;
export const EI_MAG2 = 0x4c;
export const EI_MAG3 = 0x46;
