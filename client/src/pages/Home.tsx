import Navbar from "@/components/Navbar";
import WelcomeCard from "@/components/WelcomeCard";
import Fireworks from "@/components/Fireworks";

export default function Home() {
  return (
    <>
      <Fireworks />
      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4 sm:p-6">
          <WelcomeCard />
        </main>
      </div>
    </>
  );
}
