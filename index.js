const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectID;
const fileUpload = require('express-fileupload');
const app = express();
const fs = require('fs-extra');
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('doctors'));
app.use(fileUpload());

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@doctotor-portal.agqwj.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


app.get('/', (req, res) =>{
    res.send('its working');
})


const client = new MongoClient(uri, { useNewUrlParser: true,useUnifiedTopology: true });
client.connect(err => {
  const appointmentCollection = client.db("doctors-portal").collection("appointment");
  const doctorsCollection = client.db("doctors-portal").collection("doctors");
  console.log("connected server")
    app.post('/addAppointment', (req,res) =>{
        const newAppointment = req.body;
        appointmentCollection.insertOne(newAppointment)
        .then(result =>{
            console.log(result);
            res.send(result.insertedCount > 0)
        })
    }) //app.post /addAppointment --- end

    app.post('/appointmentByDate', (req,res) =>{
        const date = req.body;
        appointmentCollection.find({appointmentDate : date.dateString})
        .toArray( (err,documents) => {
            res.send(documents)
            console.log("documents : ",documents);
        })
        
    })

    app.get('/appointments',(req, res) =>{
        appointmentCollection.find({})
        .toArray( (err,documents) =>{
            if(err){
                console.log(err);
            }
            res.send(documents)
        })
    })

    app.patch('/update/:id', (req, res) => {
        console.log(req.body.price);
        productCollection.updateOne({ _id: ObjectId(req.params.id) },
          {
            $set: { price: req.body.price, quantity: req.body.quantity }
          })
          .then(result=> {
            res.send(result.matchedCount > 0)
          })
      })

      app.post('/addADoctor',(req,res)=>{
          const file = req.files.file;
          const name = req.body.name;
          const email = req.body.email;
          const phone = req.body.phone;
          const filePath = `${__dirname}/doctors/${file.name}`;

          console.log('file: ',file,"name: ", name,"email : ", email,phone);

          file.mv(filePath, err =>{
              if(err){
                  console.log(err);
                  return res.status(500).send("failed to upload image")
              }
              const newImg = fs.readSync(filePath);
              const encImg = newImg.toString('base64');

              var image = {
                  contentType: req.files.file.mimetype,
                  size: req.files.file.size,
                  img: Buffer(encImg, 'base64')
              };
               
              doctorsCollection.insertOne({name,email,phone,image})
              .then(result => {
                  fs.remove(filePath,error =>{
                      if(error){
                          console.log(error);
                          return res.status(500).send("failed to upload image to database")
                        }
                      res.send(result.insertedCount > 0);
                      console.log('databse image done');
                  })
                
              })

          }) // file.mv end
      })

});


app.listen(process.env.PORT || 5000)