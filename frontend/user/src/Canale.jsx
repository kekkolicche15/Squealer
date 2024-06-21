import { useEffect, useState, useLayoutEffect } from "react";
import {
  Col,
  Row,
  Button,
  Image,
  Modal,
  CloseButton,
  Tooltip,
  OverlayTrigger,
  Form,
  Dropdown,
  Container,
  Card,
  Spinner,
  FloatingLabel,
} from "react-bootstrap";
import {
  Bell,
  Collection,
  HeptagonFill,
  Pencil,
  Shuffle,
  Camera2,
  Book,
  CircleFill,
  CheckSquare,
  XSquare,
} from "react-bootstrap-icons";
import {
  icon_size,
  fetchImgPreview,
  sendRequest,
  uri,
  fetchAttachment,
  dataURLtoBlob,
  createFileFromBlob,
  fetchDeletePost,
  NoLogin,
  officialChannels,
} from "./Const.js";
import useWindowDimensions from "./useWindowDimensions.jsx";
import DropdownFollowing from "./DropdownFollowing.jsx";
import TooltipGlobe from "./componentsHome/TooltipGlobe.jsx";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImages } from "@fortawesome/free-solid-svg-icons";
import ImageVideo from "./componentsHome/ImageVideo.jsx";
import Camera from "react-html5-camera-photo";
import Post from "./componentsHome/Post.jsx";
import { useParams } from "react-router-dom";

