import { createRequest, createResponse } from "node-mocks-http";
import { validateExpenseExist } from "../../../middleware/expense";
import Expense from "../../../models/Expense";
import { expenses } from "../../mocks/expenses";
import { hasAccess } from "../../../middleware/budget";
import { budgets } from "../../mocks/budget";

jest.mock("../../../models/Expense", () => ({
   findByPk: jest.fn()
}))

describe('Expenses Middleware - validateExpenseExist', () => {

   beforeEach(() => {
      (Expense.findByPk as jest.Mock).mockImplementation((id) => {
         const expense = expenses.filter(e => e.id === id)[0] ?? null
         return Promise.resolve(expense)
      })
   })

   it('should handle a not-existent budget', async () => {
      const req = createRequest({
         params: { expenseId: 120 }
      })

      const res = createResponse()
      const next = jest.fn()

      await validateExpenseExist(req, res, next)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(404)
      expect(data).toEqual({ error: 'Gasto no Encontrado' })
      expect(next).not.toHaveBeenCalled()

   })

   it('should call next middleware if expense exists', async () => {
      const req = createRequest({
         params: { expenseId: 1 }
      })

      const res = createResponse()
      const next = jest.fn()

      await validateExpenseExist(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
      expect(req.expense).toEqual(expenses[0])

   })

   it('should handle internal server error', async () => {

      (Expense.findByPk as jest.Mock).mockRejectedValue(new Error)
      const req = createRequest({
         params: { expenseId: 1 }
      })

      const res = createResponse()
      const next = jest.fn()

      await validateExpenseExist(req, res, next)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(500)
      expect(next).not.toHaveBeenCalled()
      expect(data).toEqual({ error: 'Hubo un Error' })

   })

   it('Should prevent anouthorized user from adding expensee', async () => {
      const req = createRequest({
         method: 'POST',
         url: '/api/budgets/:budgetId/expenses',
         budget: budgets[0],
         user: { id: 20 },
         body: { name: 'Test', amount: 3000 }
      })

      const res = createResponse()
      const next = jest.fn()

      hasAccess(req, res, next)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(401)
      expect(data).toEqual({ error: 'Acción no Válida' })
      expect(next).not.toHaveBeenCalled()

   })
})