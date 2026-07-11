import MorphingText from "@/components/landingpage/morphing-text";
import Image from "next/image";
import bgPattern from "@/public/images/landingpage/brownBgPattern2.jpg"
import dashboardPlaceholder from "@/public/images/landingpage/dashboard.png"
import { Button } from "@/components/ui/button";
import TopRibon from "@/components/landingpage/topRibon";

import mediumLogo from "@/public/images/logos/mediumLogo.jpeg"
import devtoLogo from "@/public/images/logos/devto.webp"
import hashnodeLogo from "@/public/images/logos/hashnodeLogo.webp"
import opencodeLogo from "@/public/images/logos/opencode.svg"
import chatgptLogo from "@/public/images/logos/chatgpt.svg"
import codexLogo from "@/public/images/logos/codex.svg"
import copilotLogo from "@/public/images/logos/githubcopilot.svg"
import grokLogo from "@/public/images/logos/grokLogo.png"

import HeroIntegrationBox from "@/components/landingpage/heroIntegrationBox";
import { ApiShowcase } from "@/components/apiShowcase";
import { ChevronRight, CodeXmlIcon, Waypoints, ZapIcon } from "lucide-react";


import chatgptMobileImg from "@/public/images/landingpage/chatgpt_mobile.jpeg"
import vscodeMcpImg from "@/public/images/landingpage/vscode_mcp.png"

