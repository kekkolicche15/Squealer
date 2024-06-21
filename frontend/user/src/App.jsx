import { useState, useEffect, useRef } from "react";

import AlertQuota from "./componentsHome/AlertQuota.jsx";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import NoRoute from "./NoRoute.jsx";
import { baseUrl, icon_size, sendRequest, uri, NoLogin } from "./Const";
import Start from "./Start.jsx";
import Login from "./Login.jsx";
import { AnimatePresence } from "framer-motion";
import loadable from "@loadable/component";

//caricamento Lazy
const Home = loadable(() => import("./Home.jsx"));
const Profile = loadable(() => import("./Profile.jsx"));
const MyFooter = loadable(() => import("./MyFooter.jsx"));
const Chats = loadable(() => import("./Chats.jsx"));
const Search = loadable(() => import("./Search.jsx"));
const Verified = loadable(() => import("./Verified.jsx"));
const Recover = loadable(() => import("./Recover.jsx"));
const Signup = loadable(() => import("./Signup.jsx"));
const ExternProfile = loadable(() => import("./ExternProfile.jsx"));
const Canale = loadable(() => import("./Canale.jsx"));
const OneChat = loadable(() => import("./OneChat.jsx"));

function App() {
  const [data, setData] = useState({ username: "" });

  useEffect(()=>{
    if(sessionStorage.getItem("username")===null) return

    setData({username: `${sessionStorage.getItem("username")}`})
  },[data.username])

  var location = useLocation();
  const navigator = useNavigate();

  const [showFooter, setShowFooter] = useState(false);

  const [regex, setRegex] = useState([]);
  useEffect(() => {
    const fetchRegex = async () => {
      const res = await fetch(new Request(`${uri}general/patterns`));
      const json = await res.json();

      const regexKey = Object.keys(json);
      const regexValue = Object.values(json);
      const regexObj = regexKey.reduce((obj, key, index) => {
        obj[key] = new RegExp(regexValue[index]);
        return obj;
      }, {});
      setRegex(regexObj);
    };
    fetchRegex();
  }, []);

  const [youAreInChats, setYouAreInChats] = useState(false);

  useEffect(() => {
    if (location.pathname === "/") {
      if (
        sessionStorage.getItem("refreshToken") === NoLogin ||
        sessionStorage.getItem("refreshToken") === null
      )
        //non hai effettuato il login
        navigator("/login", { relative: "path" });
      else navigator("/home", { relative: "path" });
    }
  }, [location.pathname]);

  //vedo se l'user o channel esiste
  useEffect(() => {
    const fetchUsername = async (parts) => {
      if (parts[2] === undefined || location.pathname === "/login") return;
      if (parts[1] === "conversazione") parts[1] = "user";

      var url;
      if (parts[1] === "channel") {
        if (parts[2][0] === "#") parts[2] = parts[2].replace("%23", "#");
        url = `${uri}${parts[1]}/${parts[2]}/?view=full`;
      } else if (parts[1] === "user")
        url = `${uri}${parts[1]}/${parts[2]}/info/?view=full`;

      const res = await sendRequest(
        new Request(url, {
          method: "GET",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
        }),
      );
      const json = await res.json();

      if (
        parts[1] === "user" ||
        (parts[1] === "channel" && parts[2] !== data.username)
      ) {
        if (
          json.error === "Utente non trovato" ||
          json.error === "Canale non trovato" ||
          json.error === "Route non trovata"
        ) {
          navigator(json.error.replaceAll(" ", "_") + Math.random().toString());
        }
      }
    };

    const parts = location.pathname.split("/");
    fetchUsername(parts);
  }, [location.pathname]);

  const navbarHome = useRef(null);
  const navbarProfile = useRef(null);
  const navbarSearch = useRef(null);

  //serve a gestire il refresh di exterProfile e channel e la navbar search
  const [fixNavbarSearch, setFixNavbarSearch] = useState(false);

  //gestire accesso senza login e varie navbar
  useEffect(() => {
    const parts = location.pathname.split("/");
    if (
      ((parts[1] === "user" && !parts[2]) ||
        parts[1] === "conversazioni" ||
        parts[1] === "conversazione") &&
      (sessionStorage.getItem("refreshToken") === NoLogin ||
        sessionStorage.getItem("refreshToken") === null)
    ) {
      navigator("../non_hai_effettuato_il_login" + Math.random().toString(), {
        relative: "path",
      });
    }
    //questo serve a fare in modo che se dalla search bar clicci sul tuo profilo, si aggiorna la navbar
    if (parts[1] === "user" && parts[2] === data.username) {
      navbarProfile.current?.click();
    }
    //questo serve se vai nel profilo di uno e fai messaggia e poi torni indietro, per aggiornare la navbar
    else if (parts[1] === "search") {
      navbarSearch.current?.click();
    }
    //sistemo la navbar se c'e' il refresh
    else if (
      (parts[1] === "user" && parts[2] !== data.username) ||
      parts[1] === "channel"
    ) {
      if (!fixNavbarSearch) setFixNavbarSearch(true);
    }
  }, [location.pathname, navbarSearch.current, navbarProfile.current]);

  //per animazione della home
  const [slideAnimation, setSlideAnimation] = useState(false);

  const [footerHeight, setFooterHeight] = useState(0);

  return (
    <>
      <AlertQuota />
      <AnimatePresence>
        <Routes location={location} key={location.pathname}>
          <Route element={<Start />}>
            <Route
              path={`${baseUrl}signin`}
              element={<Signup regex={regex} />}
            />
            <Route
              path={`${baseUrl}login`}
              element={<Login regex={regex} data={data} setData={setData} />}
            />
            <Route
              path={`${baseUrl}recover`}
              element={<Recover regex={regex} />}
            ></Route>
          </Route>
          <Route
            path={`${baseUrl}home`}
            element={
              <Home
                footerHeight={footerHeight}
                setSlideAnimation={setSlideAnimation}
                slideAnimation={slideAnimation}
                setShowFooter={setShowFooter}
                username={data.username}
              />
            }
          />
          <Route
            path={`${baseUrl}user/${data.username}`}
            element={
              <Profile
                footerHeight={footerHeight}
                setShowFooter={setShowFooter}
                data={data}
                setData={setData}
              />
            }
          />
          <Route
            path={`${baseUrl}conversazioni`}
            element={
              <Chats
                setSlideAnimation={setSlideAnimation}
                setYouAreInChats={setYouAreInChats}
                setShowFooter={setShowFooter}
                username={data.username}
              />
            }
          />
          <Route
            path={`${baseUrl}search`}
            element={
              <Search
                footerHeight={footerHeight}
                setShowFooter={setShowFooter}
              />
            }
          />
          <Route
            path={`${baseUrl}user/:username`}
            element={
              <ExternProfile
                footerHeight={footerHeight}
                setYouAreInChats={setYouAreInChats}
                ownUsername={data.username}
                setShowFooter={setShowFooter}
              />
            }
          />
          <Route
            path={`${baseUrl}channel/:username_default`}
            element={
              <Canale
                footerHeight={footerHeight}
                setShowFooter={setShowFooter}
                ownUsername={data.username}
              />
            }
          />
          <Route
            path={`${baseUrl}recover`}
            element={<Recover regex={regex} />}
          />
          <Route path={`${baseUrl}verified`} element={<Verified />} />
          
          <Route
            path={`${baseUrl}conversazione/:usernameDest`}
            element={
              <OneChat
                setShowFooter={setShowFooter}
                youAreInChats={youAreInChats}
                username={data.username}
              />
            }
          />
          <Route path="*" element={<NoRoute setShowFooter={setShowFooter} />} />
        </Routes>
      </AnimatePresence>
      {showFooter && (
        <div style={{ height: { icon_size } }}>
          <MyFooter
            setFooterHeight={setFooterHeight}
            fixNavbarSearch={fixNavbarSearch}
            setFixNavbarSearch={setFixNavbarSearch}
            navbarHome={navbarHome}
            navbarSearch={navbarSearch}
            navbarProfile={navbarProfile}
            username={data.username}
          />
        </div>
      )}
    </>
  );
}

export default App;
