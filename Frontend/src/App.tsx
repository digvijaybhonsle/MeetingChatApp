import { useEffect } from "react";
import { io } from "socket.io-client";
import Auth from "./components/auth";

const socket = io("http://localhost:5000");

function App() {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Connected to socket:", socket.id);
    });
  
    socket.on("disconnect", () => {
      console.log("❌ Disconnected from socket");
    });
  
    return () => {
      socket.disconnect();
    };
  }, []);
  

  return (
    <div>
      <Auth />
      <h2 className="text-3xl text-blue">Hello</h2>
    </div>
  )
}

export default App;
