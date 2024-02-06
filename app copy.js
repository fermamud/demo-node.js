// NAO ESQUECER DAS VALIDATIONS E DO MEU TRY E CATCH
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

const server = express();

server.set("views", path.join(__dirname, "views"));
server.set("view engine", "mustache");
server.engine("mustache", mustacheExpress());

// Middlewares
// Doit etre avant les routes
server.use(express.static(path.join(__dirname, "public")));
//Permet d'accepter des body eb Json dans les requetes
server.use(express.json());

// Points d'acces
server.get("/donnees", async (req, res) => {
    try {
        // Primeiro teste
        // const test = {email: "fernandafrata@gmail.com"};

        // Sera remplace par un fetch ou un appel a la bd
        //const donnees = require("./data/donneesTest.js");

        console.log(req.query);
        const direction = req.query["order-direction"] || 'asc';
        //const limit = req.query.limit;
        const limit = +req.query["limit"] || 1000;
        //o + substitui o parseInt que transforma o numero da URL em string
        const donneesRef = await db.collection("test").orderBy("user", direction).limit(limit).get();
        //limite esta limitando a resposta em 2
        //order by esta ordenando
        //http://localhost:3301/donnees/?limit=10&order-direction=asc

        const donneesFinale = [];

        donneesRef.forEach((doc) => {
            donneesFinale.push(doc.data());
        });

        res.statusCode = 200;
        res.json(donneesFinale);
    } catch (e) {
        res.statusCode = 500;
        
        res.json({message: "Une erreur est survenue. Meillure chance la prochaine fois."});
    }
});

// Na tp para popular a bd mais rapidamente com boucle e procurando o documento dado
server.post("/donnees/initialiser", (req, res) => {
    const donneesTest = require("./data/donneesTest.js");

    donneesTest.forEach(async (element) => {
        await db.collection("test").add(element);
    });

    res.statusCode = 200;
    res.json({message: "Donneeés initialisées."});
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
});

/**
 * @method POST
 */
server.post("/donnees", async (req, res) => {
    try {
        const test = req.body;

        // Validation des donnees
        if (test.user == undefined) {
            res.statusCode = 400;
            return res.json({message: "Vous devex fournir un utilizateur."});
        }

        await db.collection("test").add(test);
    
        res.statusCode = 201;
        res.json(test);
    } catch (error) {
        res.statusCode = 500;
        res.json({message: "erreur"});
    }
});

/**
 * @method DELETE
 */
server.delete("/donnees/:id", async (req, res) => {
    const id = req.params.id;

    const resultat = await db.collection("test").doc(id).delete();

    res.statusCode = 200;
});

/**
 * @method PUT
 */
server.put("/donnees/:id", async (req, res) => {
    const id = req.params.id;
    const donneesModifiees = req.body;
    // Validation ici

    await db.collection("test").doc(id).update(donneesModifiees);

    res.statusCode = 200;
    res.json({message: "La donnée aété modifiée."})
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

