import request from 'supertest'
import server from '../../server'
import { AuthController } from '../../controllers/AuthController'
import User from '../../models/User'
import * as authUtils from '../../utils/auth'
import * as jwtUtils from '../../utils/jwt'

describe('Auth - Create Account', () => {
   it('should display validation errors when form is emppty', async () => {
      const response = await request(server).post('/api/auth/create-account').send({})

      const createMock = jest.spyOn(AuthController, 'create')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors).toHaveLength(3)

      expect(response.status).not.toBe(201)
      expect(createMock).not.toHaveBeenCalled()
   })

   it('should return 400 status code when the email is invalid', async () => {
      const response = await request(server).post('/api/auth/create-account').send({
         "name": "Nelson",
         "password": "12345678",
         "email": "nelson"
      })

      const createMock = jest.spyOn(AuthController, 'create')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors).toHaveLength(1)
      expect(response.body.errors[0].msg).toBe('Correo no Válido')

      expect(response.status).not.toBe(201)
      expect(createMock).not.toHaveBeenCalled()
   })

   it('should return 400 status code when the password is less tahn 8 characters', async () => {
      const response = await request(server).post('/api/auth/create-account').send({
         "name": "Nelson",
         "password": "123456",
         "email": "text@correo.com"
      })

      const createMock = jest.spyOn(AuthController, 'create')

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('errors')
      expect(response.body.errors).toHaveLength(1)
      expect(response.body.errors[0].msg).toBe('Contraseña mínimo 8 caracteres')

      expect(response.status).not.toBe(201)
      expect(createMock).not.toHaveBeenCalled()
   })

   it('should register a new user successfully', async () => {
      const response = await request(server).post('/api/auth/create-account').send({
         "name": "Nelson",
         "password": "12345678",
         "email": "test@test.com"
      })

      expect(response.status).toBe(201)

      expect(response.status).not.toBe(400)
      expect(response.body).not.toHaveProperty('errors')
   })

   it('should return 409 conflict when a user is already registered', async () => {
      const response = await request(server).post('/api/auth/create-account').send({
         "name": "Nelson",
         "password": "123456789",
         "email": "test@test.com"
      })

      expect(response.status).toBe(409)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toBe('El Correo ya esta Registrado')

      expect(response.status).not.toBe(400)
      expect(response.status).not.toBe(201)
      expect(response.body).not.toHaveProperty('errors')
   })

})

describe('Auth - Account Confirmation with token', () => {
   it('should display error if token is empty', async () => {
      const res = await request(server).post('/api/auth/confirm-account').send({ token: 'no_valido' })

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('errors')
      expect(res.body.errors).toHaveLength(1)
      expect(res.body.errors[0].msg).toBe('Token no Válido')
   })

   it('should display error if token doesnt exists', async () => {
      const res = await request(server).post('/api/auth/confirm-account').send({ token: '123456' })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')

      expect(res.body.error).toBe('Token no Válido')
      expect(res.status).not.toBe(200)
   })

   it('should confirm acount with a valid token', async () => {
      const token = globalThis.chashTrackConfirmationToken
      const res = await request(server).post('/api/auth/confirm-account').send({ token })


      expect(res.status).toBe(200)
      expect(res.body).toBe('Cuenta Confirmada')
      expect(res.status).not.toBe(401)
   })

})

