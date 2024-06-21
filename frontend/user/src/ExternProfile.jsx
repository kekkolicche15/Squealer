import { useEffect, useState, useLayoutEffect } from "react";
import TooltipVip from "./TooltipVip.jsx";
import Post from "./componentsHome/Post.jsx";
import DropdownFollowing from "./DropdownFollowing.jsx";
import useWindowDimensions from "./useWindowDimensions.jsx";
import {
  Row,
  Col,
  Image,
  Button,
  Modal,
  CloseButton,
  Offcanvas,
  Container,
  Tooltip,
  OverlayTrigger,
  Nav,
  Spinner,
  FloatingLabel,
  Form,
  Card,
} from "react-bootstrap";
import {
  Eye,
  EyeSlash,
  ChevronDown,
  StarFill,
  PersonWorkspace,
  Envelope,
  Book,
  Person,
  CaretUp,
} from "react-bootstrap-icons";
import {
  icon_size,
  sendRequest,
  uri,
  fetchImgPreview,
  fetchAttachment,
  NoLogin,
} from "./Const.js";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";

function ExternProfile(props) {
  const { username } = useParams();

  useEffect(() => {
    props.setShowFooter(true);
  }, []);

  //parametri del profilo da modificare
  const [role, setRole] = useState("");
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [youAreFollowingHim, setYouAreFollowingHim] = useState(false);
  const [isSilenced, setIsSilenced] = useState(false);
  const [img, setImg] = useState("");
  const [bio, setBio] = useState(
    "Hey, sto usando Squealer (sì, lo so... che originalità...)",
  );
  const [email, setEmail] = useState("undefined@gmail.com");
  const [ssm, setSsm] = useState("");
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [getPosts, setGetPosts] = useState(false);
  const [pagePosts, setPagePosts] = useState(1);
  const [sort, setSort] = useState(null);

  function handleSelect(e) {
    if (e.target.value === "dal piú vecchio") setSort("oldest");
    else if (e.target.value === "popolari") setSort("popularity");
    else if (e.target.value === "impopolari") setSort("unpopularity");
    else if (e.target.value === "controversi") setSort("controversiality");
    else setSort(null);
  }

  useEffect(() => {
    fetchPosts();
  }, [getPosts]);

  function getSort() {
    if (sort) return `&sort=${sort}`;
    else return "";
  }

  //da modificare
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    const res = await sendRequest(
      new Request(
        `${uri}post/?page=${pagePosts}&author=${username}${getSort()}`,
        {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        },
      ),
    );
    const json = await res.json();
    const promises = json.page.map(async (el) => {
      const url_img_channel = await fetchImgPreview("channel", el.channel);
      const img = await fetchImgPreview("user", el.author);
      var attachment = "";
      if (el.contentType !== "text")
        attachment = await fetchAttachment(el._id, "post");
      return {
        url_img_sender: img,
        username_sender: el.author,
        username_channel: el.channel,
        url_img_channel: url_img_channel,
        time: el.date + " " + el.time,
        location: el.location || "",
        type_msg: el.contentType,
        msg: el.content || "",
        popularity: el.popularity,
        userReaction: el.userReaction,
        reactions: el.reactions,
        attachment: attachment,
        _id: el._id,
        views: el.views,
        references: el.references,
      };
    });

    Promise.all(promises).then((results) => {
      setPosts([...results]);
    });
    setIsLoading(false);
  };

  //serve a fare in modo che il useEffect non venga attivato onMount
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    if (isMounted) setIsMounted(false);
    else {
      setPagePosts(1);
      setGetPosts(!getPosts);
    }
  }, [sort]);

  const [followingPage, setFollowingPage] = useState(1);
  const [followerPage, setFollowerPage] = useState(1);

  useEffect(() => {
    props.setYouAreInChats(false);
  }, []);

  const fetchIsFollowing = async (user1, user2) => {
    const res = await sendRequest(
      new Request(`${uri}user/${user1}/isfollowing/${user2}`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );

    const json = await res.json();
    if (user1 === props.ownUsername) setYouAreFollowingHim(json.response);
    else {
      if (json.response) {
        return true;
      } else {
        toast.error(
          `prima di diventare amici piú stretti ${username} ti deve seguire`,
          { className: "toast-message" },
        );
        return false;
      }
    }
  };

  useEffect(() => {
    const fetchImg = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${username}/picture`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      setImg(res.url);
    };

    const fetchSmm = async () => {
      const res = await sendRequest(
        new Request(`${uri}smm/manager/${username}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      setSsm(json?.smm?.username);
    };
    const fetchInfo = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${username}/info/?view=full`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );

      const json = await res.json();
      setRole(json.role);
      if (
        sessionStorage.getItem("refreshToken") !== NoLogin &&
        sessionStorage.getItem("refreshToken") !== null &&
        role === "vip"
      ) {
        await fetchSmm();
      }
      setBio(json.bio);
      setEmail(json.email);
    };

    const fetchYouAreCloseFriends = async () => {
      const res = await sendRequest(
        new Request(`${uri}notification/${username}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );

      const json = await res.json();
      setIsCloseFriend(json.response);
    };
    const fetchHaveBlocked = async () => {
       const res = await sendRequest(
        new Request(`${uri}user/hasblocked/${username}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      setIsSilenced(json.response);
    };

    fetchImg();
    fetchInfo();
    if (
      sessionStorage.getItem("refreshToken") !== NoLogin &&
      sessionStorage.getItem("refreshToken") !== null
    ) {
      fetchIsFollowing(props.ownUsername, username);
      fetchYouAreCloseFriends();
      fetchHaveBlocked();
    }
  }, []);

  useEffect(() => {
    const fetchFollowers = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${username}/followers/?page=${followerPage}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );

      const json = await res.json();
      setFollowers(json.response);
    };
    fetchFollowers();
  }, [followerPage]);

  useEffect(() => {
    const fetchFollowed = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${username}/followed/?page=${followingPage}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      setFollowing(json.response);
    };
    fetchFollowed();
  }, [followingPage]);

  const fetchFollowUser = async () => {
    const res = await sendRequest(
      new Request(`${uri}user/follow/${username}`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (res.ok) {
      setYouAreFollowingHim(true);
      setFollowers((prevArray) => {
        return [...prevArray, props.ownUsername];
      });
    } else {
      toast.error(json.error, { className: "toast-message" });
    }
  };

  const fetchUnFollowUser = async () => {
    const res = await sendRequest(
      new Request(`${uri}user/follow/${username}`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (res.ok) {
      setYouAreFollowingHim(false);
      setFollowers((prevArray) =>
        prevArray.filter((el) => el !== props.ownUsername),
      );
    } else {
      toast.error(json.error, { className: "toast-message" });
    }
  };

  const fetchBlockUser = async () => {
    await sendRequest(
      new Request(`${uri}user/block/${username}`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );

    setIsSilenced(true); 
    setYouAreFollowingHim(false);
    setIsCloseFriend(false);

  };

  const fetchUnBlockUser = async () => {
    await sendRequest(
      new Request(`${uri}user/block/${username}`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );

    setIsSilenced(false);
  };

  const fetchAddToCloseFriends = async () => {
    const result = await fetchIsFollowing(username, props.ownUsername); //controllo se lui ti segue

    if (!result) return;

    const res = await sendRequest(
      new Request(`${uri}notification/${username}/`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ msg: "voglio diventare tuo amico" }),
      }),
    );
    if (res.ok)
      toast.success("richiesta inviata", { className: "toast-message" });
    else {
      const json = await res.json();
      toast.error(json.error, { className: "toast-message" });
    }
  };

  const fetchRemoveToCloseFriends = async () => {
    await sendRequest(
      new Request(`${uri}notification/${username}/`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    setIsCloseFriend(false);
  };

  const [modalZoom, setModalZoom] = useState(false);

  const { width } = useWindowDimensions();
  const [fontSize, setFontSize] = useState("16px");

  useLayoutEffect(() => {
    if (width < 440) {
      setFontSize("14px");
    } else if (width > 440 && width < 540) {
      setFontSize("18px");
    } else {
      setFontSize("20px");
    }
  }, [width]);

  const [showMSilenced, setShowMSilenced] = useState(false);
  const [showOCFollowing, setShowOCFollowing] = useState(false);
  const [showMCf, setShowMCF] = useState(false);

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      amico piú stretto
    </Tooltip>
  );

  function isDeletable(username_sender) {
    return props.ownUsername === username_sender;
  }

  return (
    <div>
      {/*modal se si vuole zoomare un'immagine */}
      <Modal centered show={modalZoom} dialogClassName="my-modal" size="lg">
        <Card>
          <Image src={img} alt={`immagine profilo di ${username}`} fluid />
          <Card.ImgOverlay
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <CloseButton
              style={{ cursor: "pointer", backgroundColor: "white" }}
              color="black"
              onClick={() => {
                setModalZoom(false);
              }}
              role="button"
              size={icon_size / 2}
            />
          </Card.ImgOverlay>
        </Card>
      </Modal>
      {/*
                modal per decidere se silenziare una persona
            */}
      <Modal centered show={showMSilenced}>
        <Modal.Title style={{ display: "flex", justifyContent: "flex-end" }}>
          <CloseButton onClick={() => setShowMSilenced(false)} />
        </Modal.Title>
        <Modal.Body>
          {!isSilenced ? (
            <div>
              <p>
                <strong>{`Sei sicuro di voler bloccare ${username}?`}</strong>
              </p>
              <p>
                {`non potrai piú vedere i messaggi che ${username} ti invierá o che ti ha giá inviato`}{" "}
              </p>
            </div>
          ) : (
            <div>
              <p>
                <strong>{`Sei sicuro di voler sbloccare ${username}?`}</strong>
              </p>
              <p>
                {`da ora in poi sarai in grado di vedere i messaggi che ${username} ti invierá o che ti ha giá inviato`}{" "}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowMSilenced(false)}
          >
            No
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={async () => {
              if (isSilenced) await fetchUnBlockUser();
              else await fetchBlockUser();
              setShowMSilenced(false);
            }}
          >
            si
          </Button>
        </Modal.Footer>
      </Modal>

      {/*
                modal per gestire gli amici piu stretti
            */}
      <Modal centered show={showMCf}>
        <Modal.Title style={{ display: "flex", justifyContent: "flex-end" }}>
          <CloseButton onClick={() => setShowMCF(false)} />
        </Modal.Title>
        <Modal.Body>
          {!isCloseFriend ? (
            <div>
              <p>
                <strong>{`Sei sicuro di voler inviare la richiesta di diventare amici piú stretti?`}</strong>
              </p>
              <p>
                {`nella bacheca dei messaggi vedrai prima quelli inviati dai tuoi amici piú stretti`}{" "}
              </p>
            </div>
          ) : (
            <div>
              <p>
                <strong>{`Sei sicuro di voler togliere ${username} dagli amici piú stretti?`}</strong>
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowMCF(false)}
          >
            No
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={async () => {
              if (isCloseFriend) {
                setShowMCF(false);
                await fetchRemoveToCloseFriends();
              } else {
                await fetchAddToCloseFriends();
                setShowMCF(false);
              }
            }}
          >
            si
          </Button>
        </Modal.Footer>
      </Modal>

      {/*
                off canvas per la gestione dei following e amici piu stretti
            */}
      <Offcanvas
        show={showOCFollowing}
        onHide={() => setShowOCFollowing(false)}
        placement="bottom"
        scroll={true}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>{username}</Offcanvas.Title>
          <CaretUp size={icon_size / 2} style={{ marginTop: "-40px" }} />
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Row style={{ marginTop: "10px" }}>
            <Button
              variant="dark"
              style={{ display: "flex", justifyContent: "space-between" }}
              onClick={() => {
                setShowMCF(true);
              }}
            >
              <span>
                <strong>
                  {isCloseFriend
                    ? "rimuovi dagli amici piú stretti"
                    : "aggiungi agli amici piú stretti"}
                </strong>
              </span>
              <StarFill size={icon_size / 3} />
            </Button>
          </Row>
          <Row style={{ marginTop: "10px" }}>
            <Button
              variant="dark"
              onClick={async () => {
                await fetchUnFollowUser();
              }}
            >
              <span
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <strong>non seguire piú</strong>
              </span>
            </Button>
          </Row>
          <Row style={{ marginTop: "10px" }}>
            {!isSilenced ? (
              <Button variant="dark" onClick={() => setShowMSilenced(true)}>
                <span
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                  }}
                >
                  <strong>blocca</strong>
                </span>
              </Button>
            ) : (
              <Button variant="dark" onClick={() => setShowMSilenced(true)}>
                <span style={{ display: "flex", justifyContent: "flex-start" }}>
                  <strong>sblocca</strong>
                </span>
              </Button>
            )}
          </Row>
        </Offcanvas.Body>
      </Offcanvas>

      <div>
        <div
          className="bg-body-tertiary"
          style={{ height: "210px", fontSize: `${fontSize}` }}
        >
          <Row>
            <Col
              xs={10}
              sm={10}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <p style={{ fontSize: `calc(${fontSize} + 7px)` }}>
                <strong>{username}</strong>
              </p>
              <div style={{ marginLeft: "0.5vw", marginTop: "0.7vh" }}>
                <TooltipVip role={role} />
              </div>
            </Col>
            {sessionStorage.getItem("refreshToken") !== NoLogin &&
              sessionStorage.getItem("refreshToken") !== null && (
                <Col
                  xs={2}
                  sm={2}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "5px",
                  }}
                >
                  {isSilenced ? (
                    <EyeSlash
                      size={icon_size / 2.5}
                      style={{ cursor: "pointer" }}
                      role="button"
                      onClick={() => setShowMSilenced(true)}
                    />
                  ) : (
                    <Eye
                      size={icon_size / 2.5}
                      style={{ cursor: "pointer" }}
                      role="button"
                      onClick={() => setShowMSilenced(true)}
                    />
                  )}
                </Col>
              )}
          </Row>
          <Row style={{ marginTop: "2.3vh", marginLeft: "1vw" }}>
            <Col>
              {isCloseFriend && (
                <div style={{ position: "absolute", top: "5px", left: "10px" }}>
                  <OverlayTrigger
                    placement="bottom"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderTooltip}
                  >
                    <StarFill
                      style={{ cursor: "pointer" }}
                      role="tooltip"
                      color="white"
                      size={icon_size / 2}
                    />
                  </OverlayTrigger>
                </div>
              )}
              <Image
                src={img}
                onClick={() => {
                  setModalZoom(true);
                }}
                roundedCircle
                style={{
                  cursor: "pointer",
                  width: "100px",
                  height: "100px",
                  marginTop: "-40px",
                }}
                alt={`immagine profilo di ${username}`}
                fluid
              />
            </Col>
            <Col>
              <DropdownFollowing
                fontSize={fontSize}
                page={followingPage}
                setPage={setFollowingPage}
                isExternProfile={true}
                following={following}
              />
            </Col>
            <Col style={{ marginRight: "5px", fontSize: `${fontSize}` }}>
              <DropdownFollowing
                fontSize={fontSize}
                page={followerPage}
                setPage={setFollowerPage}
                isExternProfile={true}
                is_followers={true}
                following={followers}
              />
            </Col>
          </Row>
          <Row>
            <Col
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-evenly",
              }}
            >
              {youAreFollowingHim ? (
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowOCFollowing(true)}
                >
                  lo stai seguendo <ChevronDown size={icon_size / 4} />
                </Button>
              ) : sessionStorage.getItem("refreshToken") !== NoLogin &&
                sessionStorage.getItem("refreshToken") !== null ? (
                <Button
                  variant="primary"
                  onClick={async () => {
                    await fetchFollowUser();
                  }}
                >
                  segui
                </Button>
              ) : (
                <></>
              )}
              {sessionStorage.getItem("refreshToken") !== NoLogin &&
                sessionStorage.getItem("refreshToken") !== null && (
                  <Nav.Link as={Link} to={`/conversazione/${username}`}>
                    <Button>messaggia</Button>
                  </Nav.Link>
                )}
            </Col>
          </Row>
        </div>
        <div style={{ overflowY: "auto" }}>
          <Container fluid>
            <Row style={{ marginTop: "10px" }}>
              <Col>
                <Person size={icon_size / 3} /> {username}
              </Col>
            </Row>
            <Row>
              <Col>
                <Book size={icon_size / 3} /> <strong>{bio}</strong>
              </Col>
            </Row>
            <Row>
              <Col>
                <Envelope size={icon_size / 3} /> <strong>{email}</strong>
              </Col>
            </Row>
            {role === "vip" && (
              <Row>
                <Col>
                  <PersonWorkspace size={icon_size / 3} />{" "}
                  <strong>{ssm}</strong> é il mio social media manager
                </Col>
              </Row>
            )}
          </Container>
          <hr />
          <div style={{ marginLeft: "5vw", marginRight: "5vw" }}>
            <FloatingLabel
              style={{
                marginLeft: `${width > 900 ? "100px" : "1px"}`,
                marginRight: `${width > 900 ? "100px" : "1px"}`,
              }}
              controlId="floatingSelect1"
              label="Ordina post"
            >
              <Form.Select
                id="floatingSelect1"
                onChange={(e) => {
                  handleSelect(e);
                }}
                aria-label="Floating label select example"
              >
                <option>dal piú nuovo</option>
                <option value="dal piú vecchio">dal piú vecchio</option>
                <option value="popolari">popolari</option>
                <option value="impopolari">impopolari</option>
                <option value="controversi">controversi</option>
              </Form.Select>
            </FloatingLabel>
          </div>
          {posts.map((element) => {
            return (
              <Post
                _id={element._id}
                location={element.location}
                deletePost={undefined}
                index={undefined}
                is_profile={true}
                key={Math.random()}
                url_img_channel={element.url_img_channel}
                username_channel={element.username_channel}
                username_sender={element.username_sender}
                url_img_sender={element.url_img_sender}
                time={element.time}
                isDeletable={isDeletable}
                ownUsername={props.ownUsername}
                reactions={element.reactions}
                userReaction={element.userReaction}
                is_public={element.is_public}
                type_msg={element.type_msg}
                attachment={element.attachment}
                msg={element.msg}
                popularity={element.popularity}
                views={element.views}
                references={element.references}
              />
            );
          })}
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
                disabled={pagePosts <= 1}
                variant="primary"
                onClick={async () => {
                  setPosts([]);
                  setIsLoading(true);
                  await new Promise((resolve) => setTimeout(resolve, 400));
                  setPagePosts((prevValue) => {
                    return prevValue - 1;
                  });
                  setGetPosts(!getPosts);
                }}
              >
                pagina precedente
              </Button>
              <Button
                size="sm"
                style={{ fontSize: `${fontSize}` }}
                disabled={posts.length === 0}
                variant="primary"
                onClick={async () => {
                  setPosts([]);
                  setIsLoading(true);
                  await new Promise((resolve) => setTimeout(resolve, 400));
                  setPagePosts((prevValue) => {
                    return prevValue + 1;
                  });
                  setGetPosts(!getPosts);
                }}
              >
                pagina successiva
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ExternProfile;
