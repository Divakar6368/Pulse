"use client"

import React from 'react'
import Image from "next/image"
import { Button } from './ui/button'
import { Card, CardContent } from "./ui/card";
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from './ui/spinner';

const LoginForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  if(isLoading){
    <div className='flex flex-col justify-center items-center'>
      <Spinner/>
    </div>
  }

  return (
    <div className="flex flex-col gap-6 justify-center items-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Image src={"/login.svg"} alt="Login" height={450} width={450} />
        <h1 className="text-6xl font-extrabold text-yellow-400">Welcome Back! to Pulse Cli</h1>
        <p className="text-base font-medium text-zinc-400">Login to your account for allowing device flow</p>
      </div>

      <Card className="border-dashed border-2">
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant={"outline"}
                className="w-full h-full"
                type="button"
                onClick={() => authClient.signIn.social({
                  provider: "github",
                  callbackURL: "http://localhost:3000"
                })}

              >
                <Image src={"/github.svg"} alt="Github" height={16} width={16} className="size-4 dark:invert" />
                Continue With GitHub
              </Button>

            </div>

          </div>

        </CardContent>
      </Card>
    </div>

  )
}

export default LoginForm
