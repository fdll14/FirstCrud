require("dotenv").config({});
const port = process.env.PORT || 8007;
const express = require("express")
const path = require("path")
const mysql = require("mysql")
const bodyParser = require("body-parser")
const session = require("express-session")
const { response } = require("express")
const { request } = require("http")
const moment = require("moment");
const connection = require("./connection/connection")

const app = express();


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use((req, res, next) => {
    res.locals.moment = moment;
    next();
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (request, response) => {
    let sql1 = `SELECT dosen.id_dosen, dosen.nama_lengkap, NVL(SUM(CASE WHEN mahasiswa.gender = 'L' THEN 1 END),0) AS L,
    NVL(SUM(CASE WHEN mahasiswa.gender = 'P' THEN 1 END),0) AS P FROM mahasiswa
    INNER JOIN dosen ON dosen.id_dosen = mahasiswa.dosen_wali
    GROUP BY dosen.nama_lengkap, dosen.id_dosen
    ORDER BY dosen.id_dosen;`
    connection.query(sql1, (err,data1)=>{
        let sql2 = `SELECT mahasiswa.nim AS nim, dosen.id_dosen,mahasiswa.nama AS nama, dosen.nama_lengkap AS dosen, mahasiswa.gender AS gender ,mahasiswa.tempat_lahir AS tempat_lahir, mahasiswa.tanggal AS tanggal_lahir FROM dosen INNER JOIN mahasiswa ON  dosen.id_dosen = mahasiswa.dosen_wali;`
        connection.query(sql2, (err, data) => {
            request.session.loggedin ? response.render('index', { title: "Admin Panel", list: data, dosens: data1 }) : response.redirect('login')
        })
    })
})

// fitur login
app.get('/login', (request, response) => {
    response.render('login', {
        title: "Welcome"
    })
})

app.post('/auth', function (request, response) {
    let username = request.body.username;
    let password = request.body.password;
    if (username && password) {
        connection.query('SELECT * FROM admin WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            if (results.length > 0) {
                request.session.loggedin = true;
                response.redirect('/');
            } else {
                response.send('Incorrect Username and/or Password!');
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});


// fungsi logout
app.get('/logout', (request, response) => {
    request.session.loggedin = false;
    response.redirect('login')
})

app.get('/mahasiswa', (request, response) => {
    let sql = `SELECT * FROM mahasiswa`
    connection.query(sql, (err, data) => {
        request.session.loggedin ? response.render('mhs_index', { title: 'Data Mahasiswa', mahasiswa: data }) : response.redirect('login')
    })

})


app.get('/addmhs', (request, response) => {
    let sql = `SELECT * FROM dosen`
    connection.query(sql, (err, data) => {
        request.session.loggedin ? response.render('mhs_add', { title: 'Add Mahasiswa', dosens: data }) : response.redirect('login')

    })

})

app.get('/hapusmhs/:nim', (request, response) => {
    let nim = request.params.nim
    let sql = `DELETE FROM mahasiswa WHERE nim = '${nim}'`
    connection.query(sql, (err, results) => {
        err ? console.log(err) : response.redirect('/mahasiswa')
    })
})

app.post('/savemhs', (request, response) => {
    let data = request.body
    let sql = `INSERT INTO mahasiswa SET ?`
    connection.query(sql, data, (err, results) => {
        err ? console.log(err) : response.redirect('mahasiswa')
    })
})

app.get('/editmhs/:nim', (request, response) => {
    let nim = request.params.nim
    let sql1 = `SELECT * FROM dosen`
    let sql2 = `SELECT mahasiswa.nim AS nim, dosen.id_dosen,mahasiswa.nama AS nama, dosen.nama_lengkap AS dosen, mahasiswa.gender AS gender ,mahasiswa.tempat_lahir AS tempat_lahir, mahasiswa.tanggal AS tanggal_lahir FROM dosen INNER JOIN mahasiswa ON  dosen.id_dosen = mahasiswa.dosen_wali WHERE nim = '${nim}'`
    connection.query(sql1, (err,results1)=>{
        connection.query(sql2, (err, results2) => {
            request.session.loggedin ? response.render("mhs_edit", { title: 'Edit Data', mahasiswa: results2[0], dosens: results1}) : response.redirect('/login')
        })
    })

})


app.post('/updatemhs', (request, response) => {
    let nim = request.body.nim
    let sql = `UPDATE mahasiswa SET nama = '${request.body.nama}', dosen_wali = '${request.body.dosen_wali}', gender = '${request.body.gender}', tempat_lahir = '${request.body.tempat_lahir}', tanggal = '${request.body.tanggal}' WHERE nim = '${nim}'`
    connection.query(sql, (err, results) => {
        err ? console.log(err) : response.redirect('/mahasiswa')
    })
})


app.get('/dosen', (request, response) => {
    let sql = `SELECT * FROM dosen`
    connection.query(sql, (err, data) => {
        request.session.loggedin ? response.render('dsn_index', { title: 'Data Dosen', dosens: data }) : response.redirect('login')
    })

})

app.get('/adddsn', (request, response) => {
    request.session.loggedin ? response.render('dsn_add', { title: 'Add Data' }) : response.redirect('login')
})

app.post('/savedsn', (request, response) => {
    let data = request.body
    sql = `INSERT INTO dosen SET ?`
    connection.query(sql, data, (err, results) => {
        err ? console.log(err) : response.redirect('dosen')
    })
})

app.get('/editdsn/:id_dosen', (request, response) => {
    let id = request.params.id_dosen
    let sql = `SELECT * FROM dosen WHERE id_dosen = '${id}'`
    connection.query(sql, (err, results) => {
        request.session.loggedin ? response.render("dsn_edit", { title: 'Edit Data', dosen: results[0] }) : response.redirect('/login')
    })
})

app.post('/updatedsn', (request, response) => {
    let id = request.body.id_dosen
    let sql = `UPDATE dosen SET nama_lengkap = '${request.body.nama_lengkap}' WHERE id_dosen = '${id}'`
    connection.query(sql, (err, results) => {
        err ? console.log(err) : response.redirect('/dosen')
    })
})

app.get('/hapusdsn/:id_dosen', (request, response) => {
    let id = request.params.id_dosen
    let sql = `DELETE FROM dosen WHERE id_dosen = '${id}'`
    connection.query(sql, (err, results) => {
        err ? console.log(err) : response.redirect('/dosen')
    })
})

app.listen(process.env.PORT || port, () => {
    console.log("Server is running on port " + port);
  });
