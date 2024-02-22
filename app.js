// Créer un serveur
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const cors = require("cors");
const db = require("./config/db.js");
const { check, validationResult } = require("express-validator");

// Configurations
dotenv.config();
const server = express();
server.set("views", path.join(__dirname, "views"));
server.set("view engine", "mustache");
server.engine("mustache", mustacheExpress());

// Middlewares
server.use(cors());
server.use(express.static(path.join(__dirname, "public")));
server.use(express.json());

// Importation initial de la base de données 'utilisateurs'
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

// Importation initial de la base de données 'films'
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
        // Faire la recherche avec le tri et l'ordre
        // Definition de tri par default titre
        let tri = req.query["tri"] || 'titre';
        
        // Validation du tri
        if ((tri != 'titre' && tri != 'annee' && tri != 'realisation') || tri == '' || !tri) {
            tri = "titre";
        }
        
        // Definition de ordre par default asc
        let ordre = req.query["ordre"] || 'asc';

        // Validation de l'ordre
        if ((ordre != 'asc' && ordre != 'desc') || ordre == '' || !ordre) {
            ordre = "asc";
        }

        const donneesRef = await db.collection("films").orderBy(tri, ordre).get();

        // Tableau finale avec les films
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
        // Récupérer l'identifiant inséré dans la requête
        const id = req.params.id;

        // Récupérer le film correspondant à l'identifiant saisi
        const film = await db.collection("films").doc(id).get();
        const filmId = film.data();

        if (filmId != undefined && film) {
            res.statusCode = 200;
            res.json(filmId);
        } else {
            res.statusCode = 404;
            res.json({message: "Film non trouvé."});
        }
    } catch (e) {
        res.statusCode = 500;
        res.json({message: "Une erreur est survenue. Notre système n'a pas pu récupérer le film avec l'id demandée."});
    }
});

/**
 * @method POST
 * Ajoute un nouveau film à la liste de films
 */
server.post("/api/films", 
[
    check("titre").escape().trim().notEmpty().isString(),
    check("genres").escape().trim().notEmpty(),
    check("description").escape().trim().notEmpty().isString(),
    check("annee").escape().trim().notEmpty().isInt(),
    check("titreVignette").escape().trim().notEmpty().isString()
],
async (req, res) => {
    try {
        // Après avoir validé chaque champ saisi par l'utilisateur, le code vérifie s'il y a eu des échecs de validation
        const validation = validationResult(req);
        if (validation.errors.length > 0) {
            res.statusCode = 400;
            return res.json({message: "Données non-conforme."});
        }

        const film = req.body;

        // Récupérer le titre saisi par l'utilisateur
        const filmTitre = req.body.titre;

        // Avant d'insérer le film saisi par l'utilisateur, le code vérifie si le titre existe déjà dans la base de données
        const filmExisteDeja = await db.collection("films").where("titre", "==", filmTitre).get(); 

        // Si le titre existe déjà
        if (!filmExisteDeja.empty) {
            res.statusCode = 400;
            return res.json({ message: "Le titre existe déjà dans la base de données." });
        }

        // Si le titre n'existe pas, le film peut être ajouté à la base de données
        const nouveauFilm = await db.collection("films").add(film);

        res.statusCode = 200;
        res.json({ message: `Le film avec l'id ${nouveauFilm.id} a été ajouté.` });
    } catch (e) {
        res.statusCode = 500;
        res.json({message: "Notre système n'a pas pu insérer les données envoyées."});
    }
});

/**
 * @method PUT
 * Modifie le film ayant l'identifiant :id
 */
server.put("/api/films/:id", 
[
    check("titre").escape().trim().notEmpty().isString().optional(),
    check("genres").escape().trim().notEmpty().optional(),
    check("description").escape().trim().notEmpty().isString().optional(),
    check("annee").escape().trim().notEmpty().isInt().optional(),
    check("titreVignette").escape().trim().notEmpty().isString().optional()
],
async (req, res) => {
    try {
        const id = req.params.id;
        
        // Récupérer le film correspondant à l'identifiant saisi
        const film = await db.collection("films").doc(id).get();
        const filmId = film.data();
        
        // Si le film existe, on doit faire la validation des données
        if (filmId != undefined && film) {
            const filmModifiee = req.body;

            const validation = validationResult(req);
            if (validation.errors.length > 0) {
                res.statusCode = 400;
                return res.json({message: "Données non-conforme."});
            }
            
            // Si est valide, on accepte la modification
            await db.collection("films").doc(id).update(filmModifiee);
        
            res.statusCode = 200;
            res.json({message: "La donnée a été modifiée."})
        } else {
            res.statusCode = 404;
            res.json({message: "Film non trouvé."});
        }
    } catch (e) {
        res.statusCode = 500;
        res.json({message: "Notre système n'a pas pu modifier les données envoyées."});
    }
});


