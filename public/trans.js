// // const socket = io();

// socket.on("connect", () => {
//   console.log("connected with server.");
// });

// socket.on("newUserResponse", (newUser) => {
//   // console.log("qweqwe");
//   localStorage.setItem("user", newUser.userName);
//   const Users = newUser.map((item) => item.userName);
//   console.log(Users);
// });

// const sendMessage = () => {
//   const input = document.getElementById("name");
//   const data = {
//     userName: input.value,
//     socketID: socket.id,
//   };
//   socket.emit("newUser", data);
//   let gameLoop = setInterval(main, FLAME);
//   // input.value = "";
// };
