import { create } from 'zustand'
import { db } from './firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useUserStore } from './userStore';

export const useChatStore = create((set) => ({
 chatId:null,
 user:null,
 isCurrentUserBlocked:false,
 isReceiverBlocked:false,
 changeChat:async(chatId,user)=>{
  const currentUser=useUserStore.getState().currentUser;
  if(!currentUser || !user) return;
  
  if (!currentUser.blocked) currentUser.blocked = [];
  if (!user.blocked) user.blocked = [];
  
  try {
    const userRef = doc(db, "users", user.id);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const updatedUser = userSnap.data();
      updatedUser.id = user.id;
      
      if(updatedUser.blocked.includes(currentUser.id)){
        return set({
          chatId,
          user:null,
          isCurrentUserBlocked:true,
          isReceiverBlocked:false
        });
      }
      else if(currentUser.blocked.includes(updatedUser.id)){
        return set({
          chatId,
          user:updatedUser,
          isCurrentUserBlocked:false,
          isReceiverBlocked:true
        });
      }
      else{
        return set({
          chatId,
          user:updatedUser,
          isCurrentUserBlocked:false,
          isReceiverBlocked:false
        });
      }
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
  
  if(user.blocked.includes(currentUser.id)){
    return set({
      chatId,
      user:null,
      isCurrentUserBlocked:true,
      isReceiverBlocked:false
    });
  }
  else if(currentUser.blocked.includes(user.id)){
    return set({
      chatId,
      user:user,
      isCurrentUserBlocked:false,
      isReceiverBlocked:true
    });
  }
  else{
    return set({
      chatId,
      user,
      isCurrentUserBlocked:false,
      isReceiverBlocked:false
    });
  }
 },
 resetChat: () => {
  set({
    chatId: null,
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false
  });
 },
 changeBlock:()=>{
  set((state)=>({...state,isReceiverBlocked:!state.isReceiverBlocked}));
 },
 blockUser: async (userId) => {
  const currentUser = useUserStore.getState().currentUser;
  const fetchUserInfo = useUserStore.getState().fetchUserInfo;
  if (!currentUser) return;
  
  try {
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, {
      blocked: arrayUnion(userId)
    });
    // Refresh currentUser info
    await fetchUserInfo(currentUser.id);
    set((state) => ({
      ...state,
      isReceiverBlocked: true
    }));
    
    return true;
  } catch (error) {
    console.error("Error blocking user:", error);
    return false;
  }
 },
 unblockUser: async (userId) => {
  const currentUser = useUserStore.getState().currentUser;
  const fetchUserInfo = useUserStore.getState().fetchUserInfo;
  if (!currentUser) return;
  
  try {
    const userRef = doc(db, "users", currentUser.id);
    await updateDoc(userRef, {
      blocked: arrayRemove(userId)
    });
    // Refresh currentUser info
    await fetchUserInfo(currentUser.id);
    set((state) => ({
      ...state,
      isReceiverBlocked: false
    }));
    
    return true;
  } catch (error) {
    console.error("Error unblocking user:", error);
    return false;
  }
 }
}));
