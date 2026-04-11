"use client";

import setupLocatorUI from "@locator/runtime";
import { useEffect } from "react";

/** LocatorJS: 개발 중 Alt/Option + 클릭으로 컴포넌트 소스로 이동 (@locator/runtime) */
export function LocatorJs() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setupLocatorUI();
    }
  }, []);
  return null;
}
