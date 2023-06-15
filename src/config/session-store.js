import mysqlstore from 'express-mysql-session'

export default function sessionStore(session) {
    const MySQLStore = mysqlstore(session)
    const store = new MySQLStore({
        database: 'shop_online',
        user: 'root',
        password: 'wm050604',
        host: 'localhost',
        expiration: 1000 * 3600 * 24,
        checkExpirationInterval: 1000 * 3600 * 12,
    })

    return store
}
