import type { Response, Request, NextFunction } from 'express'
import User from '../models/User'
import { verifyToken } from '../utils/jwt'

declare global {
   namespace Express {
      interface Request {
         user?: User
      }
   }
}

export const autentcate = async (req: Request, res: Response, next: NextFunction) => {
   const bearer = req.headers.authorization
   if (!bearer) {
      const error = new Error('No Autorizado')
      return res.status(401).json({ error: error.message })
   }

   const [, token] = bearer.split(' ')
   if (!token) {
      const error = new Error('Token no Válido')
      return res.status(401).json({ error: error.message })
   }

   try {
      const decoded = verifyToken(token)
      if (typeof decoded === 'object' && decoded.id) {
         req.user = await User.findByPk(decoded.id, {
            attributes: ['id', 'name', 'email']
         })
         next()
      }

   } catch (error) {
      res.status(500).json({ error: 'Hubo un Error' })
   }
}