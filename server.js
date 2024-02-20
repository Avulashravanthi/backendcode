const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const cors = require('cors');
const dotenv=require('dotenv');
const multer = require('multer');
const path = require('path');

dotenv.config();
//const userController = require('./userControllers')
const app = express();


// Middleware
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: "GET,POST,OPTIONS",
  preflightContinue: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
//app.use('/api/users', userController);


// Database Connection
(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mydatabase', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
})();

//Define MongoDB Schema and Model (for example, User)
const userSchema = new mongoose.Schema({
  name: String,
  phoneNumber: Number,
  dob: Date,
  pob: String,
  tob: String,
  photo: {
    data: Buffer,
    contentType: String,
  }
});

const User = mongoose.model('User', userSchema);


app.post('/api/register', async (req, res, next) => {
  try {
    // Validation (example: check if 'tob' is a valid date)
    const dob = new Date(req.body.dob);
    console.log('dob');
    console.log(req.body)
    console.log(dob);
    console.log(dob.getTime())
   if (isNaN(dob.getTime())) {
      throw new Error('Invalid date string for "tob"');
    }
   
   const newUser = new User(req.body);
   
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

app.get('/api/allusers', async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

app.put('/api/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, phoneNumber, dob, pob, tob, photo } = req.body;

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields
    user.name = name;
    user.phoneNumber = phoneNumber;
    user.dob = dob;
    user.pob = pob;
    user.tob = tob;
    user.photo = photo;

    // Save the updated user
    await user.save();

    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Rename file with timestamp
  }
});// Multer storage configuration


const upload = multer({ storage: storage });

// Route to handle photo upload
app.post('/api/upload', upload.single('photo'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw new Error('No file uploaded');
    }

    const newUser = new User({
      name: req.body.name,
      phoneNumber: req.body.phoneNumber,
      dob: req.body.dob,
      pob: req.body.pob,
      tob: req.body.tob,
      photo: {
        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
        contentType: 'image/jpeg'
      }
    });

    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
});

// Define Appointment Schema
const appointmentSchema = new mongoose.Schema({
  appointmentDate: Date,
  appointmentTime: String,
  duration: String,
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

//appointment routes
app.post('/api/appointments', async (req, res) => {
  try {
    const { appointmentDate, appointmentTime, duration } = req.body;
    const newAppointment = new Appointment({
      appointmentDate,
      appointmentTime,
      duration,
    });
    await newAppointment.save();
    res.status(201).json({ message: 'Appointment booked successfully' });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Route handler to book video call appointment
app.post('/api/video-appointments', async (req, res) => {
  try {
    const { videoCallDate, videoCallTime } = req.body;
    const newVideoAppointment = new Appointment({
      appointmentDate: videoCallDate,
      appointmentTime: videoCallTime,
      duration: 'Video Call', // You might want to specify the duration differently for video call appointments
    });
    await newVideoAppointment.save();
    res.status(201).json({ message: 'Video Call Appointment booked successfully' });
  } catch (error) {
    console.error('Error booking video call appointment:', error);
    res.status(500).json({ error: 'Failed to book video call appointment' });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

///Define a schema and model for questions
const questionSchema = new mongoose.Schema({
  question1: String,
  question2: String,
  question3: String,
  // Add more fields if needed
});

const Question = mongoose.model('Question', questionSchema);

// Route to handle question submission
app.post('/api/questions', async (req, res) => {
  try {
      const { question1, question2, question3 } = req.body;
      const newQuestion = new Question({
          question1,
          question2,
          question3,
      });
      await newQuestion.save();
      res.status(201).json({ message: 'Questions submitted successfully' });
  } catch (error) {
      console.error('Error submitting questions:', error);
      res.status(500).json({ error: 'Failed to submit questions' });
  }
});
// app.post('/api/questions', (req, res) => {
//   const { question1, question2, question3 } = req.body;

//   // Here you can save the questions to a database or perform any other necessary actions
//   console.log('Received questions:', { question1, question2, question3 });

//   // Send a response indicating success
//   res.status(200).send('Questions received and processed successfully');
// });ss
app.get('/api/questions', async (req, res) => {
  try {
      // Assuming you have a MongoDB setup and using Mongoose for querying
      const questions = await Question.find(); // Assuming "Question" is your Mongoose model
      res.status(200).json(questions);
  } catch (error) {
      console.error('Error fetching questions:', error);
      res.status(500).send('Failed to fetch questions');
  }
});



// //fetching the profile details
// app.get('/api/user/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json(user);
//   } catch (error) {
//     console.error('Error fetching user details:', error);
//     res.status(500).json({ error: 'Failed to fetch user details' });
//   }
// });

// Fetching the profile details using Date of Birth (dob)
app.get('/api/getusers', async (req, res) => {
  User.find()
  .then(users=>res.json(users))
  .catch(err=>res.json(err))
})
  // try {
  //   const { dob } = req.params;
  //   const user = await User.findOne({ dob });
  //   if (!user) {
  //     return res.status(404).json({ error: 'User not found' });
  //   }
  //   res.json(user);
  // } catch (error) {
  //   console.error('Error fetching user details:', error);
  //   res.status(500).json({ error: 'Failed to fetch user details' });
  // }
//});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => { 
  console.log(`Server is listening on port ${PORT}`);
});
