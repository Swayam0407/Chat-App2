import React, { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const ChatRoom = () => {
  const [socket, setSocket] = useState(null);
  const [privateChats, setPrivateChats] = useState(new Map());
  const [publicChats, setPublicChats] = useState([]);
  const [tab, setTab] = useState("CHATROOM"); 
  const [userData, setUserData] = useState({
    username: "",
    connected: false,
  });
  const [publicMessage, setPublicMessage] = useState("");
  const [privateMessage, setPrivateMessage] = useState("");

  useEffect(() => {
    const newSocket = io("http://localhost:8080");
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      const handlePublicMessage = (msg) => {
        console.log("Public message received:", msg);
        if (msg.status === "JOIN") {
          setPrivateChats((prevChats) => {
            const updatedChats = new Map(prevChats);
            if (!updatedChats.has(msg.senderName)) {
              updatedChats.set(msg.senderName, []);
            }
            return updatedChats;
          });
        } else if (msg.status === "MESSAGE") {
          setPublicChats((prevChats) => [...prevChats, msg]);
        }
      };

      const handlePrivateMessage = (msg) => {
        console.log("Private message received:", msg);
        setPrivateChats((prevChats) => {
          const updatedChats = new Map(prevChats);
          if (
            msg.receiverName === userData.username ||
            msg.senderName === userData.username
          ) {
            if (!updatedChats.has(msg.senderName)) {
              updatedChats.set(msg.senderName, []);
            }
            updatedChats.get(msg.senderName).push(msg);
          }
          return updatedChats;
        });
      };

      socket.on("chatroom/public", handlePublicMessage);
      socket.on("private", handlePrivateMessage);

      return () => {
        socket.off("chatroom/public", handlePublicMessage);
        socket.off("private", handlePrivateMessage);
      };
    }
  }, [socket, userData.username]);

  const connect = useCallback(() => {
    if (userData.username && socket) {
      socket.emit("join", userData.username);
      setUserData((prev) => ({ ...prev, connected: true }));
    }
  }, [userData.username, socket]);

  const sendValue = useCallback(() => {
    if (publicMessage && socket) {
      const message = {
        senderName: userData.username,
        message: publicMessage,
        status: "MESSAGE",
      };
      console.log("Sending public message:", message);
      socket.emit("message", message);
      setPublicMessage("");
    }
  }, [publicMessage, socket, userData.username]);

  const sendPrivateValue = useCallback(() => {
    if (privateMessage && tab !== "CHATROOM" && socket) {
      const message = {
        senderName: userData.username,
        receiverName: tab,
        message: privateMessage,
        status: "MESSAGE",
      };
      console.log("Sending private message:", message);
      socket.emit("private-message", message);

      setPrivateChats((prevChats) => {
        const updatedChats = new Map(prevChats);
        if (!updatedChats.has(tab)) {
          updatedChats.set(tab, []);
        }
        updatedChats.get(tab).push(message);
        return updatedChats;
      });

      setPrivateMessage("");
    }
  }, [privateMessage, tab, socket, userData.username]);

  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <h3>Members</h3>
            <div
              className={`member ${tab === "CHATROOM" ? "active" : ""}`}
              onClick={() => setTab("CHATROOM")}
            >
              Public Chat
            </div>
            {Array.from(privateChats.keys()).map((username) => (
              <div
                key={username}
                className={`member ${tab === username ? "active" : ""}`}
                onClick={() => setTab(username)}
              >
                {username === userData.username ? "You" : username}
              </div>
            ))}
          </div>

          <div className="chat-content">
            <div className="chat-messages">
              {tab === "CHATROOM"
                ? publicChats.map((chat, index) => (
                    <div
                      key={`public-${index}`}
                      className={`message ${
                        chat.senderName === userData.username ? "self" : "other"
                      }`}
                    >
                      <span>{chat.senderName}</span>: {chat.message}
                    </div>
                  ))
                : privateChats.get(tab)?.map((chat, index) => (
                    <div
                      key={`private-${index}`}
                      className={`message ${
                        chat.senderName === userData.username ? "self" : "other"
                      }`}
                    >
                      <span>{chat.senderName === userData.username ? "You" : chat.senderName}</span>: {chat.message}
                    </div>
                  ))}
            </div>
            {tab === "CHATROOM" ? (
              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder="Type a message"
                  value={publicMessage}
                  onChange={(e) => setPublicMessage(e.target.value)}
                />
                <button className="send-button" onClick={sendValue}>
                  Send
                </button>
              </div>
            ) : (
              <div className="send-message">
                <input
                  type="text"
                  className="input-message"
                  placeholder={`Message ${tab}`}
                  value={privateMessage}
                  onChange={(e) => setPrivateMessage(e.target.value)}
                />
                <button className="send-button" onClick={sendPrivateValue}>
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="login">
          <h1>Chat Application</h1>
          <input
            type="text"
            value={userData.username}
            onChange={(e) =>
              setUserData({ ...userData, username: e.target.value })
            }
            placeholder="Enter your username"
          />
          <button onClick={connect}>Connect</button>
          <p id="use">Run on mutilple ports to get chat experience</p>
          <footer>@swayam_aggarwal</footer>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
