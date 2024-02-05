import { Navigate, useNavigate } from "react-router-dom"
import React, { useEffect, useState } from "react"
import Header from "./Header";
import "./general.css";

const RedirectBack = () => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setReady(true)
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  let navigate = useNavigate()

  return ready ? <Navigate to="/live-model"/>
  :
  <div>
      <Header history={navigate}/>
      <div className="content">
        <div>Redirecting...</div>
      </div>
    </div>
}

export default RedirectBack;