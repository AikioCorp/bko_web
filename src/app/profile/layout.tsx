import React from "react";
import { AuthReady } from "@/components/AuthReady";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthReady>{children}</AuthReady>;
}
