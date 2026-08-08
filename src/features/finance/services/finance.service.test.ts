import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAppError } from '@/core/error'

import { financeRepository } from '../repositories/finance.repository'
import type { DebtValues, RecurringValues } from '../schemas/finance.schema'
import { financeService } from './finance.service'

/**
 * El repositorio se sustituye por completo: estos tests comprueban **reglas de
 * negocio**, no consultas. Con la factoría, el módulo real ni siquiera se carga,
 * así que no arrastra el cliente de Supabase (ni sus variables de entorno).
 */
vi.mock('../repositories/finance.repository', () => ({
  financeRepository: {
    listAccounts: vi.fn(),
    listCategories: vi.fn(),
    listTransactionsBetween: vi.fn(),
    insertAccount: vi.fn(),
    listDebts: vi.fn(),
    listDebtPayments: vi.fn(),
    listBudgets: vi.fn(),
    upsertBudget: vi.fn(),
    deleteBudget: vi.fn(),
    listRecurring: vi.fn(),
    insertRecurring: vi.fn(),
    updateRecurring: vi.fn(),
    softDeleteRecurring: vi.fn(),
    insertDebt: vi.fn(),
    updateDebt: vi.fn(),
    softDeleteDebt: vi.fn(),
    setDebtSettled: vi.fn(),
    insertCategory: vi.fn(),
    archiveCategory: vi.fn(),
    archiveAccount: vi.fn(),
    insertTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    softDeleteTransaction: vi.fn(),
  },
}))

const updateRecurring = vi.mocked(financeRepository.updateRecurring)
const insertRecurring = vi.mocked(financeRepository.insertRecurring)
const updateDebt = vi.mocked(financeRepository.updateDebt)

const RECURRING_VALUES: RecurringValues = {
  name: 'Arriendo',
  kind: 'expense',
  amount: 1_200_000,
  accountId: 'acc-1',
  categoryId: 'cat-1',
  frequency: 'monthly',
  nextDueOn: '2026-02-28',
  note: '',
}

const DEBT_VALUES: DebtValues = {
  counterpart: 'Mi hermano',
  direction: 'i_owe',
  principal: 1_000_000,
  interestKind: 'none',
  interestRate: null,
  startedOn: '2026-08-01',
  dueOn: null,
  instalments: null,
  note: '',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('financeService.createRecurring', () => {
  it('el día acordado sale del primer vencimiento', () => {
    void financeService.createRecurring('u-1', { ...RECURRING_VALUES, nextDueOn: '2026-01-31' })

    expect(insertRecurring).toHaveBeenCalledWith(expect.objectContaining({ anchor_day: 31 }))
  })
})

describe('financeService.updateRecurring', () => {
  it('sube el monto sin tocar el día acordado', async () => {
    // El caso que motivó todo esto: el arriendo sube de precio.
    await financeService.updateRecurring(
      'r-1',
      { ...RECURRING_VALUES, amount: 1_350_000 },
      RECURRING_VALUES.nextDueOn,
    )

    expect(updateRecurring).toHaveBeenCalledWith(
      'r-1',
      expect.objectContaining({ amount: 1_350_000 }),
    )
  })

  it('**no rehace el día acordado si la fecha no cambió**', async () => {
    // Un arriendo del 31 que pasó por febrero tiene el próximo vencimiento en
    // el 28. Recalcular el ancla desde esa fecha al editar sólo el monto lo
    // dejaría clavado en el 28 para siempre, que es justo lo que `anchor_day`
    // vino a evitar.
    await financeService.updateRecurring(
      'r-1',
      { ...RECURRING_VALUES, amount: 1_350_000 },
      '2026-02-28',
    )

    const [, patch] = updateRecurring.mock.calls[0] ?? []
    expect(patch).not.toHaveProperty('anchor_day')
  })

  it('rehace el día acordado cuando sí mueves la fecha', async () => {
    // Mover el vencimiento al 5 significa que el día acordado ahora es el 5.
    await financeService.updateRecurring(
      'r-1',
      { ...RECURRING_VALUES, nextDueOn: '2026-03-05' },
      '2026-02-28',
    )

    expect(updateRecurring).toHaveBeenCalledWith('r-1', expect.objectContaining({ anchor_day: 5 }))
  })

  it('una nota en blanco se guarda como ausencia de nota', async () => {
    await financeService.updateRecurring('r-1', { ...RECURRING_VALUES, note: '   ' }, '2026-02-28')

    expect(updateRecurring).toHaveBeenCalledWith('r-1', expect.objectContaining({ note: null }))
  })

  it('un fallo llega como error de dominio, sin detalles técnicos', async () => {
    updateRecurring.mockRejectedValue(new Error('connection terminated unexpectedly'))

    const error: unknown = await financeService
      .updateRecurring('r-1', RECURRING_VALUES, '2026-02-28')
      .catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('connection')
  })
})

describe('financeService.updateDebt', () => {
  it('corrige el monto sin tocar los abonos', async () => {
    // Los abonos son movimientos con `debt_id`: siguen apuntando a la misma
    // deuda, y el saldo se recalcula solo porque nunca se almacena.
    await financeService.updateDebt('d-1', { ...DEBT_VALUES, principal: 1_500_000 })

    expect(updateDebt).toHaveBeenCalledWith(
      'd-1',
      expect.objectContaining({ principal: 1_500_000 }),
    )
  })

  it('quitar los intereses borra también la tasa', async () => {
    // La base rechaza una tasa sin forma de correr, así que dejarla puesta
    // convertiría la corrección en un error técnico.
    await financeService.updateDebt('d-1', {
      ...DEBT_VALUES,
      interestKind: 'none',
      interestRate: 2,
    })

    expect(updateDebt).toHaveBeenCalledWith('d-1', expect.objectContaining({ interest_rate: null }))
  })

  it('con intereses, la tasa se guarda', async () => {
    await financeService.updateDebt('d-1', {
      ...DEBT_VALUES,
      interestKind: 'monthly_on_balance',
      interestRate: 2,
    })

    expect(updateDebt).toHaveBeenCalledWith('d-1', expect.objectContaining({ interest_rate: 2 }))
  })

  it('un fallo llega como error de dominio, sin detalles técnicos', async () => {
    updateDebt.mockRejectedValue(new Error('connection terminated unexpectedly'))

    const error: unknown = await financeService.updateDebt('d-1', DEBT_VALUES).catch((e) => e)

    expect(isAppError(error)).toBe(true)
    expect((error as { message: string }).message).not.toContain('connection')
  })
})
