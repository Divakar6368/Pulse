import React from 'react'
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Login with Pulse CLI.",
};

const AuthLayout = ({children}:{children:React.ReactNode}) => {
  return (
    <div className='flex flex-col h-screen items-center justify-center'>
      {children}
    </div>
  )
}

export default AuthLayout
