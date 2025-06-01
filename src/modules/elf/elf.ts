import { EI_MAG0, EI_MAG1, EI_MAG2, EI_MAG3, ELFCLASS32, ELFDATA2LSB, EV_CURRENT, EI_NIDENT, ET_EXEC, EM_ARM, E_EHSIZE_32, E_PHENTSIZE_32, E_SHENTSIZE_32 } from "./constants"
import { EIMagic, ELFHeader, ELFProgramHeader, ELFProgram } from "./types"

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