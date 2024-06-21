import {
  ArrowLeftCircle,
  CardText,
  ImageFill,
  CameraVideo,
  StarFill,
} from "react-bootstrap-icons";
import {
  Nav,
  Col,
  Row,
  Form,
  CloseButton,
  Card,
  Container,
  Navbar,
  Image,
  Spinner,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  icon_size,
  baseUrl,
  getScrittaSquealer,
  sendRequest,
  uri,
  fetchImgPreview,
  fetchAttachment,
} from "./Const.js";
import { BsSearch } from "react-icons/bs";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

function Chats(props) {
  const [showSearch, setShowSearch] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const [slideLeft, setSlideLeft] = useState(true);

  const [arrayLastMessages, setArrayLastMessages] = useState([]);

  const [pageChats, setPageChats] = useState(1);
  const [isLoadingChats, setIsLoadingChats] = useState(false);

  const fetchChats = async () => {
    const res = await sendRequest(
      new Request(`${uri}message/chats/?page=${pageChats}&name=${inputValue}`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    const promises = json.map(async (el) => {
      const img = await fetchImgPreview("user", el.utente);
      var attachment = "";
      if (el.contentType !== "text")
        attachment = await fetchAttachment(el._id, "message");
      return {
        img: img,
        attachment: attachment || "",
        usernameDest: el.utente,
        type_msg: el.contentType,
        msg: el.content || "",
        data: el.date,
        orario: el.time,
        areClosedFriends: el.areClosedFriends,
      };
    });

    Promise.all(promises).then((results) => {
      setArrayLastMessages([...results]);
    });
    setIsLoadingChats(false);
  };

  useEffect(() => {
    props.setYouAreInChats(true);
  }, []);

  useEffect(() => {
    fetchChats();
  }, [inputValue, pageChats]);

  useEffect(() => {
    setPageChats(1);
  }, [inputValue]);

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      amici piú stretti
    </Tooltip>
  );

  return (
    <motion.div
      initial={slideLeft ? { width: 0 } : {}}
      animate={slideLeft ? { width: "100vw" } : {}}
      transition={{ duration: 0.7 }} //exit={ slideLeft ? {x: window.innerWidth} : {}}
    >
      <Navbar style={{ height: "100px" }} className="bg-body-tertiary">
        <Container fluid>
          <Col style={{ width: "33vw", marginLeft: "1vw" }}>
            <Nav.Link
              style={{ maxWidth: icon_size }}
              as={Link}
              to={`${baseUrl}home`}
              onClick={() => {
                props.setShowFooter(true);
                props.setSlideAnimation(true);
              }}
            >
              <ArrowLeftCircle size={icon_size} />
            </Nav.Link>
          </Col>
          <Col
            style={{ width: "33vw", display: "flex", justifyContent: "center" }}
          >
            <Image
              src={getScrittaSquealer}
              alt="scritta squealer"
              style={{ height: "10vh" }}
              fluid
            />
          </Col>
          <Col>
            <Nav.Item
              style={{
                width: "33vw",
                display: "flex",
                justifyContent: "flex-end",
                marginRight: "1vw",
              }}
            >
              {showSearch ? (
                <Card style={{ maxWidth: "30vw" }}>
                  <Row>
                    <Col>
                      <Form.Control
                        id="inputValue"
                        value={inputValue}
                        type="txt"
                        onChange={(event) => {
                          setPageChats(1);
                          setInputValue(event.target.value);
                        }}
                        style={{
                          border: "none",
                          outline: "none",
                          boxShadow: "none",
                        }}
                      />
                    </Col>
                    <Col style={{ maxWidth: "50px" }}>
                      <CloseButton
                        style={{ marginTop: "5px", marginRight: "5px" }}
                        onClick={() => {
                          setShowSearch(false);
                          setInputValue("");
                        }}
                      />
                    </Col>
                  </Row>
                </Card>
              ) : (
                <div style={{ cursor: "pointer" }}>
                  <BsSearch
                    onClick={() => {
                      setShowSearch(true);
                    }}
                    size={icon_size}
                    color="white"
                    className="my-icon"
                  />
                </div>
              )}
            </Nav.Item>
          </Col>
        </Container>
      </Navbar>

      <div
        style={{
          marginTop: "2vh",
          overflowY: "auto",
          maxHeight: `calc(100vh - 100px )`,
        }}
      >
        {arrayLastMessages.map((el, index) => (
          <Nav.Link
            key={index}
            as={Link}
            to={`${baseUrl}conversazione/${el.usernameDest}`}
            onClick={() => {
              setSlideLeft(false);
            }}
          >
            <Card style={{ borderStyle: "none" }}>
              <Card.Body>
                <Row>
                  <div style={{ maxWidth: "110px" }}>
                    <Image
                      roundedCircle
                      fluid
                      src={el.img}
                      alt={`immagine profilo di ${el.usernameDest}`}
                      width="70px"
                    />
                  </div>
                  <Col>
                    <span>
                      <strong>{el.usernameDest}</strong>
                    </span>
                    {el.areClosedFriends && (
                      <>
                        <OverlayTrigger
                          placement="top"
                          delay={{ show: 250, hide: 400 }}
                          overlay={renderTooltip}
                        >
                          <StarFill
                            style={{ marginLeft: "10px", marginBottom: "2px" }}
                            size={icon_size / 3}
                          />
                        </OverlayTrigger>
                      </>
                    )}
                  </Col>
                  <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                    <p>
                      <strong>{el.data}</strong>
                    </p>
                  </Col>
                </Row>
                <Row style={{ marginLeft: "99px", marginTop: "-4vh" }}>
                  <Col>
                    {el.type_msg === "text" ? (
                      <CardText />
                    ) : el.type_msg === "image" ? (
                      <ImageFill />
                    ) : el.type_msg === "video" ? (
                      <CameraVideo />
                    ) : (
                      <></>
                    )}
                    <span>{` ${el.msg}`}</span>
                  </Col>
                  <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                    <p>{el.orario}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Nav.Link>
        ))}
      </div>
      <div>
        {isLoadingChats ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "150px",
            }}
          >
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "20px",
              marginBottom: "20px",
              marginRight: "10px",
              marginLeft: "10px",
            }}
          >
            <Button
              size="sm"
              disabled={pageChats <= 1}
              variant="primary"
              onClick={async () => {
                setArrayLastMessages([]);
                setIsLoadingChats(true);
                await new Promise((resolve) => setTimeout(resolve, 400));
                setPageChats((prevValue) => {
                  return prevValue - 1;
                });
              }}
            >
              pagina precedente
            </Button>
            <Button
              size="sm"
              disabled={arrayLastMessages.length === 0}
              variant="primary"
              onClick={async () => {
                setArrayLastMessages([]);
                setIsLoadingChats(true);
                await new Promise((resolve) => setTimeout(resolve, 400));
                setPageChats((prevValue) => {
                  return prevValue + 1;
                });
              }}
            >
              pagina successiva
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default Chats;
