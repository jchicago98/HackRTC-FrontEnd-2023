document.addEventListener("DOMContentLoaded", function () {
    const chatMessages = document.getElementById("chatMessages");
    const messageInput = document.getElementById("messageInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");
    const chatList = document.getElementById("chatList");
  
    let activeChat = null;
    let currentCallId = null;
    const chatHistory = {}; // Store chat history for each phone number
  
    // Create a WebSocket connection
    const socket = new WebSocket("ws://localhost:443/");
  
    // Listen for WebSocket messages
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      //console.log(message);
  
      if (message.event === "messageSent" && message.message.from) {
        const phoneNumber = message.message.to; // Use the "to" field for conversation identifier
        if (!chatHistory[phoneNumber]) {
          chatHistory[phoneNumber] = [];
        }
        chatHistory[phoneNumber].push(message);
        if (activeChat === phoneNumber) {
          displayChatHistory(phoneNumber);
        }
        updateChatList();
      } else if (message.user === "user" && message.from) {
        const phoneNumber = message.from;
        if (!chatHistory[phoneNumber]) {
          chatHistory[phoneNumber] = [];
        }
        chatHistory[phoneNumber].push(message);
        if (activeChat === phoneNumber) {
          displayChatHistory(phoneNumber);
        }
        updateChatList();
      }
    });
  
    // Function to display chat history for a specific phone number
    function displayChatHistory(phoneNumber) {
      chatMessages.innerHTML = ""; // Clear previous chat messages
      const history = chatHistory[phoneNumber];
      if (history && history.length > 0) {
        history.forEach((message) => {
          displayMessage(message);
        });
      }
    }
  
    // Function to update the chat list in the sidebar
    function updateChatList() {
      chatList.innerHTML = "";
      Object.keys(chatHistory).forEach((phoneNumber) => {
        const listItem = document.createElement("li");
        listItem.textContent = phoneNumber;
        listItem.dataset.chat = phoneNumber;
        listItem.addEventListener("click", () => {
          activeChat = phoneNumber;
          //console.log(chatHistory[phoneNumber]);
          currentCallId = chatHistory[phoneNumber][1].callId;
          //console.log(currentCallId);
          displayChatHistory(phoneNumber);
        });
        chatList.appendChild(listItem);
      });
    }
  
    // Function to display a message in the chat
    function displayMessage(message) {
        //console.log("Inside displayMessage()",message);
        const messageDiv = document.createElement("div");
        messageDiv.className = "message";
        if (message.event === "messageSent") {
          messageDiv.textContent = `${message.message.from}: ${message.message.body}`;
          if (message.message.from === "You") {
            messageDiv.classList.add("user-message");
          }
        } else if (message.user === "user") {
          messageDiv.textContent = `${message.from}: ${message.body}`;
          messageDiv.classList.add("user-message");
        } else {
          messageDiv.textContent = "Unknown message type";
        }
        chatMessages.appendChild(messageDiv);
      }
  
    // Function to send a message via WebSocket
  function sendMessage() {
    // Get the message text from the input field
    const messageText = messageInput.value.trim(); // Remove leading and trailing spaces

    // Check if the message is not empty
    if (messageText) {
      const dispatcherMessage = {
        callId: currentCallId,
        canChatGPTRespond : false,
        body: messageText
      }

      // Send the message to the server as a JSON string
      socket.send(JSON.stringify(dispatcherMessage));

      // Optionally, clear the input field
      messageInput.value = "";
    }
  }
  
    // Send a message when the Send button is clicked
    sendMessageBtn.addEventListener("click", sendMessage);
  
    // Send a message when the Enter key is pressed
    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    });
  
    // Initialize chat list and display the first chat if available
    updateChatList();
    if (Object.keys(chatHistory).length > 0) {
      activeChat = Object.keys(chatHistory)[0];
      displayChatHistory(activeChat);
    }
  });
  