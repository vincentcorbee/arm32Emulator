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