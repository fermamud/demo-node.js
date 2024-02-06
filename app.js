// NAO ESQUECER DAS VALIDATIONS E DO MEU TRY E CATCH

// Créer un serveur
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const db = require("./config/db.js")

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

// Importation de la base de données 'utilisateurs'
server.post("/utilisateurs/initialiser", (req, res) => {
    try {
        const utilisateursTest = require("./data/utilisateursTest.js");

        utilisateursTest.forEach(async (element) => {
            await db.collection("utilisateurs").add(element);
        });
    
        res.statusCode = 200;
        res.json({message: "Donneeés initialisées."});
    } catch (e) {
        res.statusCode = 500;
        
        res.json({message: "Une erreur est survenue. L'importation de votre base de données a échoué."});
    }
});

// Importation de la base de données 'films'
server.post("/donnees/initialiser", (req, res) => {
    try {
        const donneesTest = require("./data/donneesTest.js");

        donneesTest.forEach(async (element) => {
            await db.collection("films").add(element);
        });
    
        res.statusCode = 200;
        res.json({message: "Donneeés initialisées."});
    } catch (e) {
        res.statusCode = 500;
        
        res.json({message: "Une erreur est survenue. L'importation de votre base de données a échoué."});
    }
});

// Points d'acces
/**
 * @method GET
 * Avoir une liste de tous les films
 */
server.get("/api/films", async (req, res) => {
    try {
        console.log(req.query);

        const tri = req.query["tri"] || 'titre';
        const ordre = req.query["ordre"] || 'asc';


        const donneesRef = await db.collection("films").orderBy(tri, ordre).get();

        //http://localhost:3301/api/films/?tri=annee&ordre=asc
        
        const donneesFinale = [];

        donneesRef.forEach((doc) => {
            donneesFinale.push(doc.data());
        });

        res.statusCode = 200;
        res.json(donneesFinale);
    } catch (e) {
        res.statusCode = 500;
        
        res.json({message: "Une erreur est survenue. Notre système n'a pas pu récupérer les informations demandées."});
    }
});

/**
 * @method GET
 * @params id
 * Permet d'acceder a un film par l'id
 */
server.get("/api/films/:id", async (req, res) => {
    try {
        console.log(req.params.id);
        const id = req.params.id;

        const film = await db.collection("films").doc(id).get();
    
        if (film) {
            const filmId = film.data();
            res.statusCode = 200;
            res.json(filmId);
        } else {
            res.statusCode = 404;
            res.json({message: "Film non trouvé."});
        }
        //res.send(req.params.id);
    } catch (e) {
        res.statusCode = 500;
        
        res.json({message: "Une erreur est survenue. Notre système n'a pas pu récupérer le film avec l'id demandée."});
    }
});

/**
 * @method POST
 */
// server.post("/donnees", async (req, res) => {
//     try {
//         const test = req.body;

//         // Validation des donnees
//         if (test.user == undefined) {
//             res.statusCode = 400;
//             return res.json({message: "Vous devex fournir un utilizateur."});
//         }

//         await db.collection("test").add(test);
    
//         res.statusCode = 201;
//         res.json(test);
//     } catch (error) {
//         res.statusCode = 500;
//         res.json({message: "erreur"});
//     }
// });

/**
 * @method DELETE
 */
// server.delete("/donnees/:id", async (req, res) => {
//     const id = req.params.id;

//     const resultat = await db.collection("test").doc(id).delete();

//     res.statusCode = 200;
// });

/**
 * @method PUT
 */
// server.put("/donnees/:id", async (req, res) => {
//     const id = req.params.id;
//     const donneesModifiees = req.body;
//     // Validation ici

//     await db.collection("test").doc(id).update(donneesModifiees);

//     res.statusCode = 200;
//     res.json({message: "La donnée aété modifiée."})
// });

// Doit etre la derniere !!
// Gestion page 404 - requete non trouvee

server.use((req, res) => {
    res.statusCode = 404;

    res.render("404", { url: req.url});
});

server.listen(process.env.PORT, () => {
    console.log("Le serveur a démarré.")
});

