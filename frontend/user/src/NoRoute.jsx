import { Link } from "react-router-dom";
import { Button, Nav, Col, Row, Image } from "react-bootstrap";
import {
  baseUrl,
  getScrittaSquealer,
  getLogoSquealer,
  NoLogin,
} from "./Const.js";
import { useEffect } from "react";
import { useState, useLayoutEffect } from "react";
import useWindowDimensions from "./useWindowDimensions.jsx";

function NoRoute(props) {
  useEffect(() => {
    props.setShowFooter(false);
  }, []);

  const [WriteSize, setWriteSize] = useState(0);

  const { width } = useWindowDimensions();

  useLayoutEffect(() => {
    setWriteSize(Math.max(300, width / 2));
  }, [width]);

  const styles = {
    header: {
      backgroundImage: `url(${getLogoSquealer})`,
      height: "100vh",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "cover",
    },

    content: {
      height: "100%",
      width: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      color: "white",
      justifyContent: "center",
      alignItems: "center",
    },
  };

  return (
    <div style={styles.header}>
      <div style={styles.content}>
        <Row style={{ display: "flex", justifyContent: "center" }}>
          <Image
            src={getScrittaSquealer}
            alt="scritta squealer"
            style={{
              height: "12vh",
              maxWidth: `${WriteSize}px`,
              marginTop: "10px",
            }}
            fluid
          />
        </Row>
        <Row style={{ marginTop: "14vh" }}>
          <Col style={{ display: "flex", justifyContent: "center" }}>
            <p style={{ fontSize: "25px" }}>
              ops sembra che tu abbia sbagliato pagina
            </p>
          </Col>
        </Row>
        <Row style={{ marginTop: "40px" }}>
          <Col style={{ display: "flex", justifyContent: "center" }}>
            {sessionStorage.getItem("refreshToken") === NoLogin ||
            sessionStorage.getItem("refreshToken") === null ? (
              <Nav.Link as={Link} to={`${baseUrl}login`}>
                  <Button size="lg" onClick={() => { sessionStorage.clear() }}>Torna al Login</Button>
              </Nav.Link>
            ) : (
              <Nav.Link as={Link} to={`${baseUrl}home`}>
                <Button size="lg">Torna alla Home</Button>
              </Nav.Link>
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
}
export default NoRoute;
