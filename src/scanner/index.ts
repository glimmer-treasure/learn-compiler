/**
 * 词法分析器
 * @version 0.0.1
 * @author glimmer.treasure
 * @since 2024-07-07
 *
 * 缺失的特性：
 * 1.不支持Unicode；
 * 2.不支持二进制、八进制、十六进制
 * 3.不支持转义
 * 4.字符串只支持双引号
 */

import { KeyWordSet, WhiteSpaceCharSet } from './const'
import {
    isLetter,
    isLetterDigitOrUnderScore,
    isSeperator,
    isDigit,
} from './utils'

// Token类型
export enum TokenKind {
    KeyWord,
    Identifier,
    StringLiteral,
    IntegerLiteral,
    DecimalLiteral,
    NullLiteral,
    BooleanLiteral,
    Seperator,
    Operator,
    EOF,
}

// 代表一个Token的数据结构
export interface Token {
    kind: TokenKind
    text: string
}

/**
 * 一个字符串流。其操作为：
 * peek():预读下一个字符，但不移动指针；
 * next():读取下一个字符，并且移动指针；
 * eof():判断是否已经到了结尾。
 */
export class CharStream {
    data: String = ''
    pos: number = 0
    line: number = 1
    col: number = 0

    constructor(data: string) {
        this.data = data
    }

    peek(): string {
        return this.data.charAt(this.pos)
    }

    next(): string {
        let ch = this.data.charAt(this.pos)
        this.pos += 1
        if (ch == '\n') {
            this.line += 1
            this.col = 0
        } else {
            this.col += 1
        }
        return ch
    }

    isEof(): boolean {
        return this.peek() === ''
    }

    isNotEof(): boolean {
        return !this.isEof()
    }
}

/**
 * 词法分析器。
 * 词法分析器的接口像是一个流，词法解析是按需进行的。
 * 支持下面两个操作：
 * next(): 返回当前的Token，并移向下一个Token。
 * peek(): 预读当前的Token，但不移动当前位置。
 * peek2(): 预读第二个Token。
 */
export class Scanner {
    tokens: Array<Token> = new Array<Token>() //采用一个array，能预存多个Token.
    stream: CharStream

    constructor(stream: CharStream) {
        this.stream = stream
    }

    /**
     * 跳过空白字符
     */
    private skipWhiteSpaces() {
        while (WhiteSpaceCharSet.has(this.stream.peek())) {
            this.stream.next()
        }
    }

    /**
     * 跳过多行注释
     */
    private skipMultipleLineComments() {
        //跳过*，/之前已经跳过去了。
        let ch1 = this.stream.next()
        while (!this.stream.isEof()) {
            let ch2 = this.stream.next()
            if (ch1 === '*' && ch2 === '/') {
                return
            }
            ch1 = ch2
        }
        //如果没有匹配上，报错。
        console.error(
            "Failed to find matching */ for multiple line comments at ': " +
                this.stream.line +
                ' col: ' +
                this.stream.col,
        )
    }

    /**
     * 跳过多行注释
     */
    private skipSingleLineComment() {
        //跳过第二个/，第一个之前已经跳过去了。
        this.stream.next()
        while (this.stream.isNotEof() && this.stream.peek() !== '\n') {
            this.stream.next()
        }
    }

    /**
     * 解析标识符，标识符和关键字统一用此方法解析
     */
    private parseIdentifer() {
        let token: Token = { kind: TokenKind.Identifier, text: '' }
        //第一个字符不用判断，因为在调用者那里已经判断过了
        token.text += this.stream.next()
        //读入后序字符
        while (
            !this.stream.isEof() &&
            isLetterDigitOrUnderScore(this.stream.peek())
        ) {
            token.text += this.stream.next()
        }

        if (token.text === 'null') {
            token.kind = TokenKind.NullLiteral
        } else if (['true', 'false'].includes(token.text)) {
            token.kind = TokenKind.BooleanLiteral
        } else if (KeyWordSet.has(token.text)) {
            //识别出关键字（从字典里查，速度会比较快）
            token.kind = TokenKind.KeyWord
        }
        return token
    }

