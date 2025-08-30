import type { Response, Request, NextFunction } from 'express'
import { body, param, validationResult } from 'express-validator'
import Budget from '../models/Budget'

declare global {
   namespace Express {
      interface Request {
         budget?: Budget
      }
   }
}

export const validationBudgetId = async (req: Request, res: Response, next: NextFunction) => {
   await param('budgetId').isInt().withMessage('ID no Válido').bail().custom((value) => value > 0).withMessage('ID no Válido').bail().run(req)
   
   let errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
   }
   next()
}

export const validateBudgetInput = async (req: Request, res: Response, next: NextFunction) => {
   await body('name').notEmpty().withMessage('Nombre Obligatorio').run(req)
   await body('amount').notEmpty().withMessage('Presupuesto Obligatorio').isNumeric().withMessage('Presupuesto no Válido').custom((value) => value > 0).withMessage('Presupuesto Mayor a 0').run(req)
   next()
}

export const validateBudgetExist = async (req: Request, res: Response, next: NextFunction) => {
   try {
      const { budgetId } = req.params

      const budget = await Budget.findByPk(+budgetId)
      if (!budget) {
         const error = new Error('Presupeusto no Encontrado')
         return res.status(404).json({ error: error.message })
      }
      req.budget = budget
      next()
   } catch (error) {
      res.status(500).json({ error: 'Hubo un Error' })
   }
}

export const hasAccess = async (req: Request, res: Response, next: NextFunction) => {
   if (req.budget.userId !== req.user.id) {
      const error = new Error('Acción no Válida')
      return res.status(401).json({ error: error.message })
   }
   next()
}