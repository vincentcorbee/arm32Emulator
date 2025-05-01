export const ET_REL = 1               // Relocatable file
export const ET_EXEC = 2              // Executable file

export const EV_CURRENT = 1           // Current version
export const ELFDATA2LSB = 1          // Little-endian data alignment
export const ELFCLASS32 = 1           // 32-bit objects
export const EI_NIDENT = 0x10         // Size of e_ident[]

export const E_EHSIZE_32 = 0x34       // ELF header size
export const E_PHENTSIZE_32 = 0x20    // Program header table entry size 32 bit
export const E_SHENTSIZE_32 = 0x28    // Section header table entry size 32 bit

export const PT_LOAD = 1              // Loadable segment

export const EM_ARM = 0x28            // ARM architecture

export const PF_NONE = 0	            // All access denied    All access denied
export const PF_X =	1	                // Execute only	        Read, execute
export const PF_W	= 2	                // Write only	          Read, write, execute
export const PF_WX = 3	              // Write, execute	      Read, write, execute
export const PF_R	= 4	                // Read only            Read, execute
export const PF_RX	= 5	              // Read, execute        Read, execute
export const PF_RW	= 6	              // Read, write          Read, write, execute
export const PF_RWX	= 7               // Read, write execute  Read, write, execute

export const EI_MAG0 = 0x7f
export const EI_MAG1 = 0x45
export const EI_MAG2 = 0x4c
export const EI_MAG3 = 0x46

export type ELFMag0 = 0x7f
export type ELFMag1 = 0x45
export type ELFmag2 = 0x4c
export type ELFmag3 = 0x46

export type ELFClass32 = 1
export type EIClass = ELFClass32

export type ELFData2Lsb = 1
export type ELFData2Msb = 1
export type EIData = ELFData2Lsb | ELFData2Msb

export type ETRel = 1
export type ETExec = 2
export type EType = ETRel | ETExec

export type EVCurrent = 1
export type EIVersion = EVCurrent

export type EINident = 0x10

export type EIMagic = [ELFMag0, ELFMag1, ELFmag2, ELFmag3]
export type EIdent = {
  magic: EIMagic
  class: EIClass
  data: EIData
  version: EIVersion
  pad: number
  ident: EINident
}

export type EMArm = 0x28
export type EMachine = EMArm

export type ELFHeader = {
  e_ident: EIdent
  e_type: EType
  e_machine: EMachine
  e_version: EIVersion
  e_entry: number
  e_phoff: number
  e_shoff: number
  e_flags: number
  e_ehsize: number
  e_phentsize: number
  e_phnum: number
  e_shentsize: number
  e_shnum: number
  e_shstrndx: number
}

export type PTLoad = 1
export type PType = PTLoad

export type PFlagsNone = 0
export type PFlagsX = 1
export type PFlagsW = 2
export type PFlagsWX = 3
export type PFlagsR = 4
export type PFlagsRX = 5
export type PFlagsRW = 6
export type PFlagsRWX = 7
export type PFlags = PFlagsNone | PFlagsX | PFlagsW | PFlagsWX | PFlagsR | PFlagsRX | PFlagsRW | PFlagsRWX

export type ELF32ProgramHeader = {
  p_type: PType
  p_offset: number
  p_vaddr: number
  p_paddr: number
  p_filesz: number
  p_memsz: number
  p_flags: PFlags
  p_align: number
}

export type ELFProgramHeader = ELF32ProgramHeader

export type ELFProgram = {
  segments: any[]
}

export class ELF {
  static ELFMag: EIMagic = [EI_MAG0, EI_MAG1, EI_MAG2, EI_MAG3]

  #header: ELFHeader
  #programHeaderTable: ELFProgramHeader[]

  constructor(program: ELFProgram) {
    this.#header = {
      e_ident: {
        magic: ELF.ELFMag,
        class: ELFCLASS32,
        data: ELFDATA2LSB,
        version: EV_CURRENT,
        pad: 0,
        ident: EI_NIDENT
      },
      e_type: ET_EXEC,
      e_machine: EM_ARM,
      e_version: EV_CURRENT,
      e_entry: 0,
      e_phoff: 0,
      e_shoff: 0,
      e_flags: 0,
      e_ehsize: E_EHSIZE_32,
      e_phentsize: E_PHENTSIZE_32,
      e_phnum: 0,
      e_shentsize: E_SHENTSIZE_32,
      e_shnum: 0,
      e_shstrndx: 0
    }

    this.#programHeaderTable = []
  }

  write(): ArrayBuffer {
    const buffer = new ArrayBuffer(0)

    return buffer
  }
}