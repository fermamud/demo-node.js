const jwt = require("jsonwebtoken");
const db = require("../config/db");

const auth = async(req, res, next) => {
    try {    // Si le jeton est valide
        // Est-ce qu'il y quelque chose dans l'entete
        if (req.headers.authorization) {
            console.log(req.headers.authorization);
            // Transforme en array et retourne la portion apres Bearer
            // Example d'auth : "Bearer isohdshfdfuidhf.dhsiudshsad"
            const jetonAValider = req.headers.authorization.split(" ")[1];
            const jetonDecode = jwt.verify(jetonAValider, process.env.JWT_SECRET);

            const utilisateurVerifie = await db.collection("utilisateurs").doc(jetonDecode.id).get();

            if (utilisateurVerifie.exists) {
                // Si l'utilisateur existe, on permet la suite de la requete initiale
                const utilisateurRecupere = utilisateurVerifie.data();
                req.utilisateur = utilisateurRecupere;
                // Appele la suite de la requete initiale
                next();
            } else {
                // Si l'utilisateur n'existe pas, on retourne une erreur non authorisée
                // res.statusCode = 401;
                // res.json({"message": "Non autorisé"});
                throw new Error("Non autorisé");
            }
        } else {
            // res.statusCode = 401;
            // res.json({"message": "Non autorisé"});
            throw new Error("Non autorisé");
        }
    } catch (erreur) {
        console.log(erreur);
        res.statusCode = 401;
        res.json({ message: erreur.message });
    }
}

module.exports = auth;