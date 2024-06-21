import {
  Nav,
  Col,
  Row,
  Form,
  CloseButton,
  Card,
  Navbar,
  Image,
  Dropdown,
  Modal,
  Button,
  Container,
  Spinner,
} from "react-bootstrap";
import {
  icon_size,
  truncate,
  baseUrl,
  sendRequest,
  uri,
  dataURLtoBlob,
  createFileFromBlob,
  fetchImgPreview,
} from "./Const.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImages,
  faVideo,
  faMapMarkerAlt,
} from "@fortawesome/free-solid-svg-icons";
import ImageVideo from "./componentsHome/ImageVideo.jsx";
import GeoModal from "./componentsHome/GeoModal.jsx";
import {
  Camera2,
  Paperclip,
  Telegram,
  Fullscreen,
  FullscreenExit,
  SlashCircle,
  ArrowLeftCircle,
} from "react-bootstrap-icons";
import { useState, useEffect, useRef } from "react";
import Camera from "react-html5-camera-photo";
import ReactPlayer from "react-player";
import "./OneChat.css";
import FooterCard from "./FooterCard.jsx";
import RandomImage from "./componentsHome/RandomImage.jsx";
import Wikipedia from "./componentsHome/Wikipedia.jsx";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { toast } from "react-toastify";

