import NuovoMessaggio from "./componentsHome/NuovoMessaggio.jsx";
import {
  baseUrl,
  getLogoSquealer,
  getScrittaSquealer,
  uri,
  sendRequest,
  fetchImgPreview,
  fetchAttachment,
  fetchDeletePost,
  NoLogin,
} from "./Const.js";
import Post from "./componentsHome/Post.jsx";
import { BiChat } from "react-icons/bi";
import {
  Image,
  Col,
  Container,
  Navbar,
  Nav,
  Spinner,
  Button,
  FloatingLabel,
  Form,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import useWindowDimensions from "./useWindowDimensions.jsx";
import { useState, useLayoutEffect, useEffect } from "react";
import { motion } from "framer-motion";

function Home(props) {
  //roba per layout
  const navbar_size = 15;

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

  useEffect(() => {
    props.setShowFooter(true);
  }, []);

  const [posts, setPosts] = useState([]);
  const [refreshPage, setRefreshPage] = useState(false);
  const [sort, setSort] = useState(null);
  const [isMounted, setIsMounted] = useState(true);


  async function deletePost(index, id) {
    
    setPosts(posts.filter((el, i) => i !== index));
    await fetchDeletePost(id);
    setRefreshPage((prevValue) => {
        return !prevValue;
      });

  }


  

  function handleSelect(e) {
    if (e.target.value === "dal piú vecchio") setSort("oldest");
    else if (e.target.value === "popolari") setSort("popularity");
    else if (e.target.value === "impopolari") setSort("unpopularity");
    else if (e.target.value === "controversi") setSort("controversiality");
    else setSort(null);
  }

  function getSort() {
    if (sort) return `&sort=${sort}`;
    else return "";
  }

  useEffect(() => {
    if (isMounted) setIsMounted(false);
    else {
      setPagePosts(1);
      setRefreshPage(!refreshPage);
    }
  }, [sort]);

  const [url_profile_img, setUrl_profile_img] = useState("");

  useEffect(() => {
    const fetchImgPreview = async () => {
      const res = await sendRequest(
        new Request(`${uri}user/${props.username}/picture/preview`, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      setUrl_profile_img(res.url);
    };
    if (
      sessionStorage.getItem("refreshToken") !== NoLogin &&
      sessionStorage.getItem("refreshToken") !== null
    )
      fetchImgPreview();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      props.setSlideAnimation(false);
    }, 1000);
  }, [props.slideAnimation]);

  function isDeletable(username_sender) {
    return props.username === username_sender;
  }

  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [pagePosts, setPagePosts] = useState(1);

  const fetchPosts = async () => {
    const res = await sendRequest(
      new Request(`${uri}post/?Nologin=${sessionStorage.getItem("refreshToken") === NoLogin || sessionStorage.getItem("refreshToken") === null }&page=${pagePosts}${getSort()}`, {
        method: "GET",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
      }),
    );
    const json = await res.json();
    if (json.page) {
        const promises = json.page.map(async (el) => {
          const url_img_channel = await fetchImgPreview("channel", el.channel);
          const url_img_sender = await fetchImgPreview("user", el.author);
          var attachment = "";
          if (el.contentType !== "text")
            attachment = await fetchAttachment(el._id, "post");

          return {
            url_img_channel: url_img_channel,
            url_img_sender: url_img_sender,
            username_sender: el.author,
            username_channel: el.channel,
            type_msg: el.contentType,
            _id: el._id,
            msg: el.content || "",
            attachment: attachment || "",
            popularity: el.popularity,
            location: el.location || "",
            time: el.date + " " + el.time,
            reactions: el.reactions,
            userReaction: el.userReaction,
            views: el.views,
            references: el.references,
          };
        });

        Promise.all(promises).then((results) => {
          setPosts([...results]);
        });
    }
    setIsLoadingPosts(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [refreshPage]);

  return (
    <motion.div
      style={{ fontSize: `${fontSize}` }}
      initial={props.slideAnimation ? { width: 0 } : {}}
      animate={props.slideAnimation ? { width: "100vw" } : {}}
      transition={{ duration: 0.7 }}
    >
      <Navbar
        style={{ height: `${navbar_size}vh` }}
        className="bg-body-tertiary"
      >
        <Container fluid style={{ margin: "0 auto" }}>
          <Col style={{ width: "33vw" }}>
            <Navbar.Brand as="div" style={{ marginLeft: "1vw" }}>
              <Image
                src={getLogoSquealer}
                alt="logo squealer"
                fluid
                style={{ width: "100px", height: "12vh" }}
              />
            </Navbar.Brand>
          </Col>
          <Col
            style={{
              width: "33vw",
              display: "flex",
              justifyContent: `${
                sessionStorage.getItem("refreshToken") !== NoLogin &&
                sessionStorage.getItem("refreshToken") !== null
                  ? "center"
                  : "flex-start"
              }`,
            }}
          >
            <Image
              src={getScrittaSquealer}
              alt="scritta squealer"
              style={{ height: "12vh" }}
              fluid
            />
          </Col>
          
              <Col style={{ width: "33vw" }}>
                <Navbar.Brand
                  as="div"
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginRight: "1vw",
                  }}
                >
                {sessionStorage.getItem("refreshToken") !== NoLogin &&
                sessionStorage.getItem("refreshToken") !== null ? 
                  <Nav.Link
                    as={Link}
                    eventKey={1}
                    to={`${baseUrl}conversazioni`}
                    onClick={() => {
                      props.setShowFooter(false);
                    }}
                    className="chat-icon"
                  >
                
                    <BiChat size={"10vh"} />
                  </Nav.Link>
                :
                <Nav.Link
                    as={Link}
                    eventKey={1}
                    to={`${baseUrl}login`}
                    
                  >
                    <Button variant="outline-primary" size="lg" style={{fontSize: `${fontSize}`}} onClick={() => {
                        props.setShowFooter(false);
                      }}>Login</Button>
                </Nav.Link>
                }
                </Navbar.Brand>
              </Col>
            
        </Container>
      </Navbar>

      <div
        style={{
          overflowY:
            "auto",
        }}
      >
        {sessionStorage.getItem("refreshToken") !== NoLogin &&
          sessionStorage.getItem("refreshToken") !== null && (
            <div
              style={{ paddingTop: "15px", paddingBottom: "15px" }}
              className="bg-body-secondary"
            >
              <NuovoMessaggio
                setRefreshPage={setRefreshPage}
                fontSize={fontSize}
                username={props.username}
                url_profile_img={url_profile_img}
              />
            </div>
          )}
        <div
          style={{
            marginLeft: "5vw",
            marginRight: "5vw",
            marginTop: "15px",
            marginBottom: "15px",
          }}
        >
          <FloatingLabel
            style={{
              marginLeft: `${width > 900 ? "100px" : "1px"}`,
              marginRight: `${width > 900 ? "100px" : "1px"}`,
              marginTop: "40px",
              fontSize: "17px",
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
        {posts.map((element, index) => (
          <Post
            _id={element._id}
            location={element.location}
            deletePost={deletePost}
            index={index}
            fontSize={fontSize}
            url_profile_img={url_profile_img}
            is_profile={false}
            key={index}
            url_img_channel={element.url_img_channel}
            username_channel={element.username_channel}
            username_sender={element.username_sender}
            url_img_sender={element.url_img_sender}
            time={element.time}
            isDeletable={isDeletable}
            ownUsername={props.username}
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
        ))}

        {isLoadingPosts ? (
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
                setIsLoadingPosts(true);
                await new Promise((resolve) => setTimeout(resolve, 400));
                setPagePosts((prevValue) => {
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
              disabled={posts.length === 0}
              variant="primary"
              onClick={async () => {
                setPosts([]);
                setIsLoadingPosts(true);
                await new Promise((resolve) => setTimeout(resolve, 400));
                setPagePosts((prevValue) => {
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
    </motion.div>
  );
}
export default Home;
