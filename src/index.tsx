import React from "react";
import ReactDOM from "react-dom";
import "@atlaskit/css-reset";
import AppProvider from "@atlaskit/app-provider";
import App from "./App";

ReactDOM.render(
<AppProvider children={<App />}>

</AppProvider>,
 document.getElementById("root")
);