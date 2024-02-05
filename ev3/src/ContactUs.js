import React from "react";
import Header from "./Header.js";
import "./general.css";

const ContactUs = () => {
  return (
    <div>
      <Header/>
      <div className="big_title">Research Group</div>
      <div className="content">
        <div className="paragraph">
          This project is contributed by collaborators: 
          Prof. H. Oliver Gao, Yuechen Sophia Liu, Dr. Mohammad 
          Tayarani, Zehua Zhang and Emily Proulx from Cornell University.
        </div>
        
        <div className="paragraph">
          We look forward to hearing your ideas for collaboration. 
          Please contact us at the address/email below.
        </div>
        
        <div className="paragraph">
          <div>Address: </div>
          <div>220 Hollister Hall</div>
          <div>Department of Civil and Environmental Engineering</div>
          <div>Cornell University</div>
          <div>Ithaca, NY </div>
          <div>14853, USA</div>
        </div>

        <div className="paragraph">
          <div>Emails:</div>
          <div>Prof. H. Oliver Gao: hg55@cornell.edu</div>
        </div>

      </div>
    </div>
  );
}

export default ContactUs;