import {Sequelize} from 'sequelize'

const db = new Sequelize('testing', 'root', 'wm050604', {
    host: 'localhost',
    dialect: 'mysql'
})

export default db