import Link from "next/link";
import React from "react";
import { useState } from "react";

const Category = ({ arrays }: any) => {
 const [tab, setTab] = useState(1);

 const handleChangeTab = (e: any) => {
  setTab(e.currentTarget.getAttribute("id"));
 };
 return <div></div>;
};

export default Category;