/**
 * @method DELETE
 * Supprime le film ayant l'identifiant :id de la base de données
 */
server.delete("/api/films/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const film = await db.collection("films").doc(id).get();
        const filmDeleteData = film.data();
    
        if (filmDeleteData != undefined && film) {    
            const filmDelete = await db.collection("films").doc(id).delete();
            res.statusCode = 200;
            res.json({message: `Le document avec l'id ${id} a été supprimé.`});
        } else {
            res.statusCode = 404;
            res.json({message: "Film non trouvé."});
        }    
    } catch(e) {
        res.statusCode = 500;
        res.json({message: "Erreur."});
    }
});

/**
 * @method POST
 * Ajouter un nouvel utilisateur
 */
server.post("/api/utilisateurs/inscription",
[
    check("courriel").escape().trim().notEmpty().isEmail().normalizeEmail(),
    check("mdp").escape().trim().notEmpty().isLength({min:8, max:20}).isStrongPassword({minLength:8, minLowercase:1, minNumbers:1, minUppercase:1, minSymbols:1})
],
async (req, res) => {
    try{
        // Validation
        const validation = validationResult(req);
        if (validation.errors.length > 0) {
            res.statusCode = 400;
            return res.json({message: "Données non-conforme."});
        }
    
        const { courriel , mdp } = req.body;
    
        const docRef = await db.collection("utilisateurs").where("courriel", "==", courriel).get();
        const utilisateurs = [];
    
        docRef.forEach((doc) => {
            utilisateurs.push(doc.data());
        });
    
        // Assurrer que le courriel n'existe pas dans la BD
        if (utilisateurs.length > 0) {
            res.statusCode = 400;
            return res.json({message: "Le courriel existe déja dans notre système."});
        }
    
        const utilisateur = { courriel, mdp };
        const nouvelUtilisateur = await db.collection("utilisateurs").add(utilisateur);
    
        // Retourner la message sans le mot de passe
        delete utilisateur.mdp;
    
        res.statusCode = 200;
        res.json({ message: `L'utilisateur avec l'id ${nouvelUtilisateur.id} a été ajouté.` });
    } catch (e) {
        res.statusCode = 500;
        res.json({message: "Notre système n'a pas pu insérer les données envoyées."});
    }
});


/**
 * @method POST
 * Établir une connexion
 */
server.post("/api/utilisateurs/connexion", async (req, res) => {
    try {
        const { courriel , mdp } = req.body;
    
        // Verifier si le courriel existe
        const docRef = await db.collection("utilisateurs").where("courriel", "==", courriel).get();
        const utilisateurs = [];
    
        docRef.forEach((doc) => {
            utilisateurs.push(doc.data());
        });
    
        if (utilisateurs.length == 0) {
            res.statusCode = 400;
            return res.json({message: "Courriel invalide."});
        }
    
        const utilisateurAValider = utilisateurs[0];
    
        if (utilisateurAValider.mdp !== mdp) {
            res.statusCode = 400;
            return res.json({message: "Mot de passe invalide."});
        }
    
        // Retourner les infos de l'utilisateur sans le mot de passe
        res.statusCode = 200;
        delete utilisateurAValider.mdp;
        res.json({message: `Connexion établie avec l'utilisateur ${utilisateurAValider.courriel}.`});
    } catch (e) {
        res.statusCode = 500;
        res.json({message: "Erreur."});
    }
});


// Gestion page 404 - requete non trouvee
server.use((req, res) => {
    res.statusCode = 404;

    res.render("404", { url: req.url});
});

server.listen(process.env.PORT, () => {
    console.log("Le serveur a démarré.")
});

