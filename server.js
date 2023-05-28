import app from "./src/app.js";
import db from "./src/database/db.js";
import Users from './src/database/models/Users-model.js'

try {
    await db.authenticate()
    await Users.sync({force: true})
} catch (error) {
    console.log(error)
}

const PORT = process.env.PORT
app.listen(PORT, () => console.log('server is listening at port', PORT))