describe('Auth - Login', () => {

   beforeEach(() => {
      jest.clearAllMocks()
   })

   it('should display validation errors whe the form is empry', async () => {
      const res = await request(server).post('/api/auth/login').send({})

      const loginMock = jest.spyOn(AuthController, 'login')

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('errors')
      expect(res.body.errors).toHaveLength(2)

      expect(res.body.errors).not.toHaveLength(1)
      expect(loginMock).not.toHaveBeenCalled()
   })

   it('should return 400 bad request when the email is invalid', async () => {
      const res = await request(server).post('/api/auth/login').send({
         "email": "email_no_valido",
         "password": "12345678"
      })

      const loginMock = jest.spyOn(AuthController, 'login')

      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('errors')
      expect(res.body.errors).toHaveLength(1)
      expect(res.body.errors[0].msg).toBe('Correo no Válido')

      expect(res.body.errors).not.toHaveLength(2)
      expect(loginMock).not.toHaveBeenCalled()
   })

   it('should return 400 error if the user is not found', async () => {
      const res = await request(server).post('/api/auth/login').send({
         "email": "user@test.com",
         "password": "12345678"
      })

      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toBe('Usuario no Encontrado')
      expect(res.status).not.toBe(200)

   })

   it('should return a 403 error if yhe user account is not confirmed', async () => {

      (jest.spyOn(User, 'findOne') as jest.Mock).mockResolvedValue({
         id: 1,
         confirmed: false,
         password: 'hashPassword',
         email: 'user_not_confirm@test.com'
      })

      const res = await request(server).post('/api/auth/login').send({
         "email": "user_not_confirm@test.com",
         "password": "12345678"
      })

      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toBe('Cuenta no confirmada')
      expect(res.status).not.toBe(200)
      expect(res.status).not.toBe(404)

   })

   it('should return a 403 error if yhe user account is not confirmed', async () => {

      const userData = {
         name: 'Test',
         email: "user_not_confirm@test.com",
         password: "12345678"
      }

      await request(server).post('/api/auth/create-account').send(userData)

      const res = await request(server).post('/api/auth/login').send({
         "email": userData.email,
         "password": userData.password
      })

      expect(res.status).toBe(403)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toBe('Cuenta no confirmada')
      expect(res.status).not.toBe(200)
      expect(res.status).not.toBe(404)

   })

   it('should return a 401 error is the password incorrect', async () => {

      const findOne = (jest.spyOn(User, 'findOne') as jest.Mock).mockResolvedValue({
         id: 1,
         confirmed: true,
         password: 'hashPassword',
         email: 'user_not_confirm@test.com'
      })

      const checkPassword = jest.spyOn(authUtils, 'checkPassword').mockResolvedValue(false)

      const res = await request(server).post('/api/auth/login').send({
         "email": "test@test.com",
         "password": "12345678"
      })

      expect(res.status).toBe(401)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toBe('Contraseña Incorrecto')
      expect(res.status).not.toBe(200)
      expect(res.status).not.toBe(404)


      expect(findOne).toHaveBeenCalledTimes(1)
      expect(checkPassword).toHaveBeenCalledTimes(1)
   })

   it('should return a 401 error is the password incorrect', async () => {

      const findOne = (jest.spyOn(User, 'findOne') as jest.Mock).mockResolvedValue({
         id: 1,
         confirmed: true,
         password: 'hashPassword',
         email: 'user_not_confirm@test.com'
      })

      const checkPassword = jest.spyOn(authUtils, 'checkPassword').mockResolvedValue(true)
      const generateJWT = jest.spyOn(jwtUtils, 'generateJWT').mockReturnValue('jwt_token')

      const res = await request(server).post('/api/auth/login').send({
         "email": "test@test.com",
         "password": "passwordCorrect"
      })

      expect(res.status).toBe(200)
      expect(res.body).toBe('jwt_token')

      expect(findOne).toHaveBeenCalled()
      expect(findOne).toHaveBeenCalledTimes(1)

      expect(checkPassword).toHaveBeenCalled()
      expect(checkPassword).toHaveBeenCalledTimes(1)
      expect(checkPassword).toHaveBeenCalledWith('passwordCorrect', 'hashPassword')

      expect(generateJWT).toHaveBeenCalled()
      expect(generateJWT).toHaveBeenCalledTimes(1)
      expect(generateJWT).toHaveBeenCalledWith(1)
   })

})

let jwt: string

async function autentcateUser() {
   const res = await request(server).post('/api/auth/login').send({
      email: "test@test.com",
      password: "12345678"
   })

   jwt = res.body

   expect(res.status).toBe(200)
}

describe('GET - /api/budgets', () => {

   beforeAll(() => {
      jest.restoreAllMocks()
   })

   beforeAll(async () => {
      await autentcateUser()
   })

   it('Should reject unauthenticated access to budgets without a jwt', async () => {
      const res = await request(server).get('/api/budgets')

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('No Autorizado')
   })

   it('Should reject unauthenticated access to budgets without a valid jwt', async () => {
      const res = await request(server).get('/api/budgets').auth('not_valid', { type: 'bearer' })

      expect(res.status).toBe(500)
      expect(res.body.error).toBe('Hubo un Error')
   })


   it('Should allow authenticated access to budgets with a valid jwt', async () => {
      const res = await request(server).get('/api/budgets').auth(jwt, { type: 'bearer' })

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
      expect(res.status).not.toBe(401)
      expect(res.body.error).not.toBe('No Autorizado')
   })

})