function Canale(props) {
  const { username_default } = useParams();

  const [username, setUsername] = useState(() => {
    if (username_default.includes("%23"))
      return username_default.replace("%23", "#");
    else return username_default;
  });

  const [youAreSubscribed, setYouAreSubscribed] = useState(false);
  const [isPublic, setIsPublic] = useState(null);
  const [myRole, setMyRole] = useState(""); //owner, moderator, member
  const [img, setImg] = useState("");
  const [bio, setBio] = useState("");
  const [popularity, setPopularity] = useState("");
  const [query, setQuery] = useState(null);

  const [showModalEditChannel, setShowModalEditChannel] = useState(false);

  const [members, setMembers] = useState([]);

  const [modalZoom, setModalZoom] = useState(false);

  const { height, width } = useWindowDimensions();
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

  async function handleSubscribe() {
    if (isPublic) {
      setYouAreSubscribed(true);
      setMembers((prevArray) => {
        return [...prevArray, { name: props.ownUsername, role: myRole }];
      });
    } else {
      //canale privato devi inviare la richiesta e lui deve accettarla
      toast.success("richiesta inviata", { className: "toast-message" });
    }
    const res = await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/join/`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (json.error === "Sei stato bannato da questo canale");
    toast.error(json.error, { className: "toast-message" });
  }

  const [posts, setPosts] = useState([]);

  const [bannedList, setBannedList] = useState([]);

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      {myRole === "owner" ? "sei il proprietario" : "sei un moderatore"}
    </Tooltip>
  );

  //gestione della camera
  const [showCamera, setShowCamera] = useState(false);
  const [selectedResource, setSelectedResource] = useState("");
  const [showModalCamera, setShowModalCamera] = useState(false);

  const [imageServer, setImageServer] = useState(null);

  function handleTakePhoto(dataUri) {
    var myblob = dataURLtoBlob(dataUri);
    var myfile = createFileFromBlob(myblob);
    setImageServer(myfile);
    setSelectedResource(dataUri);
    setShowCamera(false);
  }

  useEffect(() => {
    props.setShowFooter(true);
  }, []);

  const [notifications, setNotifications] = useState([]);

  const fetchDeleteNotification = async (user) => {
    await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/waiting/${user}`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  };

  const fetchAcceptNotification = async (user, index) => {
    await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/waiting/${user}`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );

    setNotifications(notifications.filter((el, i) => i !== index));
  };

  function deleteNotification(index) {
    fetchDeleteNotification(notifications[index].username);
    setNotifications(notifications.filter((el, i) => i !== index));
  }

  useEffect(() => {
    const fetchImg = async () => {
      const res = await sendRequest(
        new Request(`${uri}channel/${encodeURIComponent(username)}/picture`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      setImg(res.url);
    };

    fetchImg();
  }, []);

  const [page, setPage] = useState(1);
  const [membersPage, setMembersPage] = useState(1);
  const [getPosts, setGetPosts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState(null);

  function handleSelect(e) {
    if (e.target.value === "dal piú vecchio") setSort("oldest");
    else if (e.target.value === "popolari") setSort("popularity");
    else if (e.target.value === "impopolari") setSort("unpopularity");
    else if (e.target.value === "controversi") setSort("controversiality");
    else setSort(null);
  }

  

  useEffect(() => {
    if(query === null) return;

    fetchPosts();
  }, [getPosts]);

  

  async function deletePost(index, id) {
    setPosts(posts.filter((el, i) => i !== index));

    await fetchDeletePost(id);
    setGetPosts(!getPosts);

  }

  function getSort() {

    //serve per i canali SQUEAL POPOLARI ...
    if (sort && (username !== officialChannels[0] && username !== officialChannels[1] && username !== officialChannels[2])){
        return `&sort=${sort}`;
    }
    else return "";
  }

  useEffect(() => {
    const fetchMembers = async () => {
      const res = await sendRequest(
        new Request(`${uri}channel/${encodeURIComponent(username)}/members/?page=${membersPage}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      const result = json.map((el) => {
        return { name: el.username, role: el.role };
      });

      setMembers([...result]);
    };
    if (username[0] !== "#") fetchMembers();
  }, [membersPage]);

  const fetchPosts = async () => {
    const res = await sendRequest(
      new Request(
        `${uri}post/${query}${query==="" ? "?" : "&"}page=${page}${getSort()}`,
        {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        },
      ),
    );
    const json = await res.json();
    if (json.page){
        const promises = json.page.map(async (el) => {
          const img = await fetchImgPreview("user", el.author);
          var attachment = "";
          if (el.contentType !== "text")
            attachment = await fetchAttachment(el._id, "post");
          return {
            url_img_sender: img,
            username_sender: el.author,
            username_channel: el.channel,
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
    }
    setIsLoading(false);
  };

  //serve a fare in modo che il useEffect non venga attivato onMount
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    if (isMounted) setIsMounted(false);
    else {
      setPage(1);
      setGetPosts(!getPosts);
    }
  }, [sort]);

  useEffect(() => {
    const fetchNotification = async () => {
      const res = await sendRequest(
        new Request(`${uri}channel/${encodeURIComponent(username)}/waiting/`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      const promises = json.map(async (el) => {
        const img = await fetchImgPreview("user", el.user.username);
        return { img: img, username: el.user.username };
      });

      Promise.all(promises).then((results) => {
        setNotifications(results);
      });
    };

    async function getBannedList() {
      const res = await sendRequest(
        new Request(`${uri}channel/${encodeURIComponent(username)}/banned`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();
      if (json.banlist) {
        setBannedList(
          json.banlist.map((el) => {
            return el.username;
          }),
        );
      } else setBannedList([]);
    }

    const fetchChannelInfo = async () => {
      
      const res = await sendRequest(
        new Request(`${uri}channel/${encodeURIComponent(username)}/?view=full`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      
      const json = await res.json();
      setQuery(json.query || "")
      if (json.privacy !== "public") {
        setIsPublic(false);
      } else setIsPublic(true);

      setBio(json.description);
      setPopularity(json.popularity);
      if (
        sessionStorage.getItem("refreshToken") === NoLogin ||
        sessionStorage.getItem("refreshToken") === null || username[0] === "#" || popularity === "Non applicabile"
      ) {
        setYouAreSubscribed(false);
        return;
      }
      const res1 = await sendRequest(
        new Request(`${uri}channel/${encodeURIComponent(username)}/members/${props.ownUsername}`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json1 = await res1.json();
      if (json1.response) {
        setYouAreSubscribed(true);
        if (json.privacy === "public") {
          if (json.owner === props.ownUsername) setMyRole("owner");
          else setMyRole("");
        } else {
          setMyRole(json1.response);
        }
        if (
          json1.response !== "" &&
          json1.response !== "member" &&
          json.privacy !== "public"
        ) {
          await fetchNotification();
        }
      }
    };
    fetchChannelInfo();
    if (sessionStorage.getItem("refreshToken") !== NoLogin) getBannedList();
  }, []);

  useEffect(() => {
    setGetPosts(!getPosts);
    setIsLoading(false);
  },[query])

  async function promoteModerator(user) {
    await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/moderators/${user}`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  }

  //modifica immagine profilo
  useEffect(() => {
    const EditPic = async () => {
      const formData = new FormData();
      formData.append("image", imageServer);
      setImageServer(undefined);
      await sendRequest(
        new Request(`${uri}channel/${encodeURIComponent(username)}/picture`, {
          method: "PATCH",
          body: formData,
        }),
      );
    };

    if (imageServer && !showModalCamera) {
      EditPic();
    }
  }, [imageServer, showModalCamera]);

  const EditInfo = async (username1, bio, visibility) => {
    var body = {};
    if (username1) body.name = username1;
    if (bio) body.bio = bio;
    if (visibility === "public" || visibility === "private")
      body.visibility = visibility;
    if (bio) body.bio = bio;
    await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  };

  function handleForm(event) {
    event.preventDefault();
    setShowModalEditChannel(false);
    var username = event.target[0].value;
    if (username[0] === "#") {
      toast.error("nome non valido", { className: "toast-message" });
      return;
    }
    var bio = event.target[1].value;
    var visibility = event.target[2].value;

    if (username) {
      setUsername(username);
    }
    if (bio) {
      setBio(bio);
    }
    if (visibility === "public") setIsPublic(true);
    else if (visibility === "private") setIsPublic(false);

    EditInfo(username, bio, visibility);
  }

  async function handleUnsubscribe() {
    if (myRole === "owner") {
      toast.error("sei il proprietario, non puoi abbandonare il canale", {
        className: "toast-message",
      });
      return;
    }
    const res = await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/leave/`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    if (res.ok) {
      setYouAreSubscribed(false);
      setMembers((prevArray) =>
        prevArray.filter((el) => el.name !== props.ownUsername),
      );
    } else {
      const json = await res.json();
      toast.error(json.error, { className: "toast-message" });
    }
  }

  async function banUser(user) {
    await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/ban/${user}`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  }

  async function sbanUser(user) {
    await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/ban/${user}`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  }

  async function removeUser(user) {
    await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/members/${user}`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  }

  async function removeModerator(user) {
    await sendRequest(
      new Request(`${uri}channel/${encodeURIComponent(username)}/moderators/${user}`, {
        method: "DELETE",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
  }

  function isDeletable(username_sender) {
    if (myRole === "owner") return true;
    else if (myRole === "moderator") {
      members.forEach((name, role) => {
        if (name === username_sender) {
          if (role === "member") return true;
          else return false;
        }
      });
      return true;
    } else if (username_sender === props.ownUsername) {
      return true;
    } else return false;
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
              style={{
                cursor: "pointer",
                marginRight: "-10px",
                backgroundColor: "white",
              }}
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

      {/*modal per cambiare immagine profilo*/}
      <Modal centered show={showModalCamera} size="lg">
        <Modal.Title>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: `calc(${fontSize} + 6px)`,
                marginTop: "0.5vh",
                marginLeft: "3vw",
              }}
            >
              <strong>Cambia immagine profilo canale</strong>
            </span>
            <CloseButton
              style={{ marginRight: "0.5vw", marginTop: "0.8vh" }}
              onClick={() => {
                setImageServer("");
                setShowModalCamera(false);
                setShowCamera(false);
                setSelectedResource("");
              }}
            />
          </div>
        </Modal.Title>
        <hr />
        <Modal.Body>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {selectedResource.length > 0 && (
              <Image
                src={selectedResource}
                style={{ maxWidth: "50vw", maxHeight: "40vh" }}
                roundedCircle
                fluid
                alt={username}
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
          <hr />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "5vh",
            }}
          >
            <Button
              disabled={!imageServer}
              variant="primary"
              onClick={() => {
                setShowModalCamera(false);
                setImg(selectedResource);
                setSelectedResource("");
                setShowCamera(false);
              }}
            >
              salva modifiche
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/*modal per editare il canale*/}
      <Modal centered show={showModalEditChannel} size="lg">
        <Modal.Title>
          <Row>
            <Col
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginLeft: "1%",
              }}
            >
              <span
                style={{
                  fontSize: `calc(${fontSize} + 6px)`,
                  marginTop: "0.5vh",
                }}
              >
                <strong>Modifica il canale</strong>
              </span>
            </Col>
            <Col style={{ display: "flex", justifyContent: "flex-end" }}>
              <CloseButton
                style={{ marginRight: "0.5vw", marginTop: "0.8vh" }}
                onClick={() => {
                  setShowModalEditChannel(false);
                }}
              />
            </Col>
          </Row>
        </Modal.Title>
        <hr />
        <Modal.Body>
          <Form onSubmit={handleForm}>
            <div>
              <FloatingLabel
                controlId="floatingInput1"
                label="cambia nome"
                className="mb-3"
              >
                <Form.Control type="text" placeholder="cambia nome" />
              </FloatingLabel>
              <FloatingLabel
                controlId="floatingInput4"
                label="cambia descrizione"
                className="mb-3"
              >
                <Form.Control type="text" placeholder="cambia descrizione" />
              </FloatingLabel>
              <FloatingLabel
                controlId="floatingSelect"
                label="cambia visibilitá"
              >
                <Form.Select aria-label="Floating label select example">
                  <option>cambia visibilitá</option>
                  <option value="public">pubblico</option>
                  <option value="private">privato</option>
                </Form.Select>
              </FloatingLabel>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "5vh",
              }}
            >
              <Button type="submit" variant="primary">
                Salva modifiche
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

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
          </Col>
          <Col xs={2} sm={2}>
            {myRole !== "member" &&
              myRole !== "" &&
              sessionStorage.getItem("refreshToken") !== NoLogin &&
              sessionStorage.getItem("refreshToken") !== null && (
                <div>
                  <OverlayTrigger
                    placement="bottom"
                    delay={{ show: 250, hide: 400 }}
                    overlay={renderTooltip}
                  >
                    <HeptagonFill
                      style={{ cursor: "pointer" }}
                      role="tooltip"
                      color={myRole === "owner" ? "gold" : "green"}
                      size={icon_size / 2}
                    />
                  </OverlayTrigger>
                </div>
              )}
          </Col>
        </Row>
        <Row style={{ marginTop: "30px", marginLeft: "20px" }}>
          <Col>
            <Image
              src={img}
              onClick={() => {
                setModalZoom(true);
              }}
              roundedCircle
              style={{
                cursor: "pointer",
                width: `${isPublic && width < 450 ? "60px" : "100px"}`,
                height: `${isPublic && width < 450 ? "60px" : "100px"}`,
                marginTop: "-30px",
                marginLeft: "-30px",
              }}
              alt={`immagine profilo di ${username}`}
            />

            {myRole !== "member" && myRole !== "" && !isPublic && (
              <Dropdown style={{ marginLeft: "20px" }}>
                <Dropdown.Toggle
                  as="div"
                  role="button"
                  style={{
                    marginRight: "10vw",
                    marginLeft: "1vw",
                    cursor: "pointer",
                  }}
                >
                  <Shuffle size={icon_size / 3.3} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item
                    as="div"
                    role="button"
                    onClick={() => {
                      setShowCamera(true), setShowModalCamera(true);
                    }}
                  >
                    <Camera2 size={icon_size / 3} />
                    <span> scatta una foto</span>
                  </Dropdown.Item>
                  <Dropdown.Item
                    as="div"
                    role="button"
                    onClick={() => setShowModalCamera(true)}
                  >
                    <FontAwesomeIcon
                      icon={faImages}
                      style={{ color: "white" }}
                    />
                    <ImageVideo
                      setImageServer={setImageServer}
                      selectedResource={selectedResource}
                      setSelectedResource={setSelectedResource}
                      setPlaceholderNewMessage={undefined}
                      type_msg="image/*"
                      name_type_msg=" carica una foto"
                      setIsVideo={undefined}
                    />
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Col>

          <Col>
            {username[0] !== "#" && popularity !== "Non applicabile" && popularity !== "" && (
              <DropdownFollowing
                removeModerator={removeModerator}
                promoteModerator={promoteModerator}
                removeUser={removeUser}
                banUser={banUser}
                page={membersPage}
                setPage={setMembersPage}
                ownUsername={props.ownUsername}
                setBannedList={setBannedList}
                setMembers={setMembers}
                myRole={myRole}
                isExternProfile={true}
                isChannel={true}
                following={members}
              />
            )}
          </Col>
          {sessionStorage.getItem("refreshToken") !== NoLogin &&
            sessionStorage.getItem("refreshToken") !== null && (
              <Col style={{ marginRight: "5px", fontSize: `${fontSize}` }}>
                {username[0] !== "#" && popularity !== "Non applicabile" && popularity !== "" && (
                  <>
                    {youAreSubscribed ? (
                      <Button
                        variant="outline-secondary"
                        onClick={async () => {
                          await handleUnsubscribe();
                        }}
                      >
                        disiscriviti
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={async () => {
                          await handleSubscribe();
                        }}
                      >
                        iscriviti
                      </Button>
                    )}
                  </>
                )}
              </Col>
            )}
            {username[0] !== "#" && 
                <Col style={{ marginTop: "5px" }}>{(isPublic && popularity !== "Non applicabile") ? <TooltipGlobe /> : popularity === "Non applicabile" ? <TooltipGlobe visibility={"official"}/> : isPublic !== null ? <TooltipGlobe visibility={"private"}/> : <></>}</Col>
            }
          </Row>
        {myRole !== "" &&
          myRole !== "member" &&
          !isPublic &&
          username[0] !== "#" && (
            <Row>
              <Col style={{ marginLeft: "1vw", marginTop: "-18px" }}>
                <Dropdown drop="down">
                  <Dropdown.Toggle
                    as="div"
                    role="button"
                    style={{
                      cursor: "pointer",
                      maxWidth: `${icon_size / 2}px`,
                    }}
                  >
                    <Bell size={icon_size / 2.5} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu
                    style={{
                      position: "relative",
                      minHeight: "100px",
                      minWidth: "200px",
                      overflowY: "auto",
                      maxHeight: `calc(100vh - 5vh - 190px - 20vh)`,
                    }}
                  >
                    {notifications.map((el, index) => {
                      return (
                        <Dropdown.Item key={Math.random()} as="div">
                          <Card style={{ fontSize: fontSize }}>
                            <Card.Body>
                              <Row>
                                <Col>
                                  <Image
                                    src={el.img}
                                    alt={`immagine profilo di ${el.username}`}
                                    style={{ height: "50px", width: "50px" }}
                                    roundedCircle
                                    fluid
                                  />
                                  <span>
                                    <strong
                                      style={{ marginLeft: "1vw" }}
                                    >{` ${el.username}`}</strong>
                                  </span>
                                </Col>
                              </Row>
                              <Row style={{ marginTop: "2vh" }}>
                                <Col>
                                  <span>posso entrare nel canale?</span>
                                </Col>
                                <Col
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    marginLeft: "1vw",
                                  }}
                                >
                                  <CheckSquare
                                    id={`check${index}`}
                                    onMouseOver={() => {
                                      document.getElementById(
                                        `check${index}`,
                                      ).style.color = "green";
                                      document.getElementById(
                                        `check${index}`,
                                      ).style.boxShadow =
                                        "0px 0px 15px 2px green";
                                    }}
                                    onMouseOut={() => {
                                      document.getElementById(
                                        `check${index}`,
                                      ).style.color = "white";
                                      document.getElementById(
                                        `check${index}`,
                                      ).style.boxShadow = "none";
                                    }}
                                    style={{
                                      cursor: "pointer",
                                      color: "white",
                                    }}
                                    role="button"
                                    size={icon_size / 2}
                                    onClick={async () => {
                                      setMembers((prevArray) => {
                                        return [
                                          ...prevArray,
                                          {
                                            name: notifications[index].username,
                                            role: "member",
                                          },
                                        ];
                                      });
                                      await fetchAcceptNotification(
                                        el.username,
                                        index,
                                      );
                                    }}
                                  />
                                  <XSquare
                                    id={`X${index}`}
                                    onMouseOver={() => {
                                      document.getElementById(
                                        `X${index}`,
                                      ).style.color = "red";
                                      document.getElementById(
                                        `X${index}`,
                                      ).style.boxShadow =
                                        "0px 0px 15px 2px red";
                                    }}
                                    onMouseOut={() => {
                                      document.getElementById(
                                        `X${index}`,
                                      ).style.color = "white";
                                      document.getElementById(
                                        `X${index}`,
                                      ).style.boxShadow = "none";
                                    }}
                                    style={{
                                      marginLeft: "2vw",
                                      cursor: "pointer",
                                      color: "white",
                                    }}
                                    role="button"
                                    size={icon_size / 2}
                                    onClick={async () =>
                                      await deleteNotification(index)
                                    }
                                  />
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </Dropdown.Item>
                      );
                    })}
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
          )}
      </div>
      <div style={{ overflowY: "auto" }}>
        <Container fluid>
          <Row style={{ marginTop: "10px" }}>
            <Col>
              <Collection size={icon_size / 3} /> <span>{username} </span>
            </Col>
          </Row>
          <Row>
            <Col xs={8} sm={8}>
              <Book size={icon_size / 3} /> <strong>{bio}</strong>
            </Col>
          </Row>
          {myRole !== "" && myRole !== "member" && popularity !== "Non applicabile" && (
            <Row>
              <Col>
                <DropdownFollowing
                  sbanUser={sbanUser}
                  bannedList={true}
                  setBannedList={setBannedList}
                  myRole={myRole}
                  isExternProfile={true}
                  following={bannedList}
                />
              </Col>
              {myRole === "owner" && (
                <Col
                  style={{
                    marginTop: "2vh",
                    marginRight: "3vw",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    variant="secondary"
                    onClick={() => setShowModalEditChannel(true)}
                  >
                    <Pencil /> modifica informazioni canale
                  </Button>
                </Col>
              )}
            </Row>
          )}
          <Row>
            <Col>
              {popularity !== "normal" || popularity !== "Non applicabile" && username[0] !== "#" && popularity !== "normal" && (
                <div>
                  <CircleFill
                    color={
                      popularity === "popolare"
                        ? "blue"
                        : popularity === "impopolare"
                          ? "red"
                          : "yellow"
                    }
                  />
                  <span> canale {popularity}</span>
                </div>
              )}
            </Col>
          </Row>
          <hr />
        </Container>
        {username !== officialChannels[0] && username !== officialChannels[1] && username !== officialChannels[2] &&
        <div
          style={{ marginLeft: "5vw", marginRight: "5vw", marginTop: "20px" }}
        >
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
        }
        {(isPublic || username[0] === "#" || youAreSubscribed) && (
          <>
            {posts.map((element, index) => {
              return (
                <Post
                  _id={element._id}
                  location={element.location}
                  isChannel={true}
                  deletePost={deletePost}
                  index={index}
                  is_profile={false}
                  key={Math.random()}
                  url_img_channel={img}
                  username_channel={element.username_channel}
                  username_sender={element.username_sender}
                  url_img_sender={element.url_img_sender}
                  time={element.time}
                  reactions={element.reactions}
                  userReaction={element.userReaction}
                  is_public={element.is_public}
                  type_msg={element.type_msg}
                  attachment={element.attachment}
                  msg={element.msg}
                  popularity={element.popularity}
                  views={element.views}
                  isDeletable={isDeletable}
                  ownUsername={props.ownUsername}
                  references={element.references}
                />
              );
            })}
          </>
        )}
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
              disabled={page <= 1}
              variant="primary"
              onClick={async () => {
                setPosts([]);
                setIsLoading(true);
                await new Promise((resolve) => setTimeout(resolve, 400));
                setPage((prevValue) => {
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
                setPage((prevValue) => {
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
  );
}

export default Canale;
