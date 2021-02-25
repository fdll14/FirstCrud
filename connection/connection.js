const mysql = require('mysql');

const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;
console.log(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE);
const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE
});

db.connect((err) => {
    if (!err) {
        console.log("connect");
    }else{
        console.log("not Connect");
    }
})

module.exports = db 