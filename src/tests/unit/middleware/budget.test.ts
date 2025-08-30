import { createRequest, createResponse } from "node-mocks-http"
import { hasAccess, validateBudgetExist } from "../../../middleware/budget"
import Budget from "../../../models/Budget"
import { budgets } from "../../mocks/budget"

jest.mock('../../../models/Budget', () => ({
   findByPk: jest.fn()
}))

describe('budget - validateBudgetExist', () => {
   it('should handle non-existent budget', async () => {
      (Budget.findByPk as jest.Mock).mockResolvedValue(null)
      const req = createRequest({
         params: {
            budgetId: 1
         }
      })

      const res = createResponse();
      const next = jest.fn()

      await validateBudgetExist(req, res, next)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(404)
      expect(data).toEqual({ error: 'Presupeusto no Encontrado' })
      expect(next).not.toHaveBeenCalled()
   })

   it('should proceed to next middleware if budget exists', async () => {
      (Budget.findByPk as jest.Mock).mockResolvedValue(budgets[0])
      const req = createRequest({
         params: {
            budgetId: 1
         }
      })

      const res = createResponse();
      const next = jest.fn()

      await validateBudgetExist(req, res, next)
      expect(next).toHaveBeenCalled()
      expect(req.budget).toEqual(budgets[0])

   })

   it('should handle non-existent budget', async () => {
      (Budget.findByPk as jest.Mock).mockRejectedValue(new Error)
      const req = createRequest({
         params: {
            budgetId: 1
         }
      })

      const res = createResponse();
      const next = jest.fn()

      await validateBudgetExist(req, res, next)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(500)
      expect(data).toEqual({ error: 'Hubo un Error' })
      expect(next).not.toHaveBeenCalled()
   })
})

describe('budget - hasAccess', () => {
   it('shuold call nect() if use has access to budget', () => {

      const req = createRequest({
         budget: budgets[0],
         user: { id: 1 }
      })

      const res = createResponse();
      const next = jest.fn()

      hasAccess(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)

   })

   it('shuold return 401 error if userId does nor have access to budget', () => {

      const req = createRequest({
         budget: budgets[0],
         user: { id: 2 }
      })

      const res = createResponse();
      const next = jest.fn()

      hasAccess(req, res, next)
      const data = res._getJSONData()


      expect(next).not.toHaveBeenCalled()
      expect(res.statusCode).toBe(401)
      expect(data).toEqual({ error: 'Acción no Válida' })

   })
})