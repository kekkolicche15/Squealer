import { useState, useEffect, useLayoutEffect } from "react";
import {
  Container,
  Dropdown,
  Form,
  Row,
  Col,
  Modal,
  Button,
  CloseButton,
  Nav,
} from "react-bootstrap";
import {
  PersonCircle,
  People,
  SlashCircle,
  Unlock,
  ChevronDoubleUp,
} from "react-bootstrap-icons";
import { icon_size, baseUrl } from "./Const.js";
import "./DropdownFollowing.css";
import useWindowDimensions from "./useWindowDimensions.jsx";
import { Link } from "react-router-dom";

function DropdownFollowing(props) {
  const [inputValue, setInputValue] = useState("");
  const [followsVisible, setFollowsVisible] = useState(props.following);

  const [showMBan, setShowMBan] = useState(false);
  const [showMSban, setShowMSban] = useState(false);
  const [usernameBanned, setUsernameBanned] = useState("");
  const [isBanned, setIsBanned] = useState(undefined);

  const { width } = useWindowDimensions();

  const [menuSize, setMenuSize] = useState(0);

  useLayoutEffect(() => {
    setMenuSize(Math.max(300, width / 4));
  }, [width]);

  function handleLoadMore() {
    props.setPage(props.page + 1);
  }

  function handleLoadLess() {
    props.setPage(props.page - 1);
  }

  useEffect(() => {
    if (inputValue !== "") {
      if (props.myRole !== undefined)
        setFollowsVisible(
          props.following.filter((el) =>
            el.name.toLowerCase().includes(inputValue.toLowerCase()),
          ),
        );
      else
        setFollowsVisible(
          props.following.filter((el) =>
            el.toLowerCase().includes(inputValue.toLowerCase()),
          ),
        );
    } else {
      setFollowsVisible(props.following);
    }
  }, [inputValue]);

  useEffect(() => {
    setFollowsVisible(props.following);
  }, [props.following]);

  async function HandleSubmit(e) {
    e.preventDefault();
    if (isBanned === "si") {
      props.setBannedList((prevArray) => {
        return [...prevArray, usernameBanned];
      });
      await props.banUser(usernameBanned);
    } else if (isBanned === "no") await props.removeUser(usernameBanned);

    props.setMembers((prevArray) => {
      return prevArray.filter((el) => el.name !== usernameBanned);
    });
    setShowMBan(false);
  }

  const [modalPromote, setModalPromote] = useState(false);
  const [usernamePromote, setUsernamePromote] = useState("");
  const [promoteOrDemote, setPromoteOrDemote] = useState("");

  return (
    <div>
      {/*
                modal per gestire ban e rimozione
            */}
      <Modal centered show={showMBan}>
        <Modal.Title>
          <Row>
            <Col style={{ marginTop: "0.5vh", marginLeft: "2vw" }}>
              <span style={{ fontSize: "24px" }}>
                <strong>Rimuovi o Banna</strong>
              </span>
            </Col>
            <Col
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginRight: "0.5vw",
                marginTop: "0.8vh",
              }}
            >
              <CloseButton
                onClick={() => {
                  setShowMBan(false);
                }}
              />
            </Col>
          </Row>
        </Modal.Title>
        <hr />
        <Form onSubmit={async (e) => HandleSubmit(e)}>
          <Modal.Body>
            <Form.Control
              id={Math.random().toString()}
              onChange={(e) => {
                e.target.value === "Ban"
                  ? setIsBanned("si")
                  : e.target.value === "Rimozione"
                    ? setIsBanned("no")
                    : "";
              }}
              as="select"
              required
              aria-label="Default select example"
            >
              <option value="">scegli fra</option>
              <option value="Ban">Bannare {usernameBanned}</option>
              <option value="Rimozione">Rimuovere {usernameBanned}</option>
            </Form.Control>
            <div style={{ marginTop: "3vh" }}>
              {isBanned === "si" ? (
                <p>
                  {usernameBanned} verrá rimosso/a dal canale e non potrá piú
                  entrarci fin quando non verrá sbannato/a
                </p>
              ) : isBanned === "no" ? (
                <p>{usernameBanned} verrá rimosso/a dal canale</p>
              ) : (
                <></>
              )}
            </div>
          </Modal.Body>
          <Container fluid>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "5vh",
                marginBottom: "2vh",
              }}
            >
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowMBan(false)}
              >
                no
              </Button>
              <Button size="lg" type="submit" variant="primary">
                si
              </Button>
            </div>
          </Container>
        </Form>
      </Modal>

      {/*
                modal per gestire i sban
                */}
      <Modal centered show={showMSban}>
        <Modal.Title>
          <Row>
            <Col style={{ marginTop: "0.5vh", marginLeft: "2vw" }}>
              <span style={{ fontSize: "24px" }}>
                <strong>Sbanna</strong>
              </span>
            </Col>
            <Col
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginRight: "0.5vw",
                marginTop: "0.8vh",
              }}
            >
              <CloseButton
                onClick={() => {
                  setShowMSban(false);
                }}
              />
            </Col>
          </Row>
        </Modal.Title>
        <hr />
        <Modal.Body>
          <p>{`Sei sicuro/a di voler sbannare ${usernameBanned}?`}</p>
          <p>{`${usernameBanned} sará di nuovo in grado di potersi iscrivere al canale`}</p>

          <div
            style={{
              marginTop: "4vh",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setShowMSban(false);
              }}
            >
              no
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={async () => {
                setShowMSban(false);
                props.setBannedList((prevArray) => {
                  return prevArray.filter((el) => el !== usernameBanned);
                });
                await props.sbanUser(usernameBanned);
              }}
            >
              si
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/*
                modal per gestire le promozioni a moderator o declassamenti a membri
                */}
      <Modal centered show={modalPromote}>
        <Modal.Title>
          <Row>
            <Col style={{ marginTop: "0.5vh", marginLeft: "2vw" }}>
              <span style={{ fontSize: "24px" }}>
                <strong>
                  {promoteOrDemote === "promuovi" ? `Promuovi` : "Declassa"}
                </strong>
              </span>
            </Col>
            <Col
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginRight: "0.5vw",
                marginTop: "0.8vh",
              }}
            >
              <CloseButton
                onClick={() => {
                  setModalPromote(false);
                  setUsernamePromote("");
                }}
              />
            </Col>
          </Row>
        </Modal.Title>
        <hr />
        <Modal.Body>
          {promoteOrDemote === "promuovi" ? (
            <p>{`Sei sicuro di voler promuovere a moderatore ${usernamePromote}?`}</p>
          ) : (
            <p>{`Sei sicuro di voler declassare a membro ${usernamePromote}?`}</p>
          )}
          <div
            style={{
              marginTop: "4vh",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setModalPromote(false);
                setUsernamePromote("");
              }}
            >
              no
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={async () => {
                var role;
                if (promoteOrDemote === "promuovi") {
                  role = "moderator";
                  await props.promoteModerator(usernamePromote);
                } else {
                  role = "member";
                  await props.removeModerator(usernamePromote);
                }

                props.setMembers(
                  props.following.map((el) => {
                    if (el.name === usernamePromote)
                      return { name: el.name, role: role };
                    else return { name: el.name, role: el.role };
                  }),
                );
                setUsernamePromote("");
                setModalPromote(false);
              }}
            >
              si
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <Dropdown autoClose="outside" onToggle={() => setInputValue("")}>
        {!(!props.bannedList && (props.isChannel || props.isExternProfile)) ? (
          <Dropdown.Toggle
            as="span"
            variant="primary"
            role="button"
            style={{ cursor: "pointer" }}
          >
            {props.bannedList ? (
              <div>
                <SlashCircle
                  style={{ transform: "rotate(90deg)", color: "red" }}
                />{" "}
                <span>lista delle persone bannate</span>
              </div>
            ) : (
              <div>
                <People />{" "}
                <span>{props.is_followers ? "followers" : "following"} </span>
              </div>
            )}
          </Dropdown.Toggle>
        ) : (
          <Dropdown.Toggle
            variant="secondary"
            role="button"
            style={{ cursor: "pointer" }}
          >
            <div>
              <People />
              <span>
                {props.isChannel
                  ? "membri"
                  : props.is_followers
                    ? "followers"
                    : "following"}
              </span>
            </div>
          </Dropdown.Toggle>
        )}
        <Dropdown.Menu
          style={{
            width: `${menuSize}px`,
            minHeight: "100px",
            minWidth: "200px",
            overflowY: "auto",
            maxHeight: `calc(25vh)`,
          }}
        >
          <Dropdown.Item
            as="div"
            bsPrefix="my-dropdown-item"
            style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
            onClick={(event) => {
              event.preventDefault();
            }}
          >
            <Container fluid>
              <Form.Control
                style={{ width: `calc(${menuSize}px - 30px)` }}
                value={inputValue}
                id={Math.random().toString()}
                type="text"
                placeholder="scrivi per filtrare"
                onChange={(event) => setInputValue(event.target.value)}
              />
            </Container>
          </Dropdown.Item>
          <Dropdown.Divider />
          {followsVisible.map((element) => (
            <Dropdown.Item
              key={Math.random()}
              as="div"
              style={{
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
                marginLeft: "-10px",
              }}
            >
              <Row>
                <Col xs={6} sm={6}>
                  <Nav.Link
                    as={Link}
                    to={`${baseUrl}user/${
                      props.isChannel ? element.name : element
                    }`}
                  >
                    <PersonCircle
                      size={icon_size / 3}
                      style={
                        element.role === "owner"
                          ? {
                              border: "2px solid gold",
                              borderRadius: "45px",
                            }
                          : element.role === "moderator"
                            ? {
                                border: "2px solid green",
                                borderRadius: "45px",
                              }
                            : {}
                      }
                    />{" "}
                    {props.isChannel ? element.name : element}
                  </Nav.Link>
                </Col>
                {props.myRole === "owner" && element.role === "member" ? (
                  <Col xs={2} sm={2}>
                    <ChevronDoubleUp
                      color="green"
                      size={icon_size / 3}
                      style={{ cursor: "pointer" }}
                      role="button"
                      onClick={() => {
                        setPromoteOrDemote("promuovi");
                        setModalPromote(true);
                        setUsernamePromote(element.name);
                      }}
                    />
                  </Col>
                ) : (
                  props.myRole === "owner" &&
                  element.role === "moderator" && (
                    <Col xs={2} sm={2}>
                      <ChevronDoubleUp
                        color="red"
                        size={icon_size / 3}
                        style={{
                          transform: "rotate(180deg)",
                          cursor: "pointer",
                        }}
                        role="button"
                        onClick={() => {
                          setPromoteOrDemote("declassa");
                          setModalPromote(true);
                          setUsernamePromote(element.name);
                        }}
                      />
                    </Col>
                  )
                )}

                <Col
                  xs={4}
                  sm={4}
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  {(props.myRole === "owner" ||
                    (props.myRole === "moderator" &&
                      element.role === "member")) &&
                    element.name !== props.ownUsername && (
                      <SlashCircle
                        onClick={() => {
                          setShowMBan(true);
                          setUsernameBanned(element.name);
                        }}
                        style={{
                          marginRight: "5px",
                          transform: "rotate(90deg)",
                          cursor: "pointer",
                          color: "red",
                        }}
                        role="button"
                      />
                    )}
                  {props.bannedList && (
                    <Unlock
                      role="button"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setUsernameBanned(element);
                        setShowMSban(true);
                      }}
                    />
                  )}
                </Col>
              </Row>
            </Dropdown.Item>
          ))}
          {!props.sbanUser && (
            <>
              <Dropdown.Divider />
              <Dropdown.Item
                as="div"
                style={{
                  marginTop: "15px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Button
                  size="sm"
                  style={{ fontSize: `${props.fontSize}` }}
                  disabled={props.page <= 1 || inputValue}
                  variant="primary"
                  onClick={handleLoadLess}
                >
                  torna indietro
                </Button>
                <Button
                  size="sm"
                  style={{ fontSize: `${props.fontSize}` }}
                  disabled={props.following.length === 0 || inputValue}
                  variant="primary"
                  onClick={handleLoadMore}
                >
                  Carica altri
                </Button>
              </Dropdown.Item>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
export default DropdownFollowing;
