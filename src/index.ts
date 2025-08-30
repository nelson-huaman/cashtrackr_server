import { magenta } from 'colors'
import server from './server'

const port = process.env.PORT || 4000

server.listen(port, () => console.log(magenta.bold(`Servidor Activo: ${port}`)))