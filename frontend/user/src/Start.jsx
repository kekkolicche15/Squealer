import { useState, useLayoutEffect } from "react";
import { Container, Row, Image, Card } from "react-bootstrap";
import "./Start.css";
import { Outlet } from "react-router-dom";
import useWindowDimensions from "./useWindowDimensions.jsx";
import { getScrittaSquealer, getLogoSquealer } from "./Const.js";

const Start = () => {
  const { width } = useWindowDimensions();

  const [CardSize, setCardSize] = useState(0);
  const [WriteSize, setWriteSize] = useState(0);

  useLayoutEffect(() => {
    setCardSize(Math.max(500, width / 30));
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
      <Container fluid style={styles.content}>
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
        <Row
          style={{
            display: "flex",
            margin: "auto",
            maxWidth: `${CardSize}px`,
            marginTop: "8vh",
          }}
        >
          <Card>
            <Card.Body>
              <Outlet />
            </Card.Body>
          </Card>
        </Row>
      </Container>
    </div>
  );
};

export default Start;
