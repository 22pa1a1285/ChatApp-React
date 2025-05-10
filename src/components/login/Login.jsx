import React from 'react'
import "./login.css"
import {toast} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { createUserWithEmailAndPassword,signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { doc, setDoc } from "firebase/firestore"; 
import { db } from '../../lib/firebase';
import upload from '../../lib/upload';
import { useUserStore } from '../../lib/userStore';

const Login = () => {
  const [avatar,setAvatar]=React.useState({
    file:null,
    url:""
  });
  const [signInLoading, setSignInLoading] = React.useState(false);
  const [signUpLoading, setSignUpLoading] = React.useState(false);

  const handleAvatar=(e)=>{
    if(e.target.files[0]){
      setAvatar({
        file:e.target.files[0],
        url:URL.createObjectURL(e.target.files[0])
      });
    }
  }

  const handleRegister=async (e)=>{
    e.preventDefault();
    setSignUpLoading(true);
    const formData=new FormData(e.target);
    const {username,email,password}=Object.fromEntries(formData);
    try{
      const res=await createUserWithEmailAndPassword(auth,email,password);

      const imgUrl=await upload(avatar.file);
      await setDoc(doc(db, "users", res.user.uid), {
        username,
        email,
        avatar:imgUrl,
        id:res.user.uid,
        blocked:[]
      });
      await setDoc(doc(db, "userchats", res.user.uid), {
        chats:[]
      });
      toast.success("User created successfully");
    }catch(err){
      console.log(err);
      toast.error(err.message);
    }finally{
      setSignUpLoading(false);
    }
  }

  const handleLogin=async(e)=>{
    e.preventDefault();
    setSignInLoading(true);
    const formData=new FormData(e.target);
    const {email,password}=Object.fromEntries(formData);
    try{
      await signInWithEmailAndPassword(auth,email,password);
      toast.success("Logged in successfully");
    }catch(err){
      console.log(err);
      toast.error(err.message);
    }finally{
      setSignInLoading(false);
    }
  }

  return (
    <div className='login'>
      <div className='item'>
        <h2>Welcome back</h2>
        <form onSubmit={handleLogin}>
          <input type='text' placeholder='Email' name="email"/>
          <input type='password' placeholder='Password' name="password"/>
          <button disabled={signInLoading}>{signInLoading ? "Loading..." : "Sign In"}</button>
        </form>
      </div>
      <div className='seperator'></div>
      <div className='item'>
        <h2>Create an Account</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor="file">
            <img src={avatar.url || "./avatar.png"} alt="" />
            Upload my image
          </label>
          <input type="file" id='file' style={{display:"none"}} onChange={handleAvatar}/>
          <input type='text' placeholder='Username' name="username"/>
          <input type='text' placeholder='Email' name="email"/>
          <input type='password' placeholder='Password' name="password"/>
          <button disabled={signUpLoading}>{signUpLoading ? "Loading..." : "Sign Up"}</button>
        </form>
      </div>
    </div>
  )
}

export default Login;
