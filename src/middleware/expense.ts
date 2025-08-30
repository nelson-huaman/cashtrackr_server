import type { Response, Request, NextFunction } from 'express'
import { body, param } from 'express-validator'
import Expense from '../models/Expense'

declare global {
   namespace Express {
      interface Request {
         expense?: Expense
      }
   }
}

export const validateExpenseInput = async (req: Request, res: Response, next: NextFunction) => {
   await body('name').notEmpty().withMessage('Nombre Obligatorio').run(req)
   await body('amount').notEmpty().withMessage('Gasto Obligatorio').isNumeric().withMessage('Gasto no Válido').custom((value) => value > 0).withMessage('Gasto Mayor a 0').run(req)
   next()
}

export const validateExpenseId = async (req: Request, res: Response, next: NextFunction) => {
   await param('expenseId').isInt().withMessage('ID no Válido').custom((value) => value > 0).withMessage('ID no Válido').run(req)
   next()
}

export const validateExpenseExist = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { expenseId } = req.params
      const expense = await Expense.findByPk(expenseId)
      if (!expense) {
         const error = new Error('Gasto no Encontrado')
         return res.status(404).json({ error: error.message })
      }
      req.expense = expense
      next()
   } catch (error) {
      // console.log(error)
      res.status(500).json({ error: 'Hubo un Error' })
   }
}

export const belongsToBudget = async (req: Request, res: Response, next: NextFunction) => {
   if (req.budget.id !== req.expense.budgetId) {
      const error = new Error('Acción no válida')
      return res.status(403).json({ error: error.message })
   }
   next()
}