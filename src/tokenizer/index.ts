import { TokenKind } from './types'
import { isWhiteSpace, isLetter, isDigit } from './utils'

const KeywordSet = new Set(['custom'])

const SeperatorSet = new Set(['[', ']', ','])

class CharStream {
    data: string = ''
    currentPos: number = 0
    constructor(data) {
        this.data = data
    }
    peek(n: number = 0) {
        n = n >= 0 ? n : 0
        return this.data.charAt(this.currentPos + n)
    }
    next(n: number = 1) {
        const oldPos = this.currentPos
        this.currentPos += n
        return this.data.charAt(oldPos)
    }
    isEof() {
        return this.peek() === ''
    }
    isNoEof() {
        return !this.isEof()
    }
}

class Token {
    kind: TokenKind
    text: string = ''
    constructor(kind: TokenKind, text: string) {
        this.kind = kind
        this.text = text
    }
    toString() {
        return `${this.kind}: ${this.text}`
    }
}

class Tokenizer {
    charStream: CharStream
    constructor(charStream: CharStream) {
        this.charStream = charStream
    }
    getAToken() {
        this.skipWhiteSpaces()
        if (this.charStream.isEof()) {
            return new Token(TokenKind.EOF, '')
        }
        let char = this.charStream.peek()
        if (isLetter(char)) {
            return this.parseIdentifier()
        }
        if (SeperatorSet.has(char)) {
            this.charStream.next()
            return new Token(TokenKind.Seperator, char)
        }
        if (char === "'") {
            return this.parseStringLiteral()
        }
        if (isDigit(char)) {
            return this.parseDigitaLiteral()
        }
        throw new Error('词法分析错误')
    }
    skipWhiteSpaces() {
        let char = this.charStream.peek()
        while (isWhiteSpace(char)) {
            this.charStream.next()
            char = this.charStream.peek()
        }
    }
    parseIdentifier() {
        let token = new Token(TokenKind.Identifier, this.charStream.next())
        if (this.charStream.isEof()) {
            return token
        }
        let char = this.charStream.peek()
        while (char === '_' || isLetter(char) || isDigit(char)) {
            token.text += char
            this.charStream.next()
            char = this.charStream.peek()
            if (this.charStream.isEof()) {
                break
            }
        }
        if (KeywordSet.has(token.text)) {
            token.kind = TokenKind.Keyword
        }
        return token
    }
    parseStringLiteral() {
        this.charStream.next()
        let token = new Token(TokenKind.StringLiteral, '')
        let char = this.charStream.peek()
        while (char !== "'") {
            token.text += char
            this.charStream.next()
            if (this.charStream.isEof()) {
                throw new Error(`字符串字面量${token.text}需要一个单引号结尾`)
            }
            char = this.charStream.peek()
        }
        this.charStream.next()
        return token
    }
    parseDigitaLiteral() {
        let token = new Token(TokenKind.DigitaLiteral, this.charStream.next())
        let char = this.charStream.peek()
        while (isDigit(char)) {
            token.text += char
            this.charStream.next()
            char = this.charStream.peek()
        }
        if (
            this.charStream.peek() === '.' &&
            isDigit(this.charStream.peek(2))
        ) {
            token.text += `${this.charStream.peek()}${this.charStream.peek(2)}`
            this.charStream.next(2)
            char = this.charStream.peek()
            while (isDigit(char)) {
                token.text += char
                this.charStream.next()
            }
            return token
        } else {
            return token
        }
    }
}

export { Tokenizer, TokenKind, CharStream, Token }
