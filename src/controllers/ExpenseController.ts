import type { Request, Response } from 'express'
import Expense from '../models/Expense'

export class ExpensesController {

   static create = async (req: Request, res: Response) => {
      try {

         // await Expense.create({
         //    ...req.body,
         //    budgetId: req.budget.id
         // })
         const expense = await Expense.create(req.body)
         expense.budgetId = req.budget.id
         await expense.save()
         res.status(201).json('Gasto Agregado')
      } catch (error) {
         res.status(500).json({ error: 'Hubo un Error' })
      }
   }

   static getById = async (req: Request, res: Response) => {
      res.json(req.expense)
   }

   static update = async (req: Request, res: Response) => {
      await req.expense.update(req.body)
      res.json('Gasto Actualizado')
   }

   static delete = async (req: Request, res: Response) => {
      await req.expense.destroy()
      res.json('Gasto Eliminado')
   }
}