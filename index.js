const express = require('express');
const bodyParser = require('body-parser');
const nodemailer =  require('nodemailer');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cors());

app.get('/', (res, result) => {
    result.send('welcome to my api');
});

app.post('/api/forma', (req, res) => {
    let data = req.body
    let smtTrasnport = nodemailer.createTransport({
        service: 'outlook',
        port: 465,
        auth: {
            user: emailSupport,
            pass: passSupport
        }
    });
    let mailOptions = {
        from: emailSupport,
        to: emailSupport,
        subject: `Mensagem de ${data.name1}`,
        html: `
            <h3>Informações:</h3>
                <ul>
                    <li>Nome: ${data.name1}</li>
                    <li>Sobrenome: ${data.lastName}</li>
                    <li>Email: ${data.email}</li>
                </ul>
                <h3>Mensagem:</h3>
                <p>${data.message}</p>
        `
    } 
    smtTrasnport.sendMail(mailOptions, (error, response) => {
        if(error) {
            res.send(error);
        }
        else {
            res.send('Success');
        }
    });
    smtTrasnport.close();
});

app.post('/api/emailWelcome', (req, res) => {
    let dataBase = req.body;
    const titleWelcome = `Boas-Vindas, ${dataBase.name}`;
    const contentWelcome = `
    <h3>Olá, ${dataBase.name}!</h3> 
        <p>Sejá Bem-Vindo ao Mãe-Vacina! Você poderá:</p>
        <ul>
            <li>Marcar consultas/exames</li>
            <li>Solicitar sua caderneta de vacinas digital</li>
            <li>E muito mais</li>
        </ul>
    `
    emailSend(emailSupport, passSupport, dataBase.email, titleWelcome, contentWelcome, res);
});

app.post('/api/emailForgotPass', (req, res) => {
    let dataBase2 = req.body;
    const titleForgotPass = `Recuperação de Senha`;
    const contentForgotPass = `
    <h3>Olá, ${dataBase2.email}!</h3>
    <p>Você solicitou a recuperação de senha.</p>
    Sua nova senha é <b>${dataBase2.newPass}</b>`;
    emailSend(emailSupport, passSupport, dataBase2.email, titleForgotPass, contentForgotPass, res);
});

app.post('/api/register', (req, res) => {
    let dataBase3 = req.body;
    const titleWelcome = `Boas-Vindas, ${dataBase3.name}`;
    const contentWelcome = `
        <h3>Olá, ${dataBase3.name}!</h3> 
        <p>Sejá Bem-Vindo ao Mãe-Vacina! Você poderá:</p>
        <ul>
            <li>Marcar consultas/exames</li>
            <li>Solicitar sua caderneta de vacinas digital</li>
            <li>E muito mais</li>
        </ul>
    `
    db.query("SELECT * FROM usuários WHERE email = ?", [dataBase3.email], (err, result) => {
        if(err) {
            res.send({id: 0, msg: err.sqlMessage});
        }
        else if(result.length === 0) {
            bcrypt.hash(dataBase3.password, saltRounds, (erro, hash) =>{
                db.query("INSERT INTO usuários (name, cpf, birth_date, telephone, email, password) VALUES (?, ?, ?, ?, ?, ?)",
                [dataBase3.name, dataBase3.id, dataBase3.birthDate, dataBase3.telephone, dataBase3.email, hash], (err, response) => {
                    if(err) {
                        res.send({id: 1, msg: err.sqlMessage});
                    }
                    else {
                        res.send({id: 2, msg: "Usuário Cadastrado com sucesso!! Sejá bem-vindo!"});
                        emailSend(emailSupport, passSupport, dataBase3.email, titleWelcome, contentWelcome, res);
                    }
                });
            });
        }
        else {
            res.send({id: 3, msg: "Email já cadastrado!! Faça login ou insira outro email!"});
        }
    });
});

app.post('/api/login', (req, res) => {
    let dataBase4 = req.body;
    db.query("SELECT * FROM usuários WHERE email = ?", [dataBase4.email],
    (err, result) => {
        if(err) {
            res.send({id: 0, msg: err.sqlMessage});
        }
        else if(result.length > 0) {
            bcrypt.compare(dataBase4.password, result[0].password, (err, response) => {
                if(response){
                    res.send({id: 1, msg: "Usuário logado com sucesso!!"});
                }
                else {
                    res.send({id: 2, msg: "Senha incorreta!! Tente novamente!"});
                }
            });
        }
        else {
            res.send({id: 3, msg: "Email não cadastrado!! Faça o cadastro!"});
        }
    });
});

