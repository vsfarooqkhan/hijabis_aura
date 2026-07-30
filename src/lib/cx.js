import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** clsx + tailwind-merge, so a later class always wins over an earlier one. */
export const cx = (...args) => twMerge(clsx(args))

export default cx
