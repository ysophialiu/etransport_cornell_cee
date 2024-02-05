import React from "react";
import Image from "react-bootstrap/Image";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./header.css";
import "./general.css";

const Header = () => {
  let navigate = useNavigate()

  function handleContactButton() {
    navigate('/contact-us');
  }
    function handlemain() {
    navigate('/')
  };

  return (
    <div className="topbar">
      <a href="#main" className="skip">Skip to main content</a>
      
      <Nav.Link onClick={handlemain} className="titleLink">
        {/*<Image src="/cornell-insignia-red.svg" fluid bsPrefix="seal-logo" />*/}
        Transportation Electrification
      </Nav.Link>

        <Navbar variant="light" expand="lg">
          <Nav expand="lg" className="me-auto custom-navbar" >
            <Nav.Link href="/" className="custom-btn">Home</Nav.Link>
			<NavDropdown title="Case Studies">
              <NavDropdown.Item href="/atlanta-result">Atlanta Metropolitan Area</NavDropdown.Item>
			</NavDropdown>
            <Nav.Link href="/live-modelN" className="custom-btn">Live Simulation</Nav.Link>
            <Nav.Link href="/contact-us" className="custom-btn">Contact Us</Nav.Link>
          </Nav>
        </Navbar>
    </div>
  );
}

export default Header;