import { createRequest, createResponse } from "node-mocks-http"
import { AuthController } from "../../../controllers/AuthController"
import User from "../../../models/User"
import { checkPassword, hasPassword } from "../../../utils/auth"
import { generateToken } from "../../../utils/token"
import { AuthEmail } from "../../../emails/AuthEmail"
import { generateJWT } from "../../../utils/jwt"

jest.mock('../../../models/User')
jest.mock("../../../utils/auth")
jest.mock("../../../utils/token")
jest.mock("../../../utils/jwt")

describe('AuthController.create', () => {

   beforeEach(() => {
      jest.resetAllMocks()
   })

   it('should return a 409 status and an error message if then email is already registered', async () => {

      (User.findOne as jest.Mock).mockResolvedValue(true)

      const req = createRequest({
         method: 'POST',
         url: '/api/auth/create-account',
         body: { email: 'test@test.com', password: '12345678' }
      })

      const res = createResponse()

      await AuthController.create(req, res)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(409)
      expect(data).toHaveProperty('error', 'El Correo ya esta Registrado')
      expect(User.findOne).toHaveBeenCalled()
      expect(User.findOne).toHaveBeenCalledTimes(1)

   })

   it('should register a new user and return a success message', async () => {

      const req = createRequest({
         method: 'POST',
         url: '/api/auth/create-account',
         body: {
            email: 'test@test.com',
            password: '12345678',
            name: 'Test'
         }
      })

      const res = createResponse()

      const mockUser = { ...req.body, save: jest.fn() };

      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (hasPassword as jest.Mock).mockResolvedValue('hashedpassword');
      (generateToken as jest.Mock).mockReturnValue('123456');
      jest.spyOn(AuthEmail, 'sendConfirmationEmail').mockImplementation(() => Promise.resolve());

      await AuthController.create(req, res)
      const data = res._getJSONData()


      expect(User.create).toHaveBeenCalledWith(req.body)
      expect(User.create).toHaveBeenCalledTimes(1)
      expect(mockUser.save).toHaveBeenCalled()
      expect(mockUser.password).toBe('hashedpassword')
      expect(mockUser.token).toBe('123456')
      expect(AuthEmail.sendConfirmationEmail).toHaveBeenCalledWith({
         name: req.body.name,
         email: req.body.email,
         token: '123456'
      })
      expect(AuthEmail.sendConfirmationEmail).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(201)
      expect(data).toEqual('Cuenta Creada')
   })
})

describe('AuthController.login', () => {

   it('should return 404 if user not found', async () => {

      (User.findOne as jest.Mock).mockResolvedValue(null)

      const req = createRequest({
         method: 'POST',
         url: '/api/auth/login',
         body: { email: 'test@test.com', password: '12345678' }
      })

      const res = createResponse()

      await AuthController.login(req, res)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(404)
      expect(data).toEqual({ error: 'Usuario no Encontrado' })

   })

   it('should return 403 if the has not been confimed', async () => {

      (User.findOne as jest.Mock).mockResolvedValue({
         id: 1,
         email: 'test@test.com',
         password: '12345678',
         confirmed: false
      })

      const req = createRequest({
         method: 'POST',
         url: '/api/auth/login',
         body: { email: 'test@test.com', password: '12345678' }
      })

      const res = createResponse()

      await AuthController.login(req, res)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(403)
      expect(data).toEqual({ error: 'Cuenta no confirmada' })

   })

   it('should return 401 if the password is incorrect', async () => {

      const userMock = {
         id: 1,
         email: 'test@test.com',
         password: '12456',
         confirmed: true
      };

      (User.findOne as jest.Mock).mockResolvedValue(userMock)

      const req = createRequest({
         method: 'POST',
         url: '/api/auth/login',
         body: { email: 'test@test.com', password: '12345678' }
      })

      const res = createResponse();

      (checkPassword as jest.Mock).mockResolvedValue(false)

      await AuthController.login(req, res)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(401)
      expect(data).toEqual({ error: 'Contraseña Incorrecto' })
      expect(checkPassword).toHaveBeenCalledWith(req.body.password, userMock.password)
      expect(checkPassword).toHaveBeenCalledTimes(1)

   })

   it('should return a JWT if autication is successful', async () => {

      const userMock = {
         id: 1,
         email: 'test@test.com',
         password: '12345678',
         confirmed: true
      };

      (User.findOne as jest.Mock).mockResolvedValue(userMock)

      const req = createRequest({
         method: 'POST',
         url: '/api/auth/login',
         body: { email: 'test@test.com', password: '12345678' }
      })

      const res = createResponse();

      const fakeJWT = 'fake_jwt';

      (User.findOne as jest.Mock).mockResolvedValue(userMock);
      (checkPassword as jest.Mock).mockResolvedValue(true);
      (generateJWT as jest.Mock).mockReturnValue(fakeJWT);

      await AuthController.login(req, res)
      const data = res._getJSONData()

      expect(res.statusCode).toBe(200)
      expect(data).toEqual(fakeJWT)
      expect(generateJWT).toHaveBeenCalledTimes(1)
      expect(generateJWT).toHaveBeenCalledWith(userMock.id)

   })

})