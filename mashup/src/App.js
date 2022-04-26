import React, { useState, useRef, useEffect } from "react";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Map from "./pages/Map";
import TopProducts from "./pages/TopProducts";
import QlikObject from "./components/qlikObject";

function App() {
  const [qlikGlobal, setQlikGlobal] = useState(null);
  const [App, setApp] = useState(null);
  const env = useRef(null);

  const connectToQlik = async () => {
    if (!App) {
      fetch("./environment.json")
        .then((response) => {
          return response.json();
        })
        .then((e) => {
          let urlParts = window.location.href.split("/");
          let qlikProtocol = urlParts[0].replace(":", "");
          let qlikHost = urlParts[2];
          let qlikPort = qlikProtocol === "https" ? 443 : 80;
          let qlikVirtualProxy =
            urlParts["3"] !== "extensions" ? `/${urlParts[3]}` : "";
          if (qlikVirtualProxy === "/#") {
            qlikVirtualProxy = "";
          }
          console.log(e);
          // default to the config settings if they exist
          qlikProtocol = e.qlikProtocol || qlikProtocol;
          qlikHost = e.qlikHost || qlikHost;
          qlikPort = e.qlikPort || qlikPort;
          if (typeof e.qlikVirtualProxy !== "undefined") {
            qlikVirtualProxy = e.qlikVirtualProxy;
          }
          const baseUrl = `${qlikProtocol}://${qlikHost}:${qlikPort}${qlikVirtualProxy}`;
          const qlikCSS = document.createElement("link");
          qlikCSS.rel = "stylesheet";
          qlikCSS.href = `${baseUrl}/resources/autogenerated/qlik-styles.css`;
          document.head.prepend(qlikCSS);
          const requireScript = document.createElement("script");
          requireScript.src = `${baseUrl}/resources/assets/external/requirejs/require.js`;
          requireScript.onload = () => {
            let config = {
              host: qlikHost,
              prefix: qlikVirtualProxy === "" ? "/" : qlikVirtualProxy,
              port: qlikPort,
              isSecure: qlikProtocol === "https" ? true : false,
              App: e.App,
              baseUrl,
            };
            console.log("config", config);
            env.current = config;
            window.require.config({
              baseUrl: `${config.baseUrl}/resources`,
              waitSeconds: 200,
            });
            window.require(["js/qlik"], (qlik) => {
              console.log("qlik test", qlik);
              const app = qlik.openApp(config.App, config);
              app.model.waitForOpen.promise.then(() => {
                // app.model.enigmaModel.getAppProperties().then(appProps => {
                //   console.log('appProps', appProps);
                // })
                setApp(app);
                console.log(app);
                setQlikGlobal(qlik);
              });
            });
          };
          requireScript.async = true;
          document.body.appendChild(requireScript);
        });
    }
  };

  useEffect(() => {
    if (!qlikGlobal) {
      connectToQlik();
    }
  }, []);

  if (qlikGlobal && App) {
    return (
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route exact path="/" element={<Home qlikapp={App} />} />
            <Route exact path="/top-products" element={<TopProducts />} />
            <Route exact path="/map" element={<Map />} />
          </Routes>
        </BrowserRouter>

        <QlikObject
          objectId="sKEpw"
          elementId="sKEpw"
          style={{ height: "300px" }}
          qlikApp={App}
        ></QlikObject>
      </div>
    );
  } else {
    return <div>loading</div>;
  }
}

export default App;
