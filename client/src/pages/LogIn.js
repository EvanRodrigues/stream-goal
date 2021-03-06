import React, { useEffect, useState } from "react";
import { Redirect } from "react-router-dom";
import io from "socket.io-client";
import Cookies from "universal-cookie";
import { CLIENT_ID } from "../config/public/publicKeys";

const socketUrl =
    window.location.origin === "http://localhost:3000"
        ? "http://localhost:5001" //dev
        : "https://stream-tools-socket.herokuapp.com/"; //live

export const LogIn = () => {
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        let currentUrl = new URL(window.location.href);
        const code = currentUrl.searchParams.get("code");
        const redirectUri = `${window.location.origin}/LogIn`;

        if (code) {
            const socket = io(
                `${socketUrl}?login=true&code=${code}&redirectUri=${redirectUri}`,
                { transport: ["websocket"] }
            );

            socket.on("userInfo", (eventData) => {
                const accessToken = eventData.token;

                fetch(`https://api.twitch.tv/helix/users`, {
                    headers: {
                        "Client-ID": CLIENT_ID,
                        Authorization: `Bearer ${accessToken}`,
                    },
                })
                    .then((response) => response.json())
                    .then((json) => {
                        const user = json["data"][0]["login"];
                        const cookies = new Cookies();

                        cookies.set("streamToolsUser", user, {
                            path: "/",
                            sameSite: "strict",
                        });

                        setLoggedIn(true);
                        socket.disconnect();
                    });
            });
        }
    }, []);

    if (loggedIn === false) return <></>;
    return (
        <>
            <Redirect to="/" />
        </>
    );
};
