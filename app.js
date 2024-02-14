// NAO ESQUECER DAS VALIDATIONS E DO MEU TRY E CATCH
// criar um servidor
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const mustacheExpress = require("mustache-express");
const db = require("./config/db.js")
const { check, validationResult } = require("express-validator");
const { error } = require("console");


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

server.post("/utilisateurs/inscription", [
        check("courriel").escape().trim().notEmpty().isEmail().normalizeEmail(),
        check("mdp").escape().trim().notEmpty().isLength({min:8, max:20}).isStrongPassword({minLength:8, minLowercase:1, minNumbers:1, minUppercase:1, minSymbols:1})
    ], async (req, res) => {
        // On recupere les infos du body
        const validation = validationResult(req);
        // console.log(validation);
        // console.log(validation.errors[0].path);
        const errors = [];
        if (validation.errors.length > 0) {
            for (let i = 0; i < validation.errors.length; i++) {
                console.log(validation.errors[i].path);
                errors[i] = validation.errors[i].path;
            }

            // Obter um array com todos os erros. Porem cada campo pode ter mais de um erro e por isos gerara duplicatas
            console.log(errors);
            errorsFinale = [];

            for (let i = 0; i < errors.length; i++) {
                if (errors[i] != errors[i -1]) {
                    errorsFinale.push(errors[i]);
                }
            }

            // Novo array que nao possui duplicatas e ira afficher a mensagem de erros
            console.log(errorsFinale);
            res.statusCode = 400;
            message = (errors.length > 1 ? `Données ${errorsFinale} non-conformees.` : `Donnée ${errorsFinale} non-conforme.`);
            return res.json({message: message});
        }

    // Modo mais longo
    // const courriel = req.body.courriel;
    // const mdp = req.body.mdp;
    const { courriel , mdp } = req.body;

    // On verifie si le courriel existe
    const docRef = await db.collection("utilisateurs").where("courriel", "==", courriel).get();
    const utilisateurs = [];

    docRef.forEach((doc) => {
        utilisateurs.push(doc.data());
    });
    console.log(utilisateurs);
    
    // Si oui, erreur,
    if (utilisateurs.length > 0) {
        res.statusCode = 400;
        return res.json({message: "Le courriel existe déja."});
    }
    // On valide/nettoie la donnés
    // On encrypte le mot de passe
    // On enregistre
    // ps.: usamos versao rapida porque chaves e valores tem o mesmo nome
    const nouvelUtilisateur = { courriel, mdp };
    await db.collection("utilisateurs").add(nouvelUtilisateur);

    delete nouvelUtilisateur.mdp;

    // On reenvoie true
    res.statusCode = 200;
    res.json(nouvelUtilisateur);

    // Bom para testar se estamos entrando aqui, antes de comecar o exercicio
    // res.json("patate");
});

server.post("/utilisateurs/connexion", async (req, res) => {
    // On recupere les infos du body
    const { courriel , mdp } = req.body;

    // On verifie si le courriel existe
    const docRef = await db.collection("utilisateurs").where("courriel", "==", courriel).get();
    const utilisateurs = [];

    docRef.forEach((doc) => {
        utilisateurs.push(doc.data());
    });
    console.log(utilisateurs);

    // Si non, erreur,
    if (utilisateurs.length == 0) {
        // A pessoa fez uma demanda errada
        res.statusCode = 400;
        return res.json({message: "Courriel invalide."});
    }

    const utilisateurAValider = utilisateurs[0];

    // MAIS TARDE : On encrypte le mot de passe

    // On compare
    // Si pas pareil, erreur
    if (utilisateurAValider.mdp !== mdp) {
        res.statusCode = 400;
        return res.json({message: "Mot de passe invalide."});
    }

    // On retourne les infos de l'utilisateur sans le mot de passe
    res.statusCode = 200;
    delete utilisateurAValider.mdp;
    res.json(utilisateurAValider);

    // Bom para testar se estamos entrando aqui
    // res.json("legume");
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


// Validacoes para os filmes
// nao esquecer o opcional na edicao
// titulo : string, nao esta vazio, exists?, 
// genres : exists?, 
// description : exists?
// annee : exists?, é data 
// realisation : exists?
// titreVignette : exists?
// 
//


