/**
 * Unit-тесты password-утилит (hashPassword + verifyPassword).
 * Проверяет хеширование, верификацию и edge cases.
 */

import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../lib/auth/password'

describe('hashPassword', () => {
  it('возвращает строку, отличную от исходного пароля', async () => {
    const hash = await hashPassword('my-secret-password')
    expect(hash).toBeTruthy()
    expect(typeof hash).toBe('string')
    expect(hash).not.toBe('my-secret-password')
  })

  it('генерирует разные хеши для одного пароля (соль)', async () => {
    const hash1 = await hashPassword('password123')
    const hash2 = await hashPassword('password123')
    expect(hash1).not.toBe(hash2)
  })

  it('корректно хеширует пустой пароль', async () => {
    const hash = await hashPassword('')
    expect(hash).toBeTruthy()
    expect(typeof hash).toBe('string')
  })

  it('корректно хеширует длинный пароль', async () => {
    const longPassword = 'a'.repeat(128)
    const hash = await hashPassword(longPassword)
    expect(hash).toBeTruthy()
  })
})

describe('verifyPassword', () => {
  it('возвращает true для правильного пароля', async () => {
    const hash = await hashPassword('correct-password')
    const result = await verifyPassword('correct-password', hash)
    expect(result).toBe(true)
  })

  it('возвращает false для неправильного пароля', async () => {
    const hash = await hashPassword('correct-password')
    const result = await verifyPassword('wrong-password', hash)
    expect(result).toBe(false)
  })

  it('возвращает false для пустого пароля против непустого хеша', async () => {
    const hash = await hashPassword('some-password')
    const result = await verifyPassword('', hash)
    expect(result).toBe(false)
  })
})
