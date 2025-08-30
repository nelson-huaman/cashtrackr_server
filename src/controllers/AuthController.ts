import type { Request, Response } from 'express'
import User from '../models/User'
import { checkPassword, hasPassword } from '../utils/auth'
import { generateToken } from '../utils/token'
import { generateJWT } from '../utils/jwt'

export class AuthController {

   static create = async (req: Request, res: Response) => {
      const { email, password } = req.body

      const userExists = await User.findOne({ where: { email } })
      if (userExists) {
         const error = new Error('El Correo ya esta Registrado')
         return res.status(409).json({ error: error.message })
      }

      try {

         const user = await User.create(req.body)
         user.password = await hasPassword(password)
         const token = generateToken()
         user.token = token

         if (process.env.NODE_ENV !== 'production') {
            globalThis.chashTrackConfirmationToken = token
         }

         // await AuthEmail.sendConfirmationEmail({
         //    name: user.name,
         //    email: user.email,
         //    token: user.token
         // })

         await user.save()
         res.status(201).json('Cuenta Creada')

      } catch (error) {
         console.log(error)
         res.status(500).json({ error: 'Hubo un Error' })
      }
   }

   static confirm = async (req: Request, res: Response) => {
      const { token } = req.body
      const user = await User.findOne({ where: { token } })
      if (!user) {
         const error = new Error('Token no Válido')
         return res.status(401).json({ error: error.message })
      }

      user.confirmed = true
      user.token = null
      await user.save()
      res.json('Cuenta Confirmada')
   }

   static login = async (req: Request, res: Response) => {
      const { email, password } = req.body

      const user = await User.findOne({ where: { email } })
      if (!user) {
         const error = new Error('Usuario no Encontrado')
         return res.status(404).json({ error: error.message })
      }

      if (!user.confirmed) {
         const error = new Error('Cuenta no confirmada')
         return res.status(403).json({ error: error.message })
      }

      const isPasswordCorrect = await checkPassword(password, user.password)
      if (!isPasswordCorrect) {
         const error = new Error('Contraseña Incorrecto')
         return res.status(401).json({ error: error.message })
      }

      const token = generateJWT(user.id)

      res.json(token)
   }

   static forgotPassword = async (req: Request, res: Response) => {

      const { email } = req.body

      const user = await User.findOne({ where: { email } })
      if (!user) {
         const error = new Error('Usuario no Encontrado')
         return res.status(404).json({ error: error.message })
      }

      user.token = generateToken()
      await user.save()

      // await AuthEmail.sendPasswordResetToken({
      //    name: user.name,
      //    email: user.email,
      //    token: user.token
      // })

      res.json('Revisa tu correo para instruciones')
   }

   static validateToken = async (req: Request, res: Response) => {
      const { token } = req.body

      const tokenExists = await User.findOne({ where: { token } })
      if (!tokenExists) {
         const error = new Error('Token no Valido')
         return res.status(404).json({ error: error.message })
      }

      res.json('Token valido, asigna una nueva contraseña')
   }

   static resetPasswordWithToken = async (req: Request, res: Response) => {
      const { token } = req.params
      const { password } = req.body

      const user = await User.findOne({ where: { token } })
      if (!user) {
         const error = new Error('Token no Valido')
         return res.status(404).json({ error: error.message })
      }

      user.password = await hasPassword(password)
      user.token = null

      await user.save()

      res.json('Contraseña Actualizado')
   }

   static user = async (req: Request, res: Response) => {
      res.json(req.user)
   }

   static updateUserPassword = async (req: Request, res: Response) => {
      const { current_password, password } = req.body

      const { id } = req.user
      const user = await User.findByPk(id)

      const isPasswordCorrect = await checkPassword(current_password, user.password)
      if (!isPasswordCorrect) {
         const error = new Error('Contraseña Actual Incorrecto')
         return res.status(401).json({ error: error.message })
      }

      user.password = await hasPassword(password)
      await user.save()

      res.json('Contraseña Actualizada')
   }

   static checkPassword = async (req: Request, res: Response) => {
      const { password } = req.body

      const { id } = req.user
      const user = await User.findByPk(id)

      const isPasswordCorrect = await checkPassword(password, user.password)
      if (!isPasswordCorrect) {
         const error = new Error('Contraseña Actual Incorrecto')
         return res.status(401).json({ error: error.message })
      }

      res.json('Contraseña Correcto')
   }

   static updateProfile = async (req: Request, res: Response) => {

      const { email } = req.body
      try {

         const user = await User.findOne({ where: { email } })
         if (user && user.id !== req.user.id) {
            return res.status(409).json({ error: 'Correo registrado' })
         }

         await req.user.update(req.body)

         res.json('Usuario actualizado')

      } catch (error) {
         res.status(500).json('Hubo un error')
      }

   }

}