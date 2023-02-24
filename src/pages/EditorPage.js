import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";

import Client from "../components/Client";
import Editor from "../components/Editor";
import ACTIONS from "../Actions";
import { initScoket } from "../socket";
import { Socket } from "socket.io-client";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState();

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initScoket();
      socketRef.current.on("connect_error", (err) => handleError(err));
      socketRef.current.on("connect_failed", (err) => handleError(err));

      function handleError(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // Listening for joined events
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room`);
            console.log(`${username} joined`);
          }
          setClients(clients);
        }
      );

      //listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();

    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.DISCONNECTED);
      socketRef.current.disconnect();
    };
  }, []);

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/code-editor.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn">Copy Room Id</button>
        <button className="btn leaveBtn">Leave</button>
      </div>
      <div className="editorWrap">
        <Editor socketRef={socketRef} roomId={roomId} />
      </div>
    </div>
  );
};

export default EditorPage;