export default function Home() {

  const mediumApp = { logo: mediumLogo, name: "Medium" }
  const devtoApp = { logo: devtoLogo, name: "Dev.to" }
  const hashnodeApp = { logo: hashnodeLogo, name: "Hashnode" }
  const opencodeApp = { logo: opencodeLogo, name: "OpenCode" }
  const chatgptApp = { logo: chatgptLogo, name: "ChatGPT" }
  const codexApp = { logo: codexLogo, name: "Codex" }
  const copilotApp = { logo: copilotLogo, name: "Copilot" }
  const grokApp = { logo: grokLogo, name: "Grok" }


  const featuresSections = [
    {
      icon: CodeXmlIcon, title: "Automated SEO", heading: "Ready For The World", description: "lorem300 ipsum dolor sit amet consectetur adipisicing elit. Labore, doloremque. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repellendus quo optio fuga labore, ipsam saepe ipsum modi sit consequuntur rerum."
    },
    {
      icon: ZapIcon, title: "Fast Worldwide", heading: "Cached Near Users", description: "lorem300 ipsum dolor sit amet consectetur adipisicing elit. Labore, doloremque. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repellendus quo optio fuga labore, ipsam saepe ipsum modi sit consequuntur rerum."
    },
    {
      icon: Waypoints, title: "Distribute Content", heading: "Write Once Distribute Everywhere", description: "lorem300 ipsum dolor sit amet consectetur adipisicing elit. Labore, doloremque. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repellendus quo optio fuga labore, ipsam saepe ipsum modi sit consequuntur rerum."
    },
  ]

  return (
    <div className="pt-30 pb-20">
      <div className="fixed top-0 left-0 w-full z-10">
        <TopRibon />
      </div>

      <div className="md:px-5">
        <div className="site-max mx-auto w-full">
          <div className="px-5 md:px-0">
            <h1 className="text-xl md:text-xl font-[400] ">
              <span>Most powerful</span><br />
              <span className="text-2xl md:text-3xl ">Content Management <span className="hidden md:inline">System</span></span><br />
              <span >for your</span>
              <MorphingText className="ml-2" texts={["websites",
                "projects",
                "business",
                "blogs",
                "docs"]} /></h1>
            <div className="flex flex-col md:flex-row md:w-fit w-full gap-2 my-10 md:my-12">
              <Button className="w-full md:w-40" size="lg">Get started</Button>
              <Button className="w-full md:w-40" variant="secondary" size="lg">Use Cases</Button>
            </div>
          </div>
          <div className="pl-0 md:pl-0">
            <div className="relative  md:rounded-md w-full h-hit overflow-hidden pt-10 pl-10 md:pt-15 md:px-15">
              <Image src={bgPattern.src} className="w-full h-full absolute z-[-1] top-0 left-0 w-full h-full object-cover" alt="" width={500} height={500} priority />
              <Image src={dashboardPlaceholder.src} className="md:m-0 h-[40vh] md:h-[70vh] min-w-[500px] md:w-full object-cover object-top rounded-tl-sm md:rounded-t-sm" alt="" width={1000} height={1000} priority unoptimized />
            </div>
          </div>
        </div>




        <div className="px-5">
          <div className="site-max mx-auto w-full flex flex-col mt-10 md:mt-15">
            <div className="flex h-24">
              <HeroIntegrationBox items={[mediumApp, devtoApp, hashnodeApp, opencodeApp, chatgptApp, codexApp, copilotApp, grokApp]} />
              <HeroIntegrationBox items={[devtoApp, hashnodeApp, opencodeApp, chatgptApp, codexApp, copilotApp, grokApp, mediumApp]} reverse />
              <HeroIntegrationBox items={[hashnodeApp, opencodeApp, chatgptApp, codexApp, copilotApp, grokApp, mediumApp, devtoApp]} />
              <HeroIntegrationBox items={[opencodeApp, chatgptApp, codexApp, copilotApp, grokApp, mediumApp, devtoApp, hashnodeApp]} reverse />
            </div>
            <div className="flex items-center justify-center text-center h-24">
              <h2 className="text-lg">Integrates with your daily platforms and agents.</h2>
            </div>
            <div className="flex h-24">
              <HeroIntegrationBox items={[chatgptApp, codexApp, copilotApp, grokApp, mediumApp, devtoApp, hashnodeApp, opencodeApp]} reverse />
              <HeroIntegrationBox items={[codexApp, copilotApp, grokApp, mediumApp, devtoApp, hashnodeApp, opencodeApp, chatgptApp]} />
              <HeroIntegrationBox items={[copilotApp, grokApp, mediumApp, devtoApp, hashnodeApp, opencodeApp, chatgptApp, codexApp]} reverse />
              <HeroIntegrationBox items={[grokApp, mediumApp, devtoApp, hashnodeApp, opencodeApp, chatgptApp, codexApp, copilotApp]} />
            </div>
          </div>
        </div>

        <div className="px-5">
          <div className="site-max mx-auto w-full mt-10 md:mt-15 flex flex-col md:flex-row gap-5">
            <div className="relative md:flex-1 h-65 md:h-140">
              <Image src="/images/elec1.jpg" alt="" height={600} width={600} className="object-cover w-full h-full object-center" unoptimized />
              <div className="bg-background text-sm font-semibold px-3 py-2 absolute bottom-5 left-5 md:w-fit right-5 md:left-[unset] md:bottom-[unset] md:top-5">
                Document your projects
              </div>
            </div>
            <div className="relative md:flex-1 h-65 md:h-140">
              <Image src="/images/dude1.jpg" alt="" height={600} width={600} className="object-cover w-full h-full object-center" unoptimized />
              <div className="bg-background text-sm font-semibold px-3 py-2 absolute bottom-5 left-5 md:w-fit right-5 md:right-[unset]">
                Perfect for your blogs
              </div>
            </div>
          </div>
        </div>



        <div className="px-5">
          <div className="site-max mx-auto w-full space-y-6 mt-15 md:mt-30">
            <div>
              <span className="text-sm text-muted-foreground">Hierarchy</span>
              <h2 className="text-xl md:text-2xl">Organize Your Content</h2>
              <p className="mt-2 text-base">Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore, doloremque. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repellendus quo optio fuga labore, ipsam saepe ipsum modi sit consequuntur rerum.</p>
            </div>
            <div className="relative rounded-md overflow-hidden">
              <Image src={bgPattern.src} className="w-full h-full absolute z-[-1] top-0 left-0 w-full h-full object-cover" alt="" width={500} height={500} priority />

              <div className="p-5 pr-10 md:p-15 md:pr-30">
                <Image src={dashboardPlaceholder.src} className="h-fit w-full object-contain rounded-sm invert" alt="" width={1000} height={1000} priority unoptimized />
              </div>

              <div className="p-5 pl-15 md:p-15 md:pl-45 pt-15 md:pt-45 pb-0 md:pb-0 absolute top-0 left-0 w-full h-full z-[2]">
                <Image src={dashboardPlaceholder.src} className="h-full w-full object-cover object-top rounded-t-sm " alt="" width={1000} height={1000} priority unoptimized />
              </div>
              <div className="p-10 md:px-30 pt-25 md:pt-75 pr-15 md:pr-45 pb-0 absolute top-0 left-0 w-full h-full z-[3]">
                <Image src={dashboardPlaceholder.src} className="h-full w-full object-cover object-top rounded-t-sm invert" alt="" width={1000} height={1000} priority unoptimized />
              </div>
            </div>
          </div>
        </div>






        <div className="px-5">
          <div className="site-max mx-auto w-full mt-15 md:mt-30 md:gap-12 w-full relative overflow-hidden grid md:grid-cols-2 grid-cols-1">
            <div className="md:flex-1 flex flex-col h-full">
              <h2 className="text-xl md:text-2xl">
                Whitepapper MCP
              </h2>
              <p className="mt-2 text-base">
                Connect whitepapper to agents and automate content
                writing for your projects
              </p>

              <div className="mt-5 relative overflow-hidden w-full h-[260px] md:h-full">
                <div className="bg-gradient-to-b h-[120px] w-full absolute top-[-2px] left-0 from-background from-10% to-transparent to-100% z-3">
                </div>
                <div className="border-[3px] border-[#fafafa]/30 border-t-0 rounded-b-[70px] md:rounded-b-[80px] overflow-hidden px-[10px] pb-[30px] bg-[#050505] h-full">
                  <div className="relative rounded-b-[45px] overflow-hidden h-full"                  >
                    <Image
                      src={chatgptMobileImg}
                      className="h-full absolute w-full bottom-0 left-0 right-0 object-bottom object-cover"
                      loading="lazy"
                      alt=""
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:flex-1 overflow-hidden relative rounded-md hidden md:flex">
              <Image
                src={bgPattern}
                className="absolute z-[-1] top-0 left-0 h-full w-full"
                loading="lazy"
                alt=""
              />
              <Image
                src={vscodeMcpImg}
                className="translate-y-5 -translate-x-5 md:translate-y-15 md:-translate-x-15 rounded-sm"
                loading="lazy"
                alt=""
              />
              <div className="bg-background text-sm font-semibold px-3 py-2 absolute bottom-5 left-5 w-fit z-[2]">
                VS code Copilot
              </div>
            </div>
          </div>
        </div>










        <div className="px-5">
          <div className="site-max mx-auto w-full mt-15 md:mt-30 grid md:grid-cols-2 grid-cols-1 gap-6 md:gap-10">
            <div className="h-full flex flex-col justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Dev API</span>
                <h2 className="text-2xl">Power your websites</h2>
                <p className="mt-2 text-base">Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore, doloremque. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repellendus quo optio fuga labore, ipsam saepe ipsum modi sit consequuntur rerum.</p>
              </div>
              <div className="md:flex justify-end w-full hidden">
                <Button variant="secondary">API Docs <ChevronRight /></Button>
              </div>
            </div>

            <div>
              <ApiShowcase minimal />
              <div className="md:hidden flex justify-end w-full mt-5">
                <Button variant="secondary">API Docs <ChevronRight /></Button>
              </div>
            </div>
          </div>
        </div>











      </div>
    </div >
  );
}
