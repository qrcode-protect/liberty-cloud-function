const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
        user: "liberty.app59@gmail.com",
        pass: "gjimzmzmehkadwlu",
    }
})

exports.sendMailGmail = functions.https.onCall(async (data, context) => {
  const id = data.id;
  const destination = data.destination;

  const mailOptions = {
    from: "admin@li-berty.fr",
    to: destination,
    subject: "Inscriptions Li-Berty", 
    html:   `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; 
                        width: 800px;
                        display: table;
                        margin: 0 auto;
                        text-align: center;
                    }
                    
                    h1 {
                        font-size: 45px;
                        font-weight: lighter; 
                        text-transform: uppercase;
                        color: rgb(98, 122, 241);
                    }
                    h1>span{
                        color: rgba(68, 89, 191, 1);
                    }
                    p {
                        font-size: 18px;
                    }
                    .felicitation{
                        font-size: 30px; 
                        font-weight: bolder; 
                        color: rgba(68, 89, 191, 1);
                    }
                    .colored {
                        color: rgb(98, 122, 241);
                    }
                    .finaliser{
                        font-size: 20px; 
                        font-weight: bolder; 
                        color: rgba(68, 89, 191, 1);
                    }
                    table {
                        display: inline-flex;
                        margin-bottom: 25px;
                    }
                    ul {
                        display: inline-block; 
                        color: rgb(98, 122, 241);
                    }
                    a {
                        margin: 0 auto;
                        align-self: center; 
                        background-color: rgba(68, 89, 191, 1); 
                        padding: 20px; 
                        border: 0px; 
                        text-decoration: none;
                        border-radius: 10px;
                    }
                    .link-text{
                        color: rgb(255, 255, 255); 
                        font-weight: bolder; 
                        font-size: 22px; 
                    }
                </style>
            </head>
                <body>
                    <h1><span>Li-</span>Berty</h1>
                    <p >
                        <span class="felicitation">Félicitation, </span> <br>
                        votre inscription est bientôt validée.
                    </p>
                    <p class="colored">
                        Plus qu'une étape pour 
                        <span class="finaliser">finaliser votre inscription</span>
                    </p>
                    
                    <p> Munissez vous de : </p>
                    <p>

                        &bull; Votre pièce d'identité <br>
                        &bull; Votre K-BIS <br>
                        &bull; Votre RIB <br>
                        &bull; Vos diplômes (si necessaire) 
                    </p>
                    
                    <br>

                    <a href="https://prestataires.contact.li-berty.fr/register?id=${id}"> 
                        <span class="link-text">Finaliser mon inscription !</span>
                    </a>
                    <br>
                    <br>
                </body>
            </html>
            `
    };

    return transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return error;
        } 
            return info;
        },
    )
})



exports.sendMailUserCreated = functions.https.onCall(async (data, context) => {
    try {
        const mail = data.mail;
        const password = data.password;
        const link = data.link;

        mailOptions = {
            from: "admin@li-berty.fr",
            to: mail,
            subject: "Compte Li-Berty crée", 
            html:   `
                    <h2> Votre compte Li-Berty à été validé et crée </h2>
                    <p> 
                        Vous pouvez vous connecter avec les identifiants suivants : <br>
                        Email : ${mail} <br>
                        Mot de passe : ${password} <br>
                    </p>
                    <a href="${link}"> Téléchargez l'application (Uniquement sur Android) </a>
                    <p> Si vous disposez uniquement d'un iPhone, appelez notre service livraison <p>
                    `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return error;
            } 
                return info;
            },
        );
    } catch (error) {
        throw error;
    }
});