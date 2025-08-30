import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { body, param } from "express-validator";
import { handleInputErrors } from "../middleware/validation";
import { limiter } from "../config/limiter";
import { autentcate } from "../middleware/auth";

const router = Router()

router.use(limiter)

router.post('/create-account',
   body('name').notEmpty().withMessage('Nombre Obligatorio'),
   body('password').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
   body('email').isEmail().withMessage('Correo no Válido'),
   handleInputErrors,
   AuthController.create
)

router.post('/confirm-account',
   body('token').isLength({ min: 6, max: 6 }).withMessage('Token no Válido'),
   handleInputErrors,
   AuthController.confirm
)

router.post('/login',
   body('email').isEmail().withMessage('Correo no Válido'),
   body('password').notEmpty().withMessage('Contraseña Obligatorio'),
   handleInputErrors,
   AuthController.login
)

router.post('/forgot-password',
   body('email').notEmpty().withMessage('Correo Obligatorio').isEmail().withMessage('Correo no Válido'),
   handleInputErrors,
   AuthController.forgotPassword
)

router.post('/validate-token',
   body('token').notEmpty().withMessage('Token no Válido').isLength({ min: 6, max: 6 }).withMessage('Token no Válido'),
   handleInputErrors,
   AuthController.validateToken
)

router.post('/reset-password/:token',
   param('token').notEmpty().withMessage('Token no Válido').isLength({ min: 6, max: 6 }).withMessage('Token no Válido'),
   body('password').notEmpty().withMessage('Contraseña Obligatorio').isLength({ min: 8 }).withMessage('Contraseña mínimo 8 caracteres'),
   handleInputErrors,
   AuthController.resetPasswordWithToken
)

router.get('/user',
   autentcate,
   AuthController.user
)

router.put('/user',
   autentcate,
   body('name').notEmpty().withMessage('Nombre Obligatorio'),
   body('email').isEmail().withMessage('Correo no Válido'),
   handleInputErrors,
   AuthController.updateProfile
)

router.post('/update-password',
   autentcate,
   body('current_password').notEmpty().withMessage('Contraseña Actual Obligatorio'),
   body('password').notEmpty().withMessage('Nueva Contraseña Obligatorio').isLength({ min: 8 }).withMessage('Contraseña nueva mínimo 8 caracteres'),
   handleInputErrors,
   AuthController.updateUserPassword
)

router.post('/check-password',
   autentcate,
   body('password').notEmpty().withMessage('Nueva Contraseña Obligatorio'),
   handleInputErrors,
   AuthController.checkPassword
)

export default router