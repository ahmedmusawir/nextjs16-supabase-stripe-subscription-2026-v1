"use client";

import AuthTabs from "@/components/auth/AuthTabs";
import React, { Suspense } from "react";
import Spinner from "@/components/common/Spinner";

const AuthPage = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <AuthTabs />
    </Suspense>
  );
};

export default AuthPage;
