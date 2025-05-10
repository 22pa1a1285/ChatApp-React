import React from 'react'
import './addUser.css'
import { db } from '../../../../lib/firebase'
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, arrayUnion, updateDoc, getDoc } from 'firebase/firestore'
import { useUserStore } from '../../../../lib/userStore'
import { toast } from 'react-toastify'

const AddUser = () => {
  const [user, setUser] = React.useState(null);
  const {currentUser} = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const username = formData.get('username');

    try {
      const userRef = collection(db, 'users');
      const q = query(userRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const foundUser = querySnapshot.docs[0].data();
        // Don't allow adding yourself
        if (foundUser.id === currentUser.id) {
          toast.error("You cannot add yourself!");
          setUser(null);
          return;
        }
        setUser(foundUser); 
      } else {
        setUser(null); 
        toast.error("User not found!");
      }
    } catch (err) {
      console.log(err);
      toast.error("Error searching for user");
    }
  };

  const handleAdd = async() => {
    if (!user) return;

    try {
      // Check if chat already exists
      const currentUserChatDoc = doc(db, "userchats", currentUser.id);
      const userChatSnap = await getDoc(currentUserChatDoc);
      
      if (userChatSnap.exists()) {
        const userChats = userChatSnap.data().chats || [];
        const chatExists = userChats.some(chat => chat.receiverId === user.id);
        
        if (chatExists) {
          toast.error("Chat with this user already exists!");
          return;
        }
      }

    const chatRef = collection(db, 'chats');
      const userChatsCollection = collection(db, 'userchats');
    
     const newChatRef = doc(chatRef);
     
     await setDoc(newChatRef, {
      createdAt: serverTimestamp(),
      messages: [],
     });

      const otherUserChatDoc = doc(userChatsCollection, user.id);
     
     const currentUserChatSnap = await getDoc(currentUserChatDoc);
     const otherUserChatSnap = await getDoc(otherUserChatDoc);
     
     const chatObject = {
       chatId: newChatRef.id,
       lastMessage: '',
       receiverId: user.id,
       updatedAt: Date.now()
     };
     
     const otherChatObject = {
       chatId: newChatRef.id,
       lastMessage: '',
       receiverId: currentUser.id,
       updatedAt: Date.now()
     };
     
     await setDoc(currentUserChatDoc, {
       chats: currentUserChatSnap.exists() 
         ? arrayUnion(chatObject) 
         : [chatObject]
     }, { merge: true });
     
     await setDoc(otherUserChatDoc, {
       chats: otherUserChatSnap.exists()                                 
         ? arrayUnion(otherChatObject) 
         : [otherChatObject]
     }, { merge: true });
     
      toast.success("User added successfully!");
      setUser(null); // Clear the user after successful addition
      
    } catch (err) {
      console.log(err);
      toast.error("Error adding user");
    }
  };

  return (
    <div className='addUser'>
      <form onSubmit={handleSearch}>
        <input type="text" placeholder='Username' name='username' />
        <button type="submit">Search</button>
      </form>

      {user && (
        <div className="user">
          <div className="detail">
            <img src={user.avatar || "./avatar.png"} alt="" />
            <span>{user.username}</span>
          </div>
          <button onClick={handleAdd}>Add User</button>
        </div>
      )}
    </div>
  );
};

export default AddUser;
