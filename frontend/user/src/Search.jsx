import {
  Image,
  Col,
  Row,
  CloseButton,
  Modal,
  Button,
  Form,
  Card,
  Container,
  Nav,
  FloatingLabel,
  Spinner,
} from "react-bootstrap";
import { useState, useEffect, useLayoutEffect } from "react";
import { BsSearch } from "react-icons/bs";
import {
  icon_size,
  baseUrl,
  sendRequest,
  uri,
  fetchImgPreview,
  fetchImg,
  NoLogin,
} from "./Const.js";
import { Link } from "react-router-dom";
import CustomInput from "./CustomInput.jsx";
import useWindowDimensions from "./useWindowDimensions.jsx";
import { toast } from "react-toastify";

function Search(props) {
  const [showIcon, setShowIcon] = useState(true);
  const [inputText, setInputText] = useState("");

  const navbar_size = 15;

  const { width } = useWindowDimensions();
  const [fontSize, setFontSize] = useState("16px");

  const [isLoading, setIsLoading] = useState(false);

  useLayoutEffect(() => {
    if (width < 440) {
      setFontSize("14px");
    } else if (width > 440 && width < 540) {
      setFontSize("18px");
    } else {
      setFontSize("20px");
    }
  }, [width]);

  const [showMChannel, setShowMChannel] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    props.setShowFooter(true);
  }, []);

  const [isSearchByBio, setIsSearchByBio] = useState("Nome");

  const [usersIsActive, setUsersIsActive] = useState(true);
  const [pageUsers, setPageUsers] = useState(1);
  const [pageChannel, setPageChannel] = useState(1);

  useEffect(() => {
    if (!inputText) {
      if (!firstUsers && usersIsActive) {
        setProfiles([]);
        return;
      }
      if (!firstChannels && !usersIsActive) {
        setChannels([]);
        return;
      }
    }

    if (isSearchByBio === "Nome") {
      if (usersIsActive) {
        if (firstUsers) {
          fetchUsers("username", true);
        } else fetchUsers("username", false);
      } else {
        if (firstChannels) {
          fetchChannels("name", true);
        } else fetchChannels("name", false);
      }
    } else if (isSearchByBio === "Bio") {
      if (usersIsActive) {
        if (firstUsers) {
          fetchUsers("bio", true);
        } else fetchUsers("bio", false);
      } else {
        if (firstChannels) {
          fetchChannels("bio", true);
        } else fetchChannels("bio", false);
      }
    }
  }, [inputText, usersIsActive]);

  useEffect(() => {
    if (inputText.length > 0) {
      if (usersIsActive) setFirstUsers(false);
      else setFirstChannels(false);
    }
  }, [inputText]);

  const [firstChannels, setFirstChannels] = useState(true);
  const [firstUsers, setFirstUsers] = useState(true);
  const [refreshPage, setRefreshPage] = useState(false);

  //ritorna tutti i canali o utenti (si usa all'inizio quando entri nella search per vedere tutti i canali o utenti)
  function getAll(mode, yes) {
    if (yes) return "";
    else {
      if (inputText[0] === "#") {
        return `&${mode}=${encodeURIComponent(inputText)}`;
      } else return `&${mode}=${inputText}`;
    }
  }

  const fetchUsers = async (mode, yes) => {
    const res = await sendRequest(
      new Request(`${uri}user/?page=${pageUsers}${getAll(mode, yes)}`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();

    const promises = json.page.map(async (el) => {
      const img = await fetchImgPreview("user", el.username);
      return { img: img, username: el.username };
    });

    Promise.all(promises).then((results) => {
      setProfiles([...results]);
    });
    setIsLoading(false);
  };

  const fetchChannels = async (mode, yes) => {
    const res = await sendRequest(
      new Request(`${uri}channel/?page=${pageChannel}${getAll(mode, yes)}`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    const promises = json.page.map(async (el) => {
      var img;
      if (el.name[0] === "#") img = await fetchImg("channel", el.name);
      else img = await fetchImgPreview("channel", el.name);
      return { img: img, username: el.name };
    });

    Promise.all(promises).then((results) => {
      setChannels([...results]);
    });
    setIsLoading(false);
  };

  useEffect(() => {
    if (isSearchByBio === "Nome") {
      fetchUsers("username", false);
    } else if (isSearchByBio === "Bio") {
      fetchUsers("bio", false);
    }
  }, [pageUsers, refreshPage]);

  useEffect(() => {
    if (isSearchByBio === "Nome") {
      fetchChannels("name", false);
    } else if (isSearchByBio === "Bio") {
      fetchChannels("bio", false);
    }
  }, [pageChannel, refreshPage]);

  const fetchCreateChannel = async (name, description, type) => {
    if (name[0] === "#") {
      toast.error("non puoi creare canali temporanei in questo modo", {
        className: "toast-message",
      });
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (type === "Privato") {
      formData.append("privacy", "private");
    } else if (type === "Pubblico") formData.append("privacy", "public");

    const res = await sendRequest(
      new Request(`${uri}channel/`, {
        method: "POST",
        body: formData,
      }),
    );
    if (res.ok) {
      toast.success("canale creato con successo", {
        className: "toast-message",
      });
    } else {
      toast.error(
        "formato del nome del canale non valido, non si possono mettere lettere maiuscole o simboli",
        { className: "toast-message" },
      );
    }
  };

  useEffect(() => {
    if (usersIsActive) setPageUsers(1);
    else setPageChannel(1);
  }, [inputText]);

  return (
    <div>
      {/**modal per la creazione di un canale */}
      <Modal centered show={showMChannel} size="lg">
        <Container fluid style={{ marginTop: "1vh" }}>
          <Modal.Title>
            <Row>
              <Col>
                <span>Crea nuovo canale</span>
              </Col>
              <Col style={{ display: "flex", justifyContent: "flex-end" }}>
                <CloseButton onClick={() => setShowMChannel(false)} />
              </Col>
            </Row>
          </Modal.Title>
          <Form
            onSubmit={async (e) => {
              e.preventDefault();
              await fetchCreateChannel(
                e.target[0].value,
                e.target[1].value,
                e.target[2].value,
              );
            }}
          >
            <Modal.Body style={{ fontSize: "20px", marginTop: "2vh" }}>
              <CustomInput label="nome del canale" />
              <div style={{ marginTop: "20px" }}>
                <CustomInput label="aggiungi una bio" />
              </div>
              <div style={{ marginTop: "20px" }}>
                <CustomInput isDropdown={true} label="scegli la visibilitá" />
              </div>
            </Modal.Body>
            <Modal.Footer
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Button
                size="lg"
                variant="primary"
                type="submit"
                style={{ marginTop: "2vh" }}
                onClick={() => setShowMChannel(false)}
              >
                crea
              </Button>
            </Modal.Footer>
          </Form>
        </Container>
      </Modal>

      <div className="bg-body-tertiary" style={{ height: "140px" }}>
        <Row>
          <Col
            style={{ marginTop: "10px", maxWidth: "80vw", marginLeft: "10vw" }}
          >
            <FloatingLabel controlId="floatingSelect" label="ricerca per">
              <Form.Select
                aria-label="Default select"
                onChange={(e) => {
                  setIsSearchByBio(e.target.value);
                }}
              >
                <option value="Nome">Nome</option>
                <option value="Bio">Bio</option>
              </Form.Select>
            </FloatingLabel>
          </Col>
        </Row>
        <Row>
          <Col>
            <Card
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginTop: "18px",
                width: "calc(100vw - 130px - 2vw - 1vw - 5vw)",
                marginRight: "2vw",
                marginLeft: "1vw",
              }}
            >
              <Row>
                {showIcon && (
                  <Col
                    style={{
                      maxWidth: icon_size / 3,
                      marginLeft: "1vw",
                      marginTop: "0.2vh",
                    }}
                  >
                    <BsSearch size={icon_size / 3} />
                  </Col>
                )}
                <Col>
                  <Form.Control
                    name={"search"}
                    value={inputText}
                    onChange={(event) => {
                      setInputText(event.target.value);
                    }}
                    onClick={() => setShowIcon(false)}
                    style={{
                      border: "none",
                      outline: "none",
                      boxShadow: "none",
                    }}
                    type="txt"
                    placeholder="cerca su squealer"
                  />
                </Col>
                {!showIcon && (
                  <Col
                    style={{
                      maxWidth: icon_size,
                      display: "flex",
                      justifyContent: "flex-end",
                      marginRight: "1vw",
                      marginTop: "0.5vh",
                    }}
                  >
                    <CloseButton
                      onClick={() => {
                        setInputText("");
                        setShowIcon(true);
                      }}
                    />
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
          {sessionStorage.getItem("refreshToken") !== NoLogin && (
            <Col
              style={{ marginTop: "15px", marginRight: "2vw", width: "130px" }}
            >
              <Button onClick={() => setShowMChannel(true)} variant="primary">
                crea canale
              </Button>
            </Col>
          )}
        </Row>
      </div>
      <Nav variant="underline" defaultActiveKey={1}>
        <Nav.Item style={{ marginLeft: "2vw" }}>
          <Nav.Link
            as="div"
            eventKey={1}
            onClick={() => {
              setInputText("");
              setUsersIsActive(true);
            }}
            style={
              usersIsActive
                ? { color: "white", cursor: "pointer" }
                : {
                    color: "#ADB5BD",
                    cursor: "pointer",
                  }
            }
          >
            <p
              style={{
                fontWeight: "bold",
                fontSize: `calc(${fontSize} + 10px)`,
                display: "flex",
                justifyContent: "center",
              }}
            >
              Utenti
            </p>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item style={{ marginLeft: "2vw" }}>
          <Nav.Link
            as="div"
            eventKey={2}
            onClick={() => {
              setInputText("");
              setUsersIsActive(false);
            }}
            style={
              !usersIsActive
                ? { color: "white", cursor: "pointer" }
                : {
                    color: "#ADB5BD",
                    cursor: "pointer",
                  }
            }
          >
            <p
              style={{
                fontWeight: "bold",
                fontSize: `calc(${fontSize} + 10px)`,
                display: "flex",
                justifyContent: "center",
              }}
            >
              Canali
            </p>
          </Nav.Link>
        </Nav.Item>
      </Nav>

      <div
        style={{
          fontSize: `${fontSize}`,
          overflowY: "auto",
          marginTop: "10px",
        }}
      >
        {usersIsActive ? (
          <div>
            {profiles.map((el, index) => (
              <Nav.Link
                key={index}
                as={Link}
                to={`${baseUrl}user/${el.username}`}
              >
                <Card style={{ borderStyle: "none" }}>
                  <Card.Body>
                    <div>
                      <Image
                        roundedCircle
                        fluid
                        src={el.img}
                        alt={`immagine profilo di ${el.username}`}
                        style={{ height: "10vh", width: "10vh" }}
                      />
                      <span
                        style={{
                          marginLeft: "20px",
                          whiteSpace: "break-spaces",
                        }}
                      >
                        {el.username}
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            ))}
            <div>
              {isLoading ? (
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
                    marginBottom: `${props.footerHeight}px`,
                    marginRight: "10px",
                    marginLeft: "10px",
                  }}
                >
                  <Button
                    size="sm"
                    style={{ fontSize: `${fontSize}` }}
                    disabled={pageUsers <= 1}
                    variant="primary"
                    onClick={async () => {
                      setProfiles([]);
                      setIsLoading(true);
                      await new Promise((resolve) => setTimeout(resolve, 400));
                      setPageUsers((prevValue) => {
                        return prevValue - 1;
                      });
                      setRefreshPage((prevValue) => {
                        return !prevValue;
                      });
                    }}
                  >
                    pagina precedente
                  </Button>
                  <Button
                    size="sm"
                    style={{ fontSize: `${fontSize}` }}
                    disabled={profiles.length === 0}
                    variant="primary"
                    onClick={async () => {
                      setProfiles([]);
                      setIsLoading(true);
                      await new Promise((resolve) => setTimeout(resolve, 400));
                      setPageUsers((prevValue) => {
                        return prevValue + 1;
                      });
                      setRefreshPage((prevValue) => {
                        return !prevValue;
                      });
                    }}
                  >
                    pagina successiva
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {channels.map((el, index) => (
              <Nav.Link
                key={index}
                as={Link}
                to={`${baseUrl}channel/${encodeURIComponent(el.username)}`}
              >
                <Card style={{ borderStyle: "none" }}>
                  <Card.Body>
                    <div>
                      <Image
                        roundedCircle
                        fluid
                        src={el.img}
                        alt={`immagine profilo di ${el.username}`}
                        style={{ height: "10vh", width: "10vh" }}
                      />
                      <span
                        style={{
                          marginLeft: "20px",
                          whiteSpace: "break-spaces",
                        }}
                      >
                        {el.username}
                      </span>
                    </div>
                  </Card.Body>
                </Card>
              </Nav.Link>
            ))}
            <div>
              {isLoading ? (
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
                    marginRight: "10px",
                    marginLeft: "10px",
                    marginBottom: `${props.footerHeight}px`,
                  }}
                >
                  <Button
                    size="sm"
                    style={{ fontSize: `${fontSize}` }}
                    disabled={pageChannel <= 1}
                    variant="primary"
                    onClick={async () => {
                      setChannels([]);
                      setIsLoading(true);
                      await new Promise((resolve) => setTimeout(resolve, 400));
                      setPageChannel((prevValue) => {
                        return prevValue - 1;
                      });
                      setRefreshPage((prevValue) => {
                        return !prevValue;
                      });
                    }}
                  >
                    pagina precedente
                  </Button>
                  <Button
                    size="sm"
                    style={{ fontSize: `${fontSize}` }}
                    disabled={channels.length === 0}
                    variant="primary"
                    onClick={async () => {
                      setChannels([]);
                      setIsLoading(true);
                      await new Promise((resolve) => setTimeout(resolve, 400));
                      setPageChannel((prevValue) => {
                        return prevValue + 1;
                      });
                      setRefreshPage((prevValue) => {
                        return !prevValue;
                      });
                    }}
                  >
                    pagina successiva
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default Search;
