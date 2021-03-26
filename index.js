const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express()
app.use(cors());
app.use(bodyParser.json());
require('dotenv').config();
console.log(process.env.DB_USER);

var serviceAccount = require("./configs/burj-al-arab-dfbeb-firebase-adminsdk-ey1pq-1c6e3752b1.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tzdv1.mongodb.net/hotelbooking?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookingCollection = client.db("hotelbooking").collection("bookings");

    //create data in database
    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookingCollection.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
        console.log(newBooking);
    })

    //   read or retrieve data from database 
    app.get('/bookings', (req, res) => {
        // console.log(req.query.email);
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1]; //counting the space in 1 index
            console.log({ idToken });
            admin.auth().verifyIdToken(idToken).then((decodedToken) => {
                const tokenEmail = decodedToken.email;
                const reqEmail = req.query.email;
                console.log(tokenEmail, reqEmail);
                if (tokenEmail == reqEmail) {
                    bookingCollection.find({email:req.query.email})
                        .toArray((error, documents) => {
                            res.status(200).send(documents);
                        })
                }
                else {
                    res.status(401).send('Unauthorized Access');
                }
            })
                .catch((error) => {
                    res.status(401).send('Unauthorized Access');
                });
        }

    })
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(4000);