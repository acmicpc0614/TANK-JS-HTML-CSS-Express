console.log("connecting...");
const socket = io("http://localhost:8800");

const sendMessage = () => {
  const input = document.getElementById("name");
  const data = {
    userName: input.value,
    socketID: socket.id,
  };

  socket.emit("newUser", data);
  // input.value = "";
};
