import { transport } from "../config/nodemailer"

type EmailType = {
   name: string,
   email: string,
   token: string
}

export class AuthEmail {
   static sendConfirmationEmail = async (user: EmailType) => {
      const email = await transport.sendMail({
         from: 'CashTrackr <admin@cashtrackr.com>',
         to: user.email,
         subject: 'CashTrackr - Confirma tu Cuenta',
         html: `
            <p>Hola: ${user.name}, has creado tu cuenta en CashTrackr, ya casi esta todo listo, solo confirma tu cuenta</p>
            <p>Visita el siguiente enlace</p>
            <a href="${process.env.FRONTEND_URL}/auth/confirm-account">Confirmar Cuenta</a>
            <p>Ingresa el Código: <b>${user.token}</b></p>
         `
      })
      // console.log('Mensaje enviado', email.messageId)
   }

   static sendPasswordResetToken = async (user: EmailType) => {
      const email = await transport.sendMail({
         from: 'CashTrackr <admin@cashtrackr.com>',
         to: user.email,
         subject: 'CashTrackr - Reestablece tu Contraseña',
         html: `
            <p>Hola: ${user.name}, has solicitado reestablecer tu contraseña</p>
            <p>Visita el siguiente enlace</p>
            <a href="${process.env.FRONTEND_URL}/auth/new-password">Reestablecer Contraseña</a>
            <p>Ingresa el Código: <b>${user.token}</b></p>
         `
      })
      // console.log('Mensaje enviado', email.messageId)
   }
}