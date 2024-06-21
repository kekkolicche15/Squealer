import { Nav, Col, Row } from "react-bootstrap";
import { BsFillHouseFill, BsPersonFill, BsSearch } from "react-icons/bs";
import { baseUrl, NoLogin } from "./Const.js";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import "./MyFooter.css";

const MyFooter = (props) => {
  const [iconAnimation, setIconAnimation] = useState(0);

  function handleAnimation(iconIndex) {
    // Attiva l'animazione
    setIconAnimation(iconIndex);

    // Attendere per un breve periodo di tempo e quindi disattivare l'animazione
    setTimeout(() => {
      setIconAnimation(0);
    }, 300); // 200 millisecondi corrispondono al tempo di transizione definito in CSS
  }

  //serve a sistemare la navbar
  useEffect(() => {
    if (props.fixNavbarSearch) {
      props.navbarSearch.current.click();
      props.setFixNavbarSearch(false);
    }
  }, [props.fixNavbarSearch]);

  var location = useLocation();

  useEffect(() => {
    const parts = location.pathname.split("/");
    if (parts[1] === "home") {
      props.navbarHome.current?.click();
    }
  }, [location.pathname, props.navbarHome.current]);

  const navbar = useRef();

  useLayoutEffect(() => {
    props.setFooterHeight(navbar.current.offsetHeight + 10);
  }, [navbar.current]);

  return (
    <div>
      <Nav
        ref={navbar}
        style={{
          bottom: `0px`,
          position: "fixed",
          backgroundColor: "#212529",
          width: "100vw",
        }}
        variant="tabs"
        as="ul"
      >
        <Row>
          <Col
            style={{
              width: `${
                sessionStorage.getItem("refreshToken") !== NoLogin &&
                sessionStorage.getItem("refreshToken") !== null
                  ? "33vw"
                  : "50vw"
              }`,
            }}
          >
            <Nav.Item>
              <Nav.Link
                ref={props.navbarHome}
                as={Link}
                eventKey={1}
                to={`${baseUrl}home`}
                onClick={() => {
                  handleAnimation(1);
                }}
                style={{ display: "flex", justifyContent: "center" }}
              >
                <BsFillHouseFill
                  size="4vh"
                  color="white"
                  className={iconAnimation === 1 ? "icon-animation" : ""}
                />
              </Nav.Link>
            </Nav.Item>
          </Col>
          <Col
            style={{
              width: `${
                sessionStorage.getItem("refreshToken") !== NoLogin &&
                sessionStorage.getItem("refreshToken") !== null
                  ? "33vw"
                  : "50vw"
              }`,
            }}
          >
            <Nav.Item>
              {props.fixNavbarSearch ? (
                <Nav.Link
                  ref={props.navbarSearch}
                  as={Link}
                  eventKey={2}
                  onClick={() => {
                    handleAnimation(2);
                  }}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <BsSearch
                    size="4vh"
                    color="white"
                    className={iconAnimation === 2 ? "icon-animation" : ""}
                  />
                </Nav.Link>
              ) : (
                <Nav.Link
                  ref={props.navbarSearch}
                  as={Link}
                  eventKey={2}
                  to={`${baseUrl}search`}
                  onClick={() => {
                    handleAnimation(2);
                  }}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <BsSearch
                    size="4vh"
                    color="white"
                    className={iconAnimation === 2 ? "icon-animation" : ""}
                  />
                </Nav.Link>
              )}
            </Nav.Item>
          </Col>
          {sessionStorage.getItem("refreshToken") !== NoLogin &&
            sessionStorage.getItem("refreshToken") !== null && (
              <Col style={{ width: "33vw" }}>
                <Nav.Item>
                  <Nav.Link
                    ref={props.navbarProfile}
                    as={Link}
                    eventKey={3}
                    to={`${baseUrl}user/${props.username}`}
                    onClick={() => {
                      handleAnimation(3);
                    }}
                    style={{ display: "flex", justifyContent: "center" }}
                  >
                    <BsPersonFill
                      size="4vh"
                      color="white"
                      className={iconAnimation === 3 ? "icon-animation" : ""}
                    />
                  </Nav.Link>
                </Nav.Item>
              </Col>
            )}
        </Row>
      </Nav>
    </div>
  );
};

export default MyFooter;
