import React from 'react';
import {Outlet} from "react-router-dom";

import Header from "./Footer";
import Footer from './Header';

const Layout = () => {
  return (
    <>
        <Footer/>
            <Outlet/>
        <Header/>
    </>
  )
}

export default Layout