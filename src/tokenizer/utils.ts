export const isWhiteSpace = (char: string) => [' ', '\n', '\t'].includes(char)
export const isLetter = (char: string) =>
    (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')
export const isDigit = (char: string) => char >= '0' && char <= '9'
