import { Tokenizer, CharStream, TokenKind, Token } from './tokenizer/index'

type Config = {
    tokenize?: boolean
}

const compiler = (sourceCode: string, config: Config) => {
    const charStream = new CharStream(sourceCode)
    if (config.tokenize) {
        const tokenizer = new Tokenizer(charStream)
        let tokens = []
        while (true) {
            let token = tokenizer.getAToken()
            tokens.push(token)
            if (token.kind === TokenKind.EOF) {
                break
            }
        }
        const str = tokens.reduce((prev, cur) => {
            prev += `${cur.kind}: ${cur.text}\n`
            return prev
        }, '')
        console.log(str)
    }
}

const tokenize = (sourceCode: string) => {
    const charStream = new CharStream(sourceCode)
    const tokenizer = new Tokenizer(charStream)
    let tokens: Array<Token> = []
    while (true) {
        let token = tokenizer.getAToken()
        tokens.push(token)
        if (token.kind === TokenKind.EOF) {
            break
        }
    }
    return tokens
}

export { Tokenizer, CharStream, TokenKind, Token, compiler, tokenize }
