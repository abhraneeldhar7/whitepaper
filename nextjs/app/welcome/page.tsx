// import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle, TriangleAlert, UserRoundIcon } from "lucide-react";
import BrownBgPattern from "../../public/images/landingpage/brownBgPattern2.jpg";
import appLogo from "../../public/images/appLogo.png";
import Image from "next/image";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function WelcomePage() {
  return (
    <div className="px-4 py-10 max-w-[600px] w-full flex flex-col mx-auto h-screen">
      <AuthenticateWithRedirectCallback
        signInUrl="/login"
        signUpUrl="/login"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />

      <div className="relative w-full aspect-2/1 px-5 py-20">
        <h1 className="text-[white] font-[450] text-[30px]">
          <span className="text-[32px]">Welcome to </span>
          <br />
          <span className="text-[48px]">Whitepapper</span>
        </h1>
        <Image
          height={400} width={400}
          alt=""
          className="rounded-[8px] w-full h-full object-cover absolute top-0 left-0 z-[-1]"
          src={BrownBgPattern}
        />
        <Image
          src={appLogo}
          height="30"
          width="30"
          alt=""
          className="absolute z-[2] top-3 right-3"
        />
        <LoaderCircle
          size={24}
          className="absolute z-[2] bottom-3 right-3 text-[white] animate-spin"
        />
      </div>

      <div className="mt-5 md:mt-4 flex flex-col h-full space-y-4 md:space-y-3 text-[18px]">
        <div className="flex gap-2 items-center">
          <Skeleton className="flex-3" />
          <Skeleton className="flex-2" />
        </div>
        <div className="flex gap-2 items-center">
          <p className="animate-pulse">Please wait</p>
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="flex-2 h-full" />
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton className="flex-5 h-full" />
          <p className="animate-pulse delay-[0.2s]">while</p>
          <Skeleton className="flex-1 h-full" />
          <p className="animate-pulse delay-[0.4s]">we</p>
          <Skeleton className="flex-4 h-full" />
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton className="flex-2 h-full" />
          <p className="animate-pulse delay-[0.6s]">set up</p>
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="flex-4 h-full" />
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton className="flex-1 h-full" />
          <p className="animate-pulse delay-[0.8s]">your</p>
          <Skeleton className="flex-2 h-full" />
          <Skeleton className="flex-4 h-full" />
          <div className="overflow-hidden flex items-center justify-center p-2 bg-card border shadow-md rounded-[50%]">
            <UserRoundIcon size={16} />
          </div>
          <p className="animate-pulse delay-[1s]">account</p>
          <Skeleton className="flex-2 h-full" />
        </div>
        <div className="flex gap-2 items-center">
          <Skeleton className="flex-1 h-full" />
          <Skeleton className="flex-3 h-full" />
          <Skeleton className="flex-2 h-full" />
        </div>
      </div>

      <div className="h-full w-full text-center flex gap-2 items-center justify-center">
        <TriangleAlert size={15} />
        <p className="text-[16px]">Do not close this screen</p>
      </div>
    </div>
  );
}
