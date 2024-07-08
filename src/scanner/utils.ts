import {SeperatorSet} from './const'

/**
 * 是否是字母
 */
export const isLetter = (ch: string) =>
    (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z");

/**
 * 是否是数字
 */
export const isDigit = (ch: string) => ch >= "0" && ch <= "9";

/**
 * 是否是字母、数字或者下划线
 */
export const isLetterDigitOrUnderScore = (ch: string) =>
    isLetter(ch) || isDigit(ch) || ch === "_";

/**
 * 是否是分隔符
 */
export const isSeperator = (ch: string) => SeperatorSet.has(ch)