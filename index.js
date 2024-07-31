// Importing libraries
const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
const Task = require("./Models/Task");
const User = require("./Models/User");

// configuring dotenv library in order to use .env file
require("dotenv").config();

//connecting with mongodb atlas
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Middleware to parse data from client
app.use(express.json());
app.use(cookieparser());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    credentials: true,
    origin: "https://task-management-pi08.onrender.com",
  })
);

//Important stuff like keys and salt
const bycryptSalt = bcrypt.genSaltSync(10);
const jwtsecretkey = "dfdfdvddvvdvrgegrge";

// handling client requests
app.post("/register", async (req, res) => {
  const { name, email, password } = await req.body;

  try {
    const userdoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bycryptSalt),
    });

    res.status(200).send(userdoc);
  } catch (e) {
    res.status(422).send(e);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = await req.body;

  const userDoc = await User.findOne({ email: email });
  if (userDoc) {
    const passok = bcrypt.compareSync(password, userDoc.password);
    if (passok) {
      jwt.sign(
        { email: userDoc.email, id: userDoc._id, name: userDoc.name },
        jwtsecretkey,
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token, {
              sameSite: "none",
              secure: true,
            })
            .json(userDoc);
        }
      );
    } else {
      res.status(422).json("pass not ok");
    }
  } else {
    res.status(422).send("error user not found");
  }
});

app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtsecretkey, {}, (err, user) => {
      if (err) throw err;
      res.json(user);
    });
  } else {
    res.json(null);
  }
});
app.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      sameSite: "none",
      secure: true,
    })
    .json(true);
});
app.post("/addTask", (req, res) => {
  const { token } = req.cookies;
  const { title, column, description, status, priority, deadline } = req.body;
  jwt.verify(token, jwtsecretkey, {}, async (err, userData) => {
    if (err) throw err;
    Task.create({
      owner: userData.id,
      category: column,
      title: title,
      description: description,
      status: status,
      priority: priority,
      deadline: deadline,
    })
      .then(res.json("Task Created Successfully"))
      .catch((err) =>
        console.log(
          "some error came while adding task to db at server end . Error : " +
            err
        )
      );
  });
});

app.get("/alltasks", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtsecretkey, {}, async (err, userData) => {
    if (err) throw err;
    const { id } = userData;

    res.json(await Task.find({ owner: id }));
  });
});

app.get("/task/:todoid", async (req, res) => {
  const { todoid } = req.params;

  res.json(await Task.findById(todoid));
});

app.post("/addtask/:column", (req, res) => {
  const { column } = req.params;
  const { token } = req.cookies;
  const data = req.body;
  jwt.verify(token, jwtsecretkey, {}, async (err, userData) => {
    if (err) throw err;
    Task.create({
      owner: userData.id,
      category: column,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      deadline: data.deadline,
    })
      .then(res.json("Task Created Successfully"))
      .catch((err) =>
        console.log(
          "some error came while adding task to db at server end . Error : " +
            err
        )
      );
  });
});

//
app.put("/task/update/:col", async (req, res) => {
  const { col } = req.params;
  const { token } = req.cookies;
  const { id } = req.body;

  jwt.verify(token, jwtsecretkey, {}, async (err, userData) => {
    const task = await Task.findById(id);
    if (userData.id === task.owner.toString()) {
      task.set({
        category: col,
      });
      await task.save();
      res.json("ok");
    }
  });
});

// delete the task using bin button
app.delete("/remove/:todoid", async (req, res) => {
  const { todoid } = req.params;
  await Task.deleteOne({ _id: todoid });
  res.json("deleted successfully");
});
// getting single task
app.get("/task/edit/:id", async (req, res) => {
  const { id } = req.params;

  res.json(await Task.findById(id));
});

app.put("/tasks/:id", async (req, res) => {
  const { token } = req.cookies;
  const { id } = req.params;
  const { title, description, status, priority, deadline } = req.body;

  jwt.verify(token, jwtsecretkey, {}, async (err, userData) => {
    const task = await Task.findById(id);
    if (userData.id === task.owner.toString()) {
      task.set({
        title,
        description,
        status,
        priority,
        deadline,
      });
      await task.save();
      res.json("ok");
    }
  });
});
// listenting server at port 4000
app.listen(process.env.PORT_NUMBER , (err) => {
  if (err) {
    console.log("Some error while starting server: Error = " + err);
  }

  console.log(
    "Server started successfully at port : " + process.env.PORT_NUMBER
  );
});
