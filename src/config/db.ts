import { Sequelize } from "sequelize-typescript";
import 'dotenv/config';
import { cyan, red } from "colors";

export const db = new Sequelize(process.env.DATABASE_URL, {
   models: [__dirname + '/../models/**/*'],
   logging: false,
   dialectOptions: {
      ssl: {
         require: false
      }
   }
})

export const connectDB = async () => {
   try {
      await db.authenticate()
      db.sync()
      console.log(cyan.bold('Conexión Exitosa'))
   } catch (error) {
      console.log(red.bold('Fallo Conexión'))
   }
}