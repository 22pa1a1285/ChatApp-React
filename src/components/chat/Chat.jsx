import React, { useRef } from "react";
import "./chat.css";
import EmojiPicker from "emoji-picker-react";
import { use } from "react";
import { storage } from "../../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import upload from "../../lib/upload";
import { FaEllipsisV, FaCheck } from "react-icons/fa";

const Chat = () => {
  const [img, setImg] = React.useState({
    file: null,
    url: "",
  });
  const [isUploading, setIsUploading] = React.useState(false);
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const { currentUser } = useUserStore();
  const [chat, setChat] = React.useState();
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");
  const endRef = useRef(null);
  const fileInputRef = useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(null);
  const [editIndex, setEditIndex] = React.useState(null);
  const [editText, setEditText] = React.useState("");
  const [otherUserChatSeen, setOtherUserChatSeen] = React.useState(false);
  const [shouldUploadImage, setShouldUploadImage] = React.useState(false);
  
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);
  
  React.useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      if (res.exists()) {
        setChat(res.data());
      }
    });
    return () => unSub();
  }, [chatId]);

  // Update isSeen for the other user's userchats when opening the chat
  React.useEffect(() => {
    if (!chatId || !user || !currentUser) return;
    
    const updateSeen = async () => {
      try {
        const userChatRef = doc(db, "userchats", user.id);
        const userChatsSnapshot = await getDoc(userChatRef);
        
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(
            (chat) => chat.chatId === chatId
          );
          
          if (chatIndex !== -1) {
            // Update isSeen status
            userChatsData.chats[chatIndex].isSeen = true;
            await updateDoc(userChatRef, {
              chats: userChatsData.chats,
            });
            
            // Update local state
            setOtherUserChatSeen(true);
          }
        }
      } catch (err) {
        console.error("Error updating seen status:", err);
      }
    };
    
    updateSeen();
  }, [chatId, user, currentUser, chat?.messages?.length]);

  // Fetch the other user's userchats to determine if the last message is seen
  React.useEffect(() => {
    if (!chatId || !user || !currentUser) return;
    
    const fetchOtherUserChatSeen = async () => {
      try {
        const userChatRef = doc(db, "userchats", user.id);
        const userChatsSnapshot = await getDoc(userChatRef);
        
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chats.findIndex(
            (chat) => chat.chatId === chatId
          );
          
          if (chatIndex !== -1) {
            setOtherUserChatSeen(!!userChatsData.chats[chatIndex].isSeen);
          }
        }
      } catch (err) {
        console.error("Error fetching seen status:", err);
      }
    };
    
    fetchOtherUserChatSeen();
  }, [chatId, user, currentUser, chat?.messages?.length]);

  // Add new useEffect to handle image upload
  React.useEffect(() => {
    if (shouldUploadImage && img.file) {
      handleSend();
      setShouldUploadImage(false);
    }
  }, [img, shouldUploadImage]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
  };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      console.log("Image file selected:", file);
      const newFile = new File([file], file.name, { type: file.type });
      setImg({
        file: newFile,
        url: "",
      });
      console.log("Image state updated:", { file: newFile, url: "" });
      setShouldUploadImage(true);
    }
  };

  const clearImage = () => {
    setImg({
      file: null,
      url: "",
    });
  };

  const handleSend = async () => {
    if (isCurrentUserBlocked || isReceiverBlocked) {
      alert("You cannot send messages to this user because of blocking.");
      return;
    }

    if (text.trim() === "" && !img.file) return;

    setIsUploading(true);

    try {
      // Handle image message if present
      if (img.file) {
        console.log("Starting image upload process...");
        try {
          // Upload image first
          const fileCopy = new File([img.file], img.file.name, { type: img.file.type });
          console.log("File prepared for upload:", fileCopy);
          
          const imgUrl = await upload(fileCopy);
          console.log("Image uploaded, URL received:", imgUrl);
          
          if (!imgUrl) {
            throw new Error("Failed to upload image");
          }

          // Create image message
          const imgMessage = {
            senderId: currentUser.id,
            createAt: new Date(),
            seen: false,
            img: imgUrl
          };
          console.log("Image message object created:", imgMessage);

          // Get current messages
          const chatRef = doc(db, "chats", chatId);
          const chatSnap = await getDoc(chatRef);
          console.log("Current chat data:", chatSnap.data());
          
          const currentMessages = chatSnap.exists() ? chatSnap.data().messages || [] : [];
          console.log("Current messages:", currentMessages);

          // Add new message
          const updatedMessages = [...currentMessages, imgMessage];
          console.log("Updated messages array:", updatedMessages);

          // Save to Firestore
          await updateDoc(chatRef, {
            messages: updatedMessages
          });
          console.log("Image message saved to Firestore");

          // Update last message in userchats for image
          const userIDs = [currentUser.id, user.id];
          for (const id of userIDs) {
            const userChatRef = doc(db, "userchats", id);
            const userChatsSnapshot = await getDoc(userChatRef);
            if (userChatsSnapshot.exists()) {
              const userChatsData = userChatsSnapshot.data();
              const chatIndex = userChatsData.chats.findIndex(
                (chat) => chat.chatId === chatId
              );
              if (chatIndex !== -1) {
                userChatsData.chats[chatIndex].lastMessage = "Image";
                userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
                userChatsData.chats[chatIndex].updatedAt = Date.now();
                await updateDoc(userChatRef, {
                  chats: userChatsData.chats,
                });
                console.log("Userchats updated for user:", id);
              }
            }
          }
        } catch (err) {
          console.error("Error sending image message:", err);
          alert("Failed to send image. Please try again.");
          return;
        }
      }

      // Handle text message if present
      if (text.trim() !== "") {
        try {
          const textMessage = {
            senderId: currentUser.id,
            createAt: new Date(),
            seen: false,
            text: text.trim()
          };

          // Get current messages
          const chatRef = doc(db, "chats", chatId);
          const chatSnap = await getDoc(chatRef);
          const currentMessages = chatSnap.exists() ? chatSnap.data().messages || [] : [];

          // Add new message
          const updatedMessages = [...currentMessages, textMessage];

          // Save to Firestore
          await updateDoc(chatRef, {
            messages: updatedMessages
          });

          // Update last message in userchats for text
          const userIDs = [currentUser.id, user.id];
          for (const id of userIDs) {
            const userChatRef = doc(db, "userchats", id);
            const userChatsSnapshot = await getDoc(userChatRef);
            if (userChatsSnapshot.exists()) {
              const userChatsData = userChatsSnapshot.data();
              const chatIndex = userChatsData.chats.findIndex(
                (chat) => chat.chatId === chatId
              );
              if (chatIndex !== -1) {
                userChatsData.chats[chatIndex].lastMessage = text.trim();
                userChatsData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
                userChatsData.chats[chatIndex].updatedAt = Date.now();
                await updateDoc(userChatRef, {
                  chats: userChatsData.chats,
                });
              }
            }
          }
        } catch (err) {
          console.error("Error sending text message:", err);
          alert("Failed to send text message. Please try again.");
          return;
        }
      }
    } catch (err) {
      console.error("Error in handleSend:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      clearImage();
      setText("");
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Edit message handler
  const handleEditMessage = async (index) => {
    if (!chatId || !chat?.messages) return;
    const messagesCopy = [...chat.messages];
    if (messagesCopy[index].text) { // Only allow editing text messages
      messagesCopy[index] = {
        ...messagesCopy[index],
        text: editText,
      };
      try {
        await updateDoc(doc(db, "chats", chatId), {
          messages: messagesCopy,
        });
        setEditIndex(null);
      } catch (err) {
        alert("Failed to edit message");
      }
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (index) => {
    if (!chatId || !chat?.messages) return;
    const messagesCopy = chat.messages.filter((_, i) => i !== index);
    try {
      await updateDoc(doc(db, "chats", chatId), {
        messages: messagesCopy,
      });
      setMenuOpen(null);
    } catch (err) {
      alert("Failed to delete message");
    }
  };

  // Add new effect to update seen status
  React.useEffect(() => {
    if (!chatId || !user || !currentUser || !chat?.messages) return;

    const updateMessageSeenStatus = async () => {
      try {
        const messages = [...chat.messages];
        let hasUnseenMessages = false;

        // Check for unseen messages from the other user
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].senderId === user.id && !messages[i].seen) {
            messages[i].seen = true;
            hasUnseenMessages = true;
          }
        }

        // Only update if there are unseen messages
        if (hasUnseenMessages) {
          await updateDoc(doc(db, "chats", chatId), {
            messages: messages
          });
        }
      } catch (err) {
        console.error("Error updating message seen status:", err);
      }
    };

    updateMessageSeenStatus();
  }, [chatId, user, currentUser, chat?.messages]);
  
  if (isCurrentUserBlocked) {
    return (
      <div className="chat">
        <div className="top">
          <div className="user">
            <img src={user?.avatar || "/avatar.png"} alt="" />
            <div className="texts">
              <span>{user?.username || "User"}</span>
            </div>
          </div>
        </div>
        <div className="center" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h3>You cannot send messages to this user</h3>
            <p>You have been blocked by this user</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (isReceiverBlocked) {
    return (
      <div className="chat">
        <div className="top">
          <div className="user">
            <img src={user?.avatar || "/avatar.png"} alt="" />
            <div className="texts">
              <span>{user?.username || "User"}</span>
            </div>
          </div>
        </div>
        <div className="center" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h3>You cannot send messages to this user</h3>
            <p>You have blocked this user</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chat">
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "/avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.username || "User"}</span>
          </div>
        </div>
        <div className="icons">
          <img src="/phone.png" alt="" />
          <img src="/video.png" alt="" />
          <img src="/info.png" alt="" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((message, index) => {
          const isOwn = message.senderId === currentUser?.id;
          return (
            <div key={`${message?.createAt}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: 8 }}>
              {isOwn && (
                <div style={{ marginRight: 6, display: 'flex', alignItems: 'center', height: '100%', position: 'relative' }}>
                  <FaEllipsisV
                    style={{marginRight: -10, cursor: 'pointer', color: '#aaa', fontSize: 12 }}
                    onClick={() => setMenuOpen(menuOpen === index ? null : index)}
                  />
                  {menuOpen === index && (
                    <div style={{ 
                      position: 'absolute', 
                      right: 4, 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: '#222', 
                      color: '#fff', 
                      borderRadius: 8, 
                      zIndex: 10, 
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      minWidth: '100px'
                    }}>
                      {message.text && (
                        <div style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '8px 8px 0 0' }} onClick={() => { setEditIndex(index); setEditText(message.text); setMenuOpen(null); }}>Edit</div>
                      )}
                      <div style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: message.text ? '0 0 8px 8px' : '8px' }} onClick={() => { handleDeleteMessage(index); setMenuOpen(null); }}>Delete</div>
                    </div>
                  )}
                </div>
              )}
              <div style={{ position: 'relative', maxWidth: '70%' }} className={isOwn ? 'message own' : 'message'}>
                <div className="texts" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  {editIndex === index ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#10245548', padding: 10, borderRadius: 10 }}>
                      <input
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        style={{ width: '100%', padding: 8, border: '1px solid #5183fe', borderRadius: 6, background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, marginBottom: 6 }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditMessage(index)} style={{ padding: '6px 12px', border: 'none', borderRadius: 4, background: '#5183fe', color: 'white', fontSize: 12, cursor: 'pointer' }}>Save</button>
                        <button onClick={() => { setEditIndex(null); setEditText(""); }} style={{ padding: '6px 12px', border: 'none', borderRadius: 4, background: '#ff4d4d', color: 'white', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                      {message.text && (
                        <p style={{minWidth:60, margin: 0, paddingRight:30, marginRight: 18, display: 'inline-block', wordBreak: 'break-word', maxWidth: 320 }}>{message.text}</p>
                      )}
                      {message.img && (
                        <img src={message.img} alt="" style={{ maxWidth: 220, borderRadius: 10, marginTop: 2 }} />
                      )}
                      {isOwn && (
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: 10, color: message.seen ? '#006400' : '#aaa', marginLeft: 10, marginBottom: 2, position: 'absolute', right: 25, bottom: 3 }}>
                          <FaCheck />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef}></div>
      </div>
     
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="/img.png" alt="" />
          </label>

          <input 
            type="file" 
            id="file" 
            ref={fileInputRef}
            style={{ display: "none" }} 
            onChange={handleImg} 
            accept="image/*"
          />
          <img src="/camera.png" alt="" />
          <img src="/mic.png" alt="" />
        </div>
        <input
          type="text"
          placeholder="Type a message"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="emoji">
          <img
            src="./emoji.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <button 
          className="sendButton" 
          onClick={handleSend}
          disabled={isUploading}
        >
          {isUploading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chat;