app.post('/api/emailPassForgot', (req, res) => {
    let dataBase5 = req.body;
    const randomPass = Math.random().toString(36).slice(2);
    const titleForgotPass = `Recuperação de Senha`;
    const contentForgotPass = `
        <h3>Olá, ${dataBase5.emailForgot}!</h3>
        <p>Você solicitou a recuperação de senha.</p>
        <p>Sua nova senha é: <b><u>${randomPass}</u></b></p>
    `
    db.query("SELECT * FROM usuários WHERE email = ?", [dataBase5.emailForgot], (err, result) => {
        if(err) {
            res.send({id: 0, msg: err.sqlMessage});
        }
        else if(result.length === 0) {
            res.send({id: 1, msg: "Email não cadastrado!! Faça o cadastro!"});
        }
        else {
            bcrypt.hash(randomPass, saltRounds, (err, hash) => {
                db.query("UPDATE usuários SET password = ? WHERE email = ?", [hash, dataBase5.emailForgot]
                , (err, response) => {
                    if(err) {
                        res.send({id: 2, msg: err.sqlMessage});
                    }
                    else {
                        res.send({id: 3, msg: `Enviamos uma messagem para ${dataBase5.emailForgot}!! Acesse seu email!`});
                        emailSend(emailSupport, passSupport, dataBase5.emailForgot, titleForgotPass, contentForgotPass, res);
                    }
                })
            })
        }
    })
});

app.post('/api/dataUser', (req, res) => {
    let dataBase6 = req.body;

    let TextQuotationMarks = dataBase6.logger;
    var newText = "";
    for(var i = 0; i < TextQuotationMarks.length; i++) {
        if(TextQuotationMarks[i] !== "\"" && TextQuotationMarks[i] !== "\\") {
            newText += TextQuotationMarks[i];
        } 
    }
    
    db.query("SELECT * FROM usuários WHERE email = ?", [newText], (err, result) => {
        if(err) {
            res.send({id: 0, msg: err.sqlMessage, emailData: newText});
        }
        else if(result.length > 0) {
            res.send({id: 1, dataUser: result[0]});
        }
    });
    
});

app.post('/api/dataVaccine', (req, res) => {
    db.query("SELECT * FROM vacinas", (erro, response) => {
        if(erro) {
            res.send({id: 0 , msg: erro.sqlMessage});
        }
        else if(response.length > 0) {
            res.send({id:1, dataVaccine: response});
        }
    });
});

app.post('/api/vaccineRegistration', (req, res) => {
    let dataBase7 = req.body;
    db.query("SELECT * FROM imunizados WHERE immunized = ? and vaccine = ?", [dataBase7.email, dataBase7.vaccine], (err, result) => {
        if(err) {
            res.send({id: 0, msg: err.sqlMessage});
        }
        else if(result.length > 0) {
            res.send({id: 1, msg: "O usuário já tomou a vacina!!!"});
        }
        else {
            db.query("INSERT INTO imunizados (immunized, vaccine, date_of_vaccination) VALUES (?, ?, ?)", 
            [dataBase7.email, dataBase7.vaccine, dataBase7.date_of_vaccination], (erro, response) => {
                if(erro) {
                    res.send({id: 2, msg: erro.sqlMessage});
                }
                else {
                    res.send({id: 3, msg: "Vacina cadastrada com sucesso!!!"});
                }
            });
        }
    });
});

app.post('/api/dataVaccination', (req, res) => {
    let dataBase8 = req.body;
    db.query("SELECT * FROM imunizados WHERE immunized = ?", [dataBase8.email], (err, result) => {
        if(err) {
            res.send({id:0, msg: err.sqlMessage})
        }
        else if(result.length > 0) {
            res.send({id: 1, dataVaccination: result});
        }
        else {
            res.send({id: 2, msg: "Não há vacinas cadastradas!!"});
        }
    })
});


const userRoot = "root";
const passRoot = "password";

const db = mysql.createPool({
    host: "localhost",
    user: userRoot,
    password: passRoot,
    database: "banco_mae_vacina",
});

//Função para enviar email
const emailSupport = 'maevacinarecpe@hotmail.com';
const passSupport = 'maevacina123';

function emailSend(emailFrom, passFrom, emailTo, title, content, res) {
    let smtTrasnport = nodemailer.createTransport({
        service: 'outlook',
        port: 465,
        auth: {
            user: emailFrom,
            pass: passFrom
        }
    });
    let mailOptions = {
        from: emailFrom,
        to: emailTo,
        subject: title,
        html: content
    } 
    smtTrasnport.sendMail(mailOptions, (error, response) => {
        if(error) {
            res.send(error);
        }
        else {
            res.send('Success');
        }
    })
    smtTrasnport.close();
}

const PORT = process.env.PORT||3001;
app.listen(PORT, ()=> {
    console.log(`Server starting at port ${PORT}`);
});