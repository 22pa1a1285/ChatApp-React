import Chat from "./components/chat/Chat"
import List from "./components/list/List"
import Detail from "./components/detail/Detail"
import Login from "./components/login/Login"
import Notification from "./components/notification/Notification"
import React, { useEffect } from 'react'
import { auth } from './lib/firebase'
import {useUserStore} from './lib/userStore'
import { useChatStore } from "./lib/chatStore";
const App = () => {
  const {currentUser,isLoading,fetchUserInfo}=useUserStore();
  const {chatId, resetChat}=useChatStore();
  useEffect(()=>{
    const unSub=auth.onAuthStateChanged((user)=>{
      fetchUserInfo(user?.uid);
      if (!user) {
        resetChat();
      }
    });
    return ()=>unSub();
  },[fetchUserInfo, resetChat]);
  if(isLoading){
    return <div className="loading">Loading...</div>
  }
  return (
    <div className='container'>
      {
        currentUser?(
<>
<List/>
   {chatId && <Chat/>} 
    {chatId && <Detail/>}
</>
        ):(<Login/>)
      }
    <Notification/> 
    </div>
  )
}

export default App;