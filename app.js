// criar um servidor
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const db = require("./config/db.js")

// Au debut du fichier
// Configurations
dotenv.config();

// const server = http.createServer((request, response) => {
//     if (request.method == "GET" && request.url == "/") {
//         const file = fs.readFileSync('./public/index.html', 'utf-8');

//         response.setHeader('Content-Type', 'text.html');
//         response.statusCode = 200;

//         response.end(file);
//     } else {
//         const file = fs.readFileSync('./public/404.html', 'utf-8');

//         response.setHeader('Content-Type', 'text.html');
//         response.statusCode = 404;

//         response.end(file);
//     }
// });

// na segunda aula
// para criar um servidor. equivale a linha de cima em comentario
const server = express();

server.set("views", path.join(__dirname, "views"));
server.set("view engine", "mustache");
server.engine("mustache", mustacheExpress());

// Middlewares
// Doit etre avant les routes
server.use(express.static(path.join(__dirname, "public")));

// Points d'acces
server.get("/donnees", async (req, res) => {
    // Primeiro teste
    // const test = {email: "fernandafrata@gmail.com"};

    // Sera remplace par un fetch ou un appel a la bd
    //const donnees = require("./data/donneesTest.js");

    const donneesRef = await db.collection("test").get();

    const donneesFinale = [];

    donneesRef.forEach((doc) => {
        donneesFinale.push(doc.data());
    });

    res.statusCode = 200;
    res.json(donneesFinale);
});

/**
 * @method GET
 * @params id
 * Permet d'acceder a un utilisateur
 */
server.get("/donnees/:id", (req, res) => {
    console.log(req.params.id);
    const donnees = require("./data/donneesTest.js")

    const utilisateur = donnees.find((element) => {
        return element.id == req.params.id;
    });

    if (utilisateur) {
        res.statusCode = 200;
        res.json(utilisateur);
    } else {
        res.statusCode = 404;
        res.json({message: "Utilisateur non trouve"});
    }
    res.send(req.params.id);

    // const donnees = require("./data/donneesTest.js")
    // res.statusCode = 200;
    // res.json(donnees);
});


// Doit etre la derniere !!
// Gestion page 404 - requete non trouvee
server.use((req, res) => {
    res.statusCode = 404;
    // res.end("Requete non trouvee.");

    // avec mustache
    res.render("404", { url: req.url});
});

server.listen(process.env.PORT, () => {
    console.log("Le serveur a démarré.")
});