function OneChat(props) {
  const { usernameDest } = useParams();

  const [selectedResource, setSelectedResource] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [showModalImg, setShowModalImg] = useState(false);
  const [descrizione, setDescrizione] = useState("");
  const [modalZoom, setModalZoom] = useState(false);
  const [imageModalZoom, setImageModalZoom] = useState({});
  const [inputTxt, setInputTxt] = useState("");

  const [imageServer, setImageServer] = useState();

  const [currentIndex, setCurrentIndex] = useState(-1);

  const [arrayOneChat, setArrayOneChat] = useState([]);

  const [socket, setSocket] = useState(undefined);

  async function deleteMessage() {
    await socket.emit("delete message", {
      _id: arrayOneChat[currentIndex]._id,
      sender: props.username,
      receiver: usernameDest,
    });
  }

  const FetchLastPage = async () => {
    const res = await sendRequest(
      new Request(`${uri}message/${usernameDest}/lastPage`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (page !== json) {
      setArrayOneChat([]);
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 400));
      setIsLoading(false);
      setPage(json);
    }
  };

  useEffect(() => {
    props.setShowFooter(false);
    FetchLastPage();
  }, []);

  const refDiv = useRef();

  function handleTakePhoto(dataUri) {
    var myblob = dataURLtoBlob(dataUri);
    var myfile = createFileFromBlob(myblob);
    setImageServer(myfile);
    setSelectedResource(dataUri);
    setShowCamera(false);
  }

  const handleCreateMessage = async () => {
    const body = {};
    body.content = `${
      descrizione.length > 0 ? descrizione || "" : inputTxt || ""
    }`;
    if (imageServer) {
      if (imageServer.size > 1048576) {
        toast.error("allegato troppo grande", { className: "toast-message" });
        setIsVideo(false);
        setDescrizione("");
        setImageServer("");
        return;
      }

      body.attachment = imageServer;
      body.ext = imageServer.name.split(".").pop();
    }

    if (inputTxt !== "" || descrizione !== "" || imageServer) {
      await socket.emit("chat message", {
        body: body,
        sender: props.username,
        receiver: usernameDest,
      });
      if (isVideo) {
        setIsVideo(false);
      }

      setRefresh((prevValue) => !prevValue);
      if (descrizione.length > 0) {
        setDescrizione("");
      } else setInputTxt("");
      setImageServer("");
    }
  };

  //serve a fare in modo che non fai lo scroll se elimi un messaggio ma solo se ne aggiungi
  const [previousArrayLength, setPreviousArrayLength] = useState(
    arrayOneChat.length,
  );

  useEffect(() => {
    if (arrayOneChat.length > previousArrayLength) {
      refDiv.current.scrollTo({
        top: refDiv.current.scrollHeight,
        behavior: "smooth",
      });
    }
    setPreviousArrayLength(arrayOneChat.length);
  }, [arrayOneChat.length]);

  const [showModalD, setShowModalD] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(false);

  const fetchAttachmentMessage = async (id) => {
    const res = await sendRequest(
      new Request(`${uri}message/${id}/attachment`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    return res.url;
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await sendRequest(
        new Request(`${uri}message/${usernameDest}/?page=${page}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      const promises = json.map(async (el) => {
        const url_img_sender = await fetchImgPreview(
          "user",
          el.sender.username,
        );
        var attachment = "";
        if (el.contentType !== "text")
          attachment = await fetchAttachmentMessage(el._id);

        return {
          img: url_img_sender,
          msgSender: el.sender.username,
          usernameDest: `${
            el.sender.username === props.ownUsername
              ? usernameDest
              : props.ownUsername
          }`,
          type_msg: el.contentType,
          _id: el._id,
          msg: el.content || "",
          attachment: attachment || "",
          popularity: el.popularity,
          data: el.date,
          orario: el.time,
        };
      });

      Promise.all(promises).then((results) => {
        setArrayOneChat([...results]);
      });
      setIsLoading(false);
    };

    fetchMessages();
  }, [refresh]);

  const [port, setPort] = useState("");

  const fetchPort = async () => {
    const res = await sendRequest(
      new Request(`${uri}general/const`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );

    const json = await res.json();
    setPort(json.externalLink);
  };

  useEffect(() => {
    fetchPort();
  }, []);

  useEffect(() => {
    if (port.length === 0) return;

    setSocket(io(`${port}`));
  }, [port]);

  useEffect(() => {
    if (!socket) return;

    socket.on("error message", (messageErr) => {
      toast.error(messageErr, { className: "toast-message" });
    });

    socket.on("reload chat", (page) => {
      setPage(page);
      setRefresh((prevValue) => !prevValue);
    });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("authenticate", {
      token: sessionStorage.getItem("accessToken"),
    });
  }, [socket]);

  return (
    <div>
      {/* modal se vuoi eliminare il messaggio*/}
      <Modal centered show={showModalD} size="lg">
        <Container fluid>
          <Modal.Title>
            <Row>
              <Col>
                <span style={{ fontSize: "24px" }}>
                  <strong>Elimina messaggio</strong>
                </span>
              </Col>
              <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                <CloseButton
                  style={{ marginRight: "0.5vw", marginTop: "0.8vh" }}
                  onClick={() => {
                    setShowModalD(false);
                  }}
                />
              </Col>
            </Row>
          </Modal.Title>
          <Modal.Body
            style={{
              display: "flex",
              justifyContent: "center",
              fontSize: "20px",
              marginTop: "2vh",
            }}
          >
            <span>sei sicuro di voler eliminare il messaggio?</span>
          </Modal.Body>
          <Row style={{ marginTop: "5vh", marginBottom: "1vh" }}>
            <Col style={{ display: "flex", justifyContent: "flex-start" }}>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  setShowModalD(false);
                }}
              >
                No
              </Button>
            </Col>
            <Col style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                size="lg"
                variant="primary"
                onClick={async () => {
                  setShowModalD(false);
                  await deleteMessage();
                }}
              >
                Si
              </Button>
            </Col>
          </Row>
        </Container>
      </Modal>

      {/* modal se si deve caricare un'immagine o video*/}
      <Modal
        centered
        show={showModalImg || selectedResource.length > 0}
        size="lg"
      >
        <Modal.Title>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <CloseButton
              style={{ marginRight: "0.5vw", marginTop: "0.8vh" }}
              onClick={() => {
                setShowModalImg(false);
                setShowCamera(false);
                setSelectedResource("");
                setDescrizione("");
                setImageServer("");
                setIsVideo(false);
              }}
            />
          </div>
        </Modal.Title>
        <Modal.Body>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {!isVideo && selectedResource.length > 0 && (
              <Image
                src={selectedResource}
                style={{ maxWidth: "50vw", maxHeight: "40vh" }}
                fluid
                alt={
                  selectedResource.length > 0 ? truncate(true, descrizione) : ""
                }
              />
            )}
            {isVideo && selectedResource.length > 0 && (
              <ReactPlayer
                url={selectedResource}
                style={{ maxWidth: "50vw", maxHeight: "40vh" }}
                alt={truncate(true, descrizione)}
                controls={true}
              />
            )}

            {showCamera && (
              <div>
                <Camera
                  onTakePhoto={(dataUri) => {
                    handleTakePhoto(dataUri);
                  }}
                />
              </div>
            )}
          </div>
          <Row style={{ marginTop: "5vh" }}>
            <Form.Control
              style={{ width: `calc(100% - ${icon_size}px )` }}
              id="description"
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              type="txt"
              placeholder="aggiungi una descrizione"
            />

            <div
              style={{ cursor: "pointer", width: `${icon_size}px` }}
              onClick={async () => {
                if (selectedResource.length > 0) {
                  setSelectedResource("");
                  setShowCamera(false);
                  await handleCreateMessage();
                  setShowModalImg(false);
                }
              }}
            >
              <Telegram
                size={icon_size / 1.5}
                style={{ transform: "rotate(45deg)" }}
              />
            </div>
          </Row>
        </Modal.Body>
      </Modal>

      {/*modal se si vuole zoomare un'immagine */}
      <Modal centered show={modalZoom} dialogClassName="my-modal">
        <Card>
          <Image
            src={imageModalZoom.src}
            alt={imageModalZoom.alt}
            fluid
            style={{ maxHeight: "100vh" }}
          />
          <Card.ImgOverlay
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <FullscreenExit
              style={{ cursor: "pointer" }}
              onClick={() => {
                setModalZoom(false);
                setImageModalZoom({});
              }}
              role="button"
              color="dark"
              size={icon_size / 3}
            />
          </Card.ImgOverlay>
        </Card>
      </Modal>

      <Navbar className="bg-body-tertiary" style={{ height: "60px" }}>
        <Row style={{ width: "100vw" }}>
          <Col style={{ marginLeft: "1vw", marginTop: "1vh" }}>
            <Nav.Link
              as={Link}
              to={
                !props.youAreInChats
                  ? `${baseUrl}search`
                  : `${baseUrl}conversazioni`
              }
            >
              <Nav.Item
                style={{ maxWidth: icon_size / 2, cursor: "pointer" }}
                role="button"
                onClick={() => {
                  if (!props.youAreInChats) {
                    props.setShowFooter(true);
                  }
                }}
              >
                <ArrowLeftCircle size={icon_size / 2} />
              </Nav.Item>
            </Nav.Link>
          </Col>
          <Col style={{ display: "flex", justifyContent: "flex-end" }}>
            <Image
              src={`${uri}user/${usernameDest}/picture/preview`}
              alt={usernameDest}
              roundedCircle
              fluid
              style={{ maxHeight: "45px" }}
            />
            <span style={{ marginLeft: "1vw", marginTop: "10px" }}>
              <strong>{` ${usernameDest}`}</strong>
            </span>
          </Col>
        </Row>
      </Navbar>

      <div ref={refDiv} style={{ marginTop: "2vh", overflowY: "auto" }}>
        {!isLoading && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginTop: "20px",
              marginBottom: "20px",
              marginRight: "10px",
              marginLeft: "10px",
            }}
          >
            <Button
              size="sm"
              disabled={page <= 1}
              variant="primary"
              onClick={async () => {
                setArrayOneChat([]);
                setIsLoading(true);
                await new Promise((resolve) => setTimeout(resolve, 400));
                setPage((prevValue) => {
                  return prevValue - 1;
                });
                setRefresh((prevValue) => {
                  return !prevValue;
                });
              }}
            >
              messaggi precedenti
            </Button>
          </div>
        )}
        {arrayOneChat.map((el, index) => (
          <Row key={index} style={{ marginTop: "1vh", marginBottom: "1vh" }}>
            <div
              style={{
                marginLeft: "1vw",
                display: "flex",
                justifyContent: "flex-start",
              }}
            >
              {el.msgSender !== props.username ? (
                el.type_msg === "image" ? (
                  <Card className="mycard" style={{ maxWidth: "60vw" }}>
                    <Card.Body>
                      <Image
                        src={el.attachment}
                        alt={truncate(true, el.msg)}
                        fluid
                      />
                      <Card.ImgOverlay
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <Fullscreen
                          onClick={() => {
                            setModalZoom(true),
                              setImageModalZoom({
                                src: el.attachment,
                                alt: `${truncate(true, el.msg)}`,
                              });
                          }}
                          style={{ cursor: "pointer" }}
                          role="button"
                          color="dark"
                          size={icon_size / 3}
                        />
                      </Card.ImgOverlay>
                    </Card.Body>
                    {el.msg !== "" && (
                      <Card.Header>
                        <Card.Text>{el.msg}</Card.Text>
                      </Card.Header>
                    )}
                    <FooterCard
                      index={undefined}
                      data={el.data}
                      orario={el.orario}
                    />
                  </Card>
                ) : el.type_msg === "video" ? (
                  <Card className="mycardvideo" style={{ maxWidth: "60vw" }}>
                    <Card.Body>
                      <ReactPlayer
                        style={{ marginTop: "-7vh" }}
                        width="50vw"
                        height="50vw"
                        url={el.attachment}
                        alt={truncate(true, el.msg)}
                        controls={true}
                      />
                    </Card.Body>
                    {el.msg !== "" && (
                      <Card.Header>
                        <Card.Text>{el.msg}</Card.Text>
                      </Card.Header>
                    )}
                    <FooterCard
                      index={undefined}
                      data={el.data}
                      orario={el.orario}
                    />
                  </Card>
                ) : (
                  <Card style={{ maxWidth: "60vw" }}>
                    <Card.Body>
                      <Card.Text>{el.msg}</Card.Text>
                    </Card.Body>
                    <FooterCard
                      index={undefined}
                      data={el.data}
                      orario={el.orario}
                    />
                  </Card>
                )
              ) : (
                <span></span>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {el.msgSender === props.username ? (
                el.type_msg === "image" ? (
                  <Card
                    className="mycard"
                    style={{
                      marginRight: "2vw",
                      maxWidth: "60vw",
                      backgroundColor: "rgb(39, 66, 41)",
                      zIndex: "1",
                    }}
                  >
                    <Card.Body>
                      <Image
                        src={el.attachment}
                        alt={truncate(true, el.msg)}
                        fluid
                      />
                      <Card.ImgOverlay
                        as="div"
                        style={{ display: "flex", justifyContent: "flex-end" }}
                      >
                        <Fullscreen
                          onClick={(event) => {
                            event.stopPropagation();
                            setModalZoom(true);
                            setImageModalZoom({
                              src: el.attachment,
                              alt: `${truncate(true, el.msg)}`,
                            });
                          }}
                          style={{ cursor: "pointer" }}
                          role="button"
                          color="dark"
                          size={icon_size / 3}
                        />
                      </Card.ImgOverlay>
                    </Card.Body>
                    {el.msg !== "" && (
                      <Card.Header>
                        <Card.Text>{el.msg}</Card.Text>
                      </Card.Header>
                    )}
                    <FooterCard
                      setCurrentIndex={setCurrentIndex}
                      setShowModalD={setShowModalD}
                      index={index}
                      data={el.data}
                      orario={el.orario}
                    />
                  </Card>
                ) : el.type_msg === "video" ? (
                  <Card
                    className="mycardvideo"
                    style={{
                      marginRight: "2vw",
                      maxWidth: "60vw",
                      backgroundColor: "rgb(39, 66, 41)",
                    }}
                  >
                    <Card.Body>
                      <ReactPlayer
                        style={{ marginTop: "-7vh" }}
                        width="50vw"
                        height="50vw"
                        url={el.attachment}
                        alt={truncate(true, el.msg)}
                        controls={true}
                      />
                    </Card.Body>
                    {el.msg !== "" && (
                      <Card.Header>
                        <Card.Text>{el.msg}</Card.Text>
                      </Card.Header>
                    )}
                    <FooterCard
                      setCurrentIndex={setCurrentIndex}
                      setShowModalD={setShowModalD}
                      index={index}
                      data={el.data}
                      orario={el.orario}
                    />
                  </Card>
                ) : el.type_msg === "text" ? (
                  <Card
                    style={{
                      marginRight: "2vw",
                      backgroundColor: "rgb(39, 66, 41)",
                      maxWidth: "60vw",
                      zIndex: "1",
                    }}
                  >
                    <Card.Body>
                      <Card.Text>{el.msg}</Card.Text>
                    </Card.Body>
                    <FooterCard
                      setCurrentIndex={setCurrentIndex}
                      setShowModalD={setShowModalD}
                      index={index}
                      data={el.data}
                      orario={el.orario}
                    />
                  </Card>
                ) : (
                  <Card
                    style={{
                      marginRight: "2vw",
                      backgroundColor: "rgb(39, 66, 41)",
                      maxWidth: "60vw",
                      zIndex: "1",
                    }}
                  >
                    <Card.Body>
                      <Card.Text style={{ opacity: "0.5" }}>
                        <SlashCircle
                          style={{
                            transform: "rotate(90deg)",
                            marginRight: "2vw",
                          }}
                          size={icon_size / 3}
                        />
                        {el.msg}
                      </Card.Text>
                    </Card.Body>
                    <FooterCard
                      messageDeleted={true}
                      setCurrentIndex={setCurrentIndex}
                      setShowModalD={setShowModalD}
                      index={index}
                      data={el.data}
                      orario={el.orario}
                    />
                  </Card>
                )
              ) : (
                <span></span>
              )}
            </div>
          </Row>
        ))}
        {isLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: "35vh",
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
              justifyContent: "flex-end",
              marginTop: "20px",
              marginBottom: "80px",
              marginRight: "10px",
              marginLeft: "10px",
            }}
          >
            <Button
              size="sm"
              disabled={arrayOneChat.length === 0}
              variant="primary"
              onClick={async () => {
                setArrayOneChat([]);
                setIsLoading(true);
                await new Promise((resolve) => setTimeout(resolve, 400));
                setPage((prevValue) => {
                  return prevValue + 1;
                });
                setRefresh((prevValue) => {
                  return !prevValue;
                });
              }}
            >
              messaggi successivi
            </Button>
          </div>
        )}
      </div>

      <Row
        style={{
          position: "fixed",
          bottom: "0vh",
          width: "100vw",
          height: "70px",
          zIndex: 2,
        }}
        className="bg-body-tertiary"
      >
        <Col xs={2} sm={2}>
          <Dropdown autoClose="outside">
            <Dropdown.Toggle
              disabled={selectedResource.length > 0}
              variant="secondary"
              style={{ marginLeft: "10px", marginTop: "15px" }}
            >
              <Paperclip
                size={icon_size / 2.5}
                style={{ transform: "rotate(45deg)" }}
              />
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item
                as="div"
                role="button"
                onClick={() => {
                  setShowCamera(true);
                  setShowModalImg(true);
                }}
              >
                <Camera2 size={icon_size / 3} />
                <span> scatta una foto</span>
              </Dropdown.Item>
              <Dropdown.Item
                as="div"
                role="button"
                onClick={() => {
                  setShowModalImg(true);
                }}
              >
                <FontAwesomeIcon icon={faImages} style={{ color: "white" }} />
                <ImageVideo
                  setImageServer={setImageServer}
                  selectedResource={selectedResource}
                  setSelectedResource={setSelectedResource}
                  type_msg="image/*"
                  name_type_msg=" carica una foto"
                  setIsVideo={setIsVideo}
                />
              </Dropdown.Item>
              <Dropdown.Item as="div" role="button">
                <FontAwesomeIcon icon={faImages} style={{ color: "white" }} />
                <RandomImage
                  setImageServer={setImageServer}
                  setSelectedResource={setSelectedResource}
                />
              </Dropdown.Item>
              <Dropdown.Item
                as="div"
                role="button"
                onClick={() => {
                  setShowModalImg(true);
                }}
              >
                <FontAwesomeIcon icon={faVideo} style={{ color: "white" }} />
                <ImageVideo
                  setImageServer={setImageServer}
                  selectedResource={selectedResource}
                  setSelectedResource={setSelectedResource}
                  type_msg="video/mp4"
                  name_type_msg=" carica un video"
                  setIsVideo={setIsVideo}
                />
              </Dropdown.Item>
              <Dropdown.Item
                as="div"
                role="button"
                onClick={() => {
                  setShowModal(true);
                }}
              >
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{ color: "white" }}
                />
                <span> Geolocalizzazione</span>

                <GeoModal
                  showModal={showModal}
                  setImageServer={setImageServer}
                  setShowModal={setShowModal}
                  selectedResource={selectedResource}
                  setSelectedResource={setSelectedResource}
                />
              </Dropdown.Item>
              <Wikipedia setInputText={setInputTxt} inputText={inputTxt} />
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col xs={8} sm={8}>
          <Form.Control
            as="textarea"
            name="textarea"
            value={inputTxt}
            onChange={(event) => {
              setInputTxt(() => {
                return event.target.value;
              });
            }}
            style={{ marginTop: "4px" }}
            placeholder="invia un nuovo &#10;  messaggio"
          />
        </Col>
        <Col
          xs={2}
          sm={2}
          style={{ display: "flex", justifyContent: "flex-end" }}
        >
          <div role="button" style={{ cursor: "pointer" }}>
            <Telegram
              onClick={async () => await handleCreateMessage()}
              size={icon_size / 1.5}
              style={{ transform: "rotate(45deg)", marginTop: "15px" }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
export default OneChat;
