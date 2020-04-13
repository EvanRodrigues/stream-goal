const socketIoClient = require("socket.io-client");
const app = require("express")();
const http = require("http").createServer(app);
const socketIoServer = require("socket.io")(http);

//token, socket
let streamLabsSockets = {};

//token, socket
let clients = {};

socketIoServer.on("connection", (socket) => {
    const token = socket.handshake.query.token;

    if (clients[token] == null) {
        clients[token] = [socket];
    } else clients[token].push(socket);

    console.log(socket.handshake.query.token);

    socket.on("disconnect", () => {
        console.log("a user disconnected!");
    });

    console.log("a user connected!");
});

http.listen(3001, () => {
    console.log("listening on *:3001");
});

//Calculates the value of the sub event in dollars based on the sub_plan.
calcSubs = (subPlan) => {
    if (subPlan === "1000" || subPlan === "Prime") return 5;
    else if (subPlan === "2000") return 10;
    else return 25;
};

//Event handler for the StreamLabs socket api.
handleSocketEvent = (eventData) => {
    let amount;
    let isRepeat;

    //Ignore stream labels general info messages.
    if (
        eventData.type === "streamlabels.underlying" ||
        eventData.type === "streamlabels" ||
        eventData.type === "reload.instant"
    ) {
        return;
    }

    //TODO: Check eventData.message being null.
    try {
        isRepeat = !("repeat" in eventData.message[0]);
    } catch (Err) {}

    //If event is not a repeat.
    if (!!("repeat" in eventData.message[0])) {
        if (eventData.type === "donation")
            //code to handle donation events.
            amount = Number(eventData.message[0].amount);

        if (eventData.for === "twitch_account") {
            let subPlan = 0;

            switch (eventData.type) {
                case "subscription":
                    //code to handle subscription events.
                    subPlan = eventData.message[0].sub_plan;
                    amount = calcSubs(subPlan);
                    break;
                case "resub":
                    //code to handle resub events.
                    subPlan = eventData.message[0].sub_plan;
                    amount = calcSubs(subPlan);
                    break;
                case "bits":
                    //code to handle bit events.
                    const bit_amount = Number(eventData.message[0].amount);
                    amount = bit_amount / 100;
                    break;
                default:
                    //handles all other events (follower, host, etc.)
                    break;
            }
        }

        //TODO: match client with correct socket.
        clients[1].forEach((socket) => {
            console.log(socket);
            socket.emit("event", { amount: amount });
        });
    }
};

module.exports.setUpSocket = (id) => {
    const socket = socketIoClient.connect(
        `https://sockets.streamlabs.com?token=${id}`
    );

    if (streamLabsSockets[id] != null) {
        return;
    }

    socket.on("connect", () => {
        console.log("connected");
    });
    socket.on("event", (eventData) => {
        handleSocketEvent(eventData);
    });

    socket.on("disconnect", () => console.log("disconnected"));

    streamLabsSockets[id] = socket;
};