import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_SERVER_URL } from "../constants/urlConstants";
import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";
import {
  getAllNotifications,
  deleteAllNotifications,
} from "../services/notifications/notificationAPI";

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { currentUser } = useAuth();

  // console.log(notifications);

  useEffect(() => {
    if (currentUser && currentUser.id) {
      const newSocket = io(SOCKET_SERVER_URL);
      setSocket(newSocket);

      getAllNotifications(currentUser.id)
        .then((notifications) => setNotifications(notifications))
        .catch((error) => console.error(error));

      return () => {
        newSocket.disconnect();
      };
    }
  }, [currentUser]);

  useEffect(() => {
    if (socket === null || !currentUser || !currentUser.id) return;

    socket.emit(
      "addNewUser",
      currentUser.id,
      currentUser.company_id,
      currentUser.role
    );

    return () => {};
  }, [socket, currentUser]);

  useEffect(() => {
    if (socket === null) return;

    socket.on("agentJobApply", (data) => {
      toast.success(`Thông báo mới: ${data.message}`);
      setNotifications((prev) => [data, ...prev]);
    });

    socket.on("userAcceptJobApply", (data) => {
      toast.success(`Thông báo mới: ${data.message}`);
      setNotifications((prev) => [data, ...prev]);
    });

    socket.on("userDenyJobApply", (data) => {
      toast.error(`Thông báo mới: ${data.message}`);
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      socket.off("agentJobApply");
      socket.off("userAcceptJobApply");
      socket.off("userDenyJobApply");
    };
  }, [socket]);

  const handleReadAllNotifications = () => {
    setNotifications([]);
    deleteAllNotifications(currentUser.id)
      .then(setNotifications([]))
      .catch((error) => console.error(error));
  };

  return (
    <SocketContext.Provider
      value={{ socket, notifications, handleReadAllNotifications }}
    >
      {children}
    </SocketContext.Provider>
  );
};

function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined)
    throw new Error("SocketContext was used outside the SocketProvider");
  return context;
}

export { SocketProvider, useSocket };
