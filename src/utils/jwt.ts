import { sign, verify } from "jsonwebtoken"

export const generateJWT = (id: string): string => {
   const token = sign({ id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
   })
   return token
}

export const verifyToken = (token: string) => {
   return verify(token, process.env.JWT_SECRET)
}