import { budgetsService } from './budgets.service'
import { catalogService } from './catalog.service'
import { debtsService } from './debts.service'
import { recurringService } from './recurring.service'
import { transactionsService } from './transactions.service'

/**
 * Las reglas de negocio de finanzas, en un solo punto de entrada.
 *
 * **El dominio está partido en cinco por dentro** —catálogo, movimientos,
 * deudas, fijos y topes— porque juntos pasaban de 485 líneas y encontrar una
 * regla exigía recorrer el archivo entero. Cada parte cabe ahora en una
 * pantalla y se lee sin saltar.
 *
 * **Pero la fachada se queda**, y no por comodidad: veintitantos hooks importan
 * `financeService`, y cambiarlos a la vez habría convertido una reorganización
 * sin riesgo en un cambio que toca media feature. Aquí la partición es
 * invisible para quien la consume, que es lo que hace que se pueda seguir
 * moviendo cosas después sin volver a tocar a nadie.
 *
 * Quien añada un método lo pone **en el servicio que le toca**, no aquí: este
 * archivo sólo compone.
 */
export const financeService = {
  ...catalogService,
  ...transactionsService,
  ...debtsService,
  ...recurringService,
  ...budgetsService,
}
