const express = require("express");

const bcrypt = require("bcrypt");
const fs = require("fs");
const session = require("express-session");

// Create the Express app
const app = express();

// Use the 'public' folder to serve static files
app.use(express.static("public"));

// Use the json middleware to parse JSON data
app.use(express.json());

// Use the session middleware to maintain sessions
const chatSession = session({
    secret: "game",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 300000 }
});
app.use(chatSession);

// This helper function checks whether the text only contains word characters
function containWordCharsOnly(text) {
    return /^\w+$/.test(text);
}

// Handle the /register endpoint
app.post("/register", (req, res) => {
    // C. Get the JSON data from the body
    const { username, avatar, name, password } = req.body;

    // D. Reading the users.json file
    const users = JSON.parse(fs.readFileSync("data/users.json"));

    // E. Checking for the user data correctness
    if( !username || !avatar || !name || !password) {
        res.json({ status: "error", error: "Username/avatar/name/password cannot be empty" });
        return;
    }

    if(!containWordCharsOnly(username)) {
        res.json({ status: "error", error: "The username should contains only underscores, letters or numbers" });
        return;
    }

    if(username in users) {
        res.json({ status: "error", error: "Same username already exist!" });
        return;
    }

    // G. Adding the new user account
    const hash = bcrypt.hashSync(password, 10);
    users[username] = {avatar, name, password: hash}

    // H. Saving the users.json file
    fs.writeFileSync("data/users.json", JSON.stringify(users, null, " "))

    // I. Sending a success response to the browser
    res.json({status: "success"})

});

// Handle the /signin endpoint
app.post("/signin", (req, res) => {
    // C. Get the JSON data from the body
    const { username, password } = req.body;

    // D. Reading the users.json file
    const users = JSON.parse(fs.readFileSync("data/users.json"));

    // E. Checking for username/password
    if(!(username in users)) {
        res.json({ status: "error", error: "Incorrect Username / password!" });
        return;
    }

    const user = users[username];

    if (!bcrypt.compareSync(password, user.password)) {
        res.json({ status: "error", error: "Incorrect Username / password!" });
        return;
    }

    req.session.user = {username, avatar: user.avatar, name: user.name};

    // G. Sending a success response with the user account
    res.json({ status: "success", user: {username, avatar: user.avatar, name: user.name}});
});

// Handle the /validate endpoint
app.get("/validate", (req, res) => {

    // B. Getting req.session.user    
    // D. Sending a success response with the user account
    if(req.session.user)
        res.json({ status: "success", user: req.session.user});
    else 
        res.json({ status: "error", error: "You have not signed in!"});

});

// Handle the /signout endpoint
app.get("/signout", (req, res) => {

    // Deleting req.session.user
    req.session.user = null;

    // Sending a success response
    res.json({ status: "success"});
    
});


// ***** Please insert your Lab 6 code here *****
const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer( app );
const io = new Server(httpServer);

const onlineUsers = {};

io.on("connection", (socket) => {
    // add new user to online user list
    const user = socket.request.session.user;
    if(user){
        // broadcast added user
        io.emit("add user", JSON.stringify(user)) ;
        // add to the list
        const {username, avatar, name} = user;
        onlineUsers[username] = {avatar, name};
    }

    socket.on("disconnect", () => {
        const user = socket.request.session.user;
        if(user){
            // broadcast deleted user
            io.emit("remove user", JSON.stringify(user)) ;
            // delete from the list
            delete onlineUsers[user.username];
        }
    })

    socket.on("typing", () => {
        const user = socket.request.session.user;
        if(user){
            io.emit("send typing", JSON.stringify(user));
        }
    })

    socket.on("get users", () => {
        socket.emit("users", JSON.stringify(onlineUsers)) ;
    })

    socket.on("get messages", () => {
        const chatroom = fs.readFileSync("data/chatroom.json", "utf-8");
        socket.emit("messages", chatroom);
    })

    socket.on("post message", (content) => {
        if(socket.request.session.user){
            const json = {user, datetime: new Date(), content};
            const chatroom = JSON.parse(fs.readFileSync("data/chatroom.json"));
            chatroom.push(json);
            fs.writeFileSync("data/chatroom.json", JSON.stringify(chatroom, null, " "))
            io.emit("add message", JSON.stringify(json));
        }
    })
})

// Use the session in the Socket.IO server
io.use((socket, next) => {
    chatSession(socket.request, {}, next);
});


// Use a web server to listen at port 8000
httpServer.listen(8000, () => {
    console.log("The chat server has started...");
});
