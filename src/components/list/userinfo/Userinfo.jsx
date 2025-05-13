import "./userinfo.css";
import { useUserStore } from "../../../lib/userStore";
import { auth } from "../../../lib/firebase";
const Userinfo = () => {

  const {currentUser}=useUserStore();
  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser.avatar || "./avatar.png"} alt="" className="avatar" />
        <h3>{currentUser.username}</h3>
      </div>
      <div className="icons">
        <img src="/more.png" alt="" />
        <img src="/video.png" alt="" />
        <img src="/edit.png" alt="" />
      </div>
    
    </div>
  );
};
export default Userinfo;