describe('POST - /api/budgets', () => {

   beforeAll(async () => {
      await autentcateUser()
   })

   it('Should reject unauthenticated post request to budgets without a jwt', async () => {
      const res = await request(server).post('/api/budgets')

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('No Autorizado')
   })

   it('Should display validation whe the form is submitted whith invalid data', async () => {
      const res = await request(server).post('/api/budgets').auth(jwt, { type: 'bearer' }).send({})

      expect(res.status).toBe(400)
      expect(res.body.errors).toHaveLength(4)
      expect(res.status).not.toBe(200)
   })

   it('Should create new budget seccessfully', async () => {
      const res = await request(server).post('/api/budgets').auth(jwt, { type: 'bearer' }).send({
         name: 'Vacaciones',
         amount: '1000'
      })

      expect(res.status).toBe(201)
      expect(res.status).not.toBe(400)
   })

   it('Should return amouny error', async () => {
      const res = await request(server).post('/api/budgets').auth(jwt, { type: 'bearer' }).send({
         name: 'Vacaciones',
         amount: '-100'
      })

      expect(res.status).toBe(400)
      expect(res.body.errors).toHaveLength(1)
      expect(res.body.errors[0].msg).toBe('Presupuesto Mayor a 0')
      expect(res.status).not.toBe(200)
   })

})

describe('GET - /api/budgets/:id', () => {

   beforeAll(async () => {
      await autentcateUser()
   })

   it('Should reject unauthenticated get request to budgets id without a jwt', async () => {
      const res = await request(server).get('/api/budgets/1')

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('No Autorizado')
   })

   it('Should return 400 bad request whe is id no valid', async () => {
      const res = await request(server).get('/api/budgets/not_valid').auth(jwt, { type: 'bearer' })

      expect(res.status).toBe(400)
      expect(res.body.errors).toBeDefined()
      expect(res.body.errors).toHaveLength(1)
      expect(res.body.errors[0].msg).toBe('ID no Válido')
      expect(res.status).not.toBe(401)
      expect(res.body.error).not.toBe('No Autorizado')
   })

   it('Should return 404 nor found when a duget doesnt exists', async () => {
      const res = await request(server).get('/api/budgets/300').auth(jwt, { type: 'bearer' })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Presupeusto no Encontrado')
      expect(res.status).not.toBe(400)
      expect(res.status).not.toBe(401)
      expect(res.body.error).not.toBe('No Autorizado')
   })

   it('Should return a single budget by id', async () => {
      const res = await request(server).get('/api/budgets/1').auth(jwt, { type: 'bearer' })

      expect(res.status).toBe(200)
      expect(res.status).not.toBe(400)
      expect(res.status).not.toBe(401)
      expect(res.status).not.toBe(404)
      expect(res.body.error).not.toBe('No Autorizado')
   })
})

describe('PUT - /api/budgets/:id', () => {

   beforeAll(async () => {
      await autentcateUser()
   })

   it('Should reject unauthenticated put request to budgets id without a jwt', async () => {
      const res = await request(server).put('/api/budgets/1')

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('No Autorizado')
   })


   it('Should diplay validation errors if the form is empty', async () => {
      const res = await request(server).put('/api/budgets/1').auth(jwt, { type: 'bearer' }).send({})

      expect(res.status).toBe(400)
      expect(res.body.errors).toBeTruthy()
      expect(res.body.errors).toHaveLength(4)
   })

   it('Should update a budget by si and return success message', async () => {
      const res = await request(server).put('/api/budgets/1').auth(jwt, { type: 'bearer' }).send({
         name: 'Test Actualizado',
         amount: 300
      })

      expect(res.status).toBe(200)
      expect(res.body).toBe('Presupuesto Actualizado')
   })
})

describe('DELETE - /api/budgets/:id', () => {

   beforeAll(async () => {
      await autentcateUser()
   })

   it('Should reject unauthenticated put request to budgets id without a jwt', async () => {
      const res = await request(server).delete('/api/budgets/1')

      expect(res.status).toBe(401)
      expect(res.body.error).toBe('No Autorizado')
   })


   it('Should return not found whe a budget doesnt exists', async () => {
      const res = await request(server).delete('/api/budgets/200').auth(jwt, { type: 'bearer' })

      expect(res.status).toBe(404)
      expect(res.body.error).toBe('Presupeusto no Encontrado')
   })

   it('Should delete a budget and return success message', async () => {
      const res = await request(server).delete('/api/budgets/1').auth(jwt, { type: 'bearer' })

      expect(res.status).toBe(200)
      expect(res.body).toBe('Presupuesto Eliminado')
   })
})