    private parseStringLiteral() {
        let token: Token = { kind: TokenKind.StringLiteral, text: '' }
        //第一个字符不用判断，因为在调用者那里已经判断过了
        this.stream.next()
        while (!this.stream.isEof() && this.stream.peek() !== '"') {
            token.text += this.stream.next()
        }
        if (this.stream.peek() === '"') {
            this.stream.next()
        } else {
            console.error(
                'Expecting an " at line: ' +
                    this.stream.line +
                    ' col: ' +
                    this.stream.col,
            )
        }
        return token
    }

    //从字符串流中获取一个新Token。
    private getAToken(): Token {
        this.skipWhiteSpaces()
        if (this.stream.isEof()) {
            return { kind: TokenKind.EOF, text: '' }
        } else {
            let ch = this.stream.peek()
            if (isLetter(ch) || ch === '_') {
                return this.parseIdentifer()
            } else if (ch === '"') {
                return this.parseStringLiteral()
            } else if (isSeperator(ch)) {
                this.stream.next()
                return { kind: TokenKind.Seperator, text: ch }
            } else if (isDigit(ch)) {
                this.stream.next()
                let ch1 = this.stream.peek()
                let literal: string = ''
                if (ch === '0') {
                    if (!(ch1 >= '1' && ch1 <= '9')) {
                        literal = '0'
                    } else {
                        console.log(
                            '0 cannot be followed by other digit now, at line: ' +
                                this.stream.line +
                                ' col: ' +
                                this.stream.col,
                        )
                    }
                } else if (ch >= '1' && ch <= '9') {
                    literal += ch
                    while (isDigit(ch1)) {
                        ch = this.stream.next()
                        literal += ch
                        ch1 = this.stream.peek()
                    }
                }
                if (ch1 === '.') {
                    literal += '.'
                    this.stream.next()
                    ch1 = this.stream.peek()
                    while (isDigit(ch1)) {
                        ch = this.stream.next()
                        literal += ch
                        ch1 = this.stream.peek()
                    }
                    return { kind: TokenKind.DecimalLiteral, text: literal }
                } else {
                    //返回一个整型直面量
                    return { kind: TokenKind.IntegerLiteral, text: literal }
                }
            } else if (ch === '.') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (isDigit(ch1)) {
                    let literal = '.'
                    while (isDigit(ch1)) {
                        ch = this.stream.next()
                        literal += ch
                        ch1 = this.stream.peek()
                    }
                    return { kind: TokenKind.DecimalLiteral, text: literal }
                } else if (ch1 === '.') {
                    // 解析省略号 ‘...’
                    this.stream.next()
                    ch1 = this.stream.peek()
                    if (ch1 == '.') {
                        return { kind: TokenKind.Seperator, text: '...' }
                    } else {
                        console.error('Unrecognized pattern : .., missed a . ?')
                        return this.getAToken()
                    }
                } else {
                    //.号分隔符
                    return { kind: TokenKind.Seperator, text: '.' }
                }
            } else if (ch === '/') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '*') {
                    this.skipMultipleLineComments()
                    return this.getAToken()
                } else if (ch1 === '/') {
                    this.skipSingleLineComment()
                    return this.getAToken()
                } else if (ch1 === '=') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '/=' }
                } else {
                    return { kind: TokenKind.Operator, text: '/' }
                }
            } else if (ch === '+') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '+') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '++' }
                } else if (ch1 === '=') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '+=' }
                } else {
                    return { kind: TokenKind.Operator, text: '+' }
                }
            } else if (ch === '-') {
                this.stream.next()
                let ch1 = this.stream.peek()
                switch (ch1) {
                    case '-':
                        this.stream.next()
                        return { kind: TokenKind.Operator, text: '--' }
                    case '=':
                        this.stream.next()
                        return { kind: TokenKind.Operator, text: '-=' }
                    default:
                        return { kind: TokenKind.Operator, text: '-' }
                }
            } else if (ch === '*') {
                this.stream.next()
                let ch1 = this.stream.peek()
                switch (ch1) {
                    case '=':
                        this.stream.next()
                        return { kind: TokenKind.Operator, text: '*=' }
                    default:
                        return { kind: TokenKind.Operator, text: '*' }
                }
            } else if (ch === '%') {
                this.stream.next()
                let ch1 = this.stream.peek()
                switch (ch1) {
                    case '=':
                        this.stream.next()
                        return { kind: TokenKind.Operator, text: '%=' }
                    default:
                        return { kind: TokenKind.Operator, text: '%' }
                }
            } else if (ch === '>') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '=') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '>=' }
                } else if (ch1 === '>') {
                    this.stream.next()
                    let ch2 = this.stream.peek()
                    if (ch2 === '>') {
                        this.stream.next()
                        let ch3 = this.stream.peek()
                        if (ch3 === '=') {
                            this.stream.next()
                            return { kind: TokenKind.Operator, text: '>>>=' }
                        } else {
                            return { kind: TokenKind.Operator, text: '>>>' }
                        }
                    } else if (ch2 === '=') {
                        this.stream.next()
                        return { kind: TokenKind.Operator, text: '>>=' }
                    } else {
                        return { kind: TokenKind.Operator, text: '>>' }
                    }
                } else {
                    return { kind: TokenKind.Operator, text: '>' }
                }
            } else if (ch === '<') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '=') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '<=' }
                } else if (ch1 === '<') {
                    this.stream.next()
                    let ch2 = this.stream.peek()
                    if (ch2 === '=') {
                        this.stream.next()
                        return { kind: TokenKind.Operator, text: '<<=' }
                    } else {
                        return { kind: TokenKind.Operator, text: '<<' }
                    }
                } else {
                    return { kind: TokenKind.Operator, text: '<' }
                }
            } else if (ch === '=') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '=') {
                    this.stream.next()
                    let ch2 = this.stream.peek()
                    if (ch2 === '=') {
                        this.stream.next()
                        return { kind: TokenKind.Operator, text: '===' }
                    } else {
                        return { kind: TokenKind.Operator, text: '==' }
                    }
                } else if (ch1 === '>') {
                    // 箭头=>
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '=>' }
                } else {
                    return { kind: TokenKind.Operator, text: '=' }
                }
            } else if (ch === '!') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '=') {
                    this.stream.next()
                    let ch2 = this.stream.peek()
                    if (ch2 === '=') {
                        this.stream.next()
                        return { kind: TokenKind.Operator, text: '!==' }
                    } else {
                        return { kind: TokenKind.Operator, text: '!=' }
                    }
                } else {
                    return { kind: TokenKind.Operator, text: '!' }
                }
            } else if (ch === '|') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '|') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '||' }
                } else if (ch1 === '=') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '|=' }
                } else {
                    return { kind: TokenKind.Operator, text: '|' }
                }
            } else if (ch === '&') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '&') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '&&' }
                } else if (ch1 === '=') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '&=' }
                } else {
                    return { kind: TokenKind.Operator, text: '&' }
                }
            } else if (ch === '^') {
                this.stream.next()
                let ch1 = this.stream.peek()
                if (ch1 === '=') {
                    this.stream.next()
                    return { kind: TokenKind.Operator, text: '^=' }
                } else {
                    return { kind: TokenKind.Operator, text: '^' }
                }
            } else if (ch === '~') {
                this.stream.next()
                return { kind: TokenKind.Operator, text: '~' }
            } else {
                //暂时去掉不能识别的字符
                console.error(
                    "Unrecognized pattern meeting ': " +
                        ch +
                        "', at" +
                        this.stream.line +
                        ' col: ' +
                        this.stream.col,
                )
                this.stream.next()
                return this.getAToken()
            }
        }
    }

    next(): Token {
        let t: Token | undefined = this.tokens.shift()
        if (typeof t == 'undefined') {
            return this.getAToken()
        } else {
            return t
        }
    }

    peek(): Token {
        let t: Token | undefined = this.tokens[0]
        if (typeof t == 'undefined') {
            t = this.getAToken()
            this.tokens.push(t)
        }
        return t
    }

    peek2(): Token {
        let t: Token | undefined = this.tokens[1]
        while (typeof t == 'undefined') {
            this.tokens.push(this.getAToken())
            t = this.tokens[1]
        }
        return t
    }
}
