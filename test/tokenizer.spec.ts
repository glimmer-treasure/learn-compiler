import { it, expect } from 'vitest'
import {
    Tokenizer,
    CharStream,
    TokenKind,
    compiler,
    tokenize,
} from 'validation-engine'

it('测试token解析是否正常', () => {
    const tokens = tokenize('[required,custom[positiveInt], min[0], max[100]]')
    expect(tokens.length).toBe(19)
})
