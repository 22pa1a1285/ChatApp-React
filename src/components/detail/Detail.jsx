import { auth, db } from "../../lib/firebase";
import "./detail.css";
import { useUserStore } from "../../lib/userStore";
import { useChatStore } from "../../lib/chatStore";
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";

const Detail = () => {
  const { currentUser } = useUserStore();
  const { user, isReceiverBlocked, blockUser, unblockUser } = useChatStore();
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, "users", user.id);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUserDetails(userSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    
    fetchUserDetails();
  }, [user]);

  useEffect(() => {
    if (user) {
      setIsBlocked(currentUser?.blocked?.includes(user.id) || false);
    }
  }, [user, currentUser]);

  const handleBlockUser = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (isBlocked) {
        // Unblock user
        await unblockUser(user.id);
        setIsBlocked(false);
      } else {
        // Block user
        await blockUser(user.id);
        setIsBlocked(true);
      }
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="detail">
      <div className="user">
        <img src={user.avatar || "/avatar.png"} alt="" />
        <h3>{user.username}</h3>
        <h6>{isBlocked ? "Blocked" : "Active"}</h6>
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="/arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Chat Settings</span>
            <img src="/arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Privacy % help</span>
            <img src="/arrowUp.png" alt="" />
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared photos</span>
            <img src="/arrowDown.png" alt="" />
          </div>
          <div className="photos">
            <div className="photoItem">
              <div className="photoDetail">
                <img src="/avatar.png" alt="" />
                <span>photo_2020_2.png</span>
              </div>

              <img src="/download.png" alt="" />
            </div>
            <div className="photoItem">
              <div className="photoDetail">
                <img src="/avatar.png" alt="" />
                <span>photo_2020_2.png</span>
              </div>

              <img src="/download.png" alt="" />
            </div>
            <div className="photoItem">
              <div className="photoDetail">
                <img src="/avatar.png" alt="" />
                <span>photo_2020_2.png</span>
              </div>

              <img src="/download.png" alt="" />
            </div>
          </div>
        </div>
        <div className="option">
          <div className="title">
            <span>Shared Files</span>
            <img src="/arrowUp.png" alt="" />
          </div>
        </div>
        <button 
          onClick={handleBlockUser} 
          disabled={isLoading}
          style={{ backgroundColor: isBlocked ? "#5183fe" : "rgb(230, 74, 105)" }}
        >
          {isLoading ? "Processing..." : isBlocked ? "Unblock User" : "Block User"}
        </button>
        <button className="logout" onClick={()=>auth.signOut()}>Log out</button>
      </div>
    </div>
  );
};
export default Detail;
