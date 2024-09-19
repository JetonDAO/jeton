import Image from "next/image";

export default function LandingPage() {
  return (
    <div
      className={`relative bg-[url("/images/pixel-wooden-pattern.png")] bg-repeat bg-center bg-[length:200px_200px] overflow-hidden sm:h-[100dvh] w-[100dvw] z-50 flex items-center justify-center flex-col min-h-screen`}
    >
      <header className="w-full bg-black/20">
        <nav className="flex justify-between items-center p-5  text-white">
          <Image
            width={80}
            height={80}
            className="w-14 aspect-square"
            src="/images/logo.png"
            alt="Logo"
          />
          <ul className="flex space-x-8">
            <li>
              <a href="#about" className="hover:text-gray-400">
                Docs
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-gray-400">
                User Manual
              </a>
            </li>
            <li>
              <a href="#contact" className="hover:text-gray-400">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="flex-grow justify-center text-center w-full  text-white items-center flex flex-col ">
        <h1 className="text-5xl font-bold mb-6 leading-relaxed">
          Jeton
          <br />
          Decentralized Poker Game
        </h1>
        <p className="text-xl mb-10 leading-9 max-w-5xl text-balance">
          Experience the thrill of a decentralized poker game, where fairness is guaranteed. Cards
          are shuffled securely by players, ensuring transparency and security in every hand.
        </p>
        <a href="/games" className="nes-btn is-primary text-white py-3 px-8 rounded-lg text-xl">
          Play Now
        </a>
      </main>

      <footer className="p-5 text-white w-full bg-black/30 py-8">
        <div className="flex flex-wrap justify-between mx-auto text-center items-center">
          <div className="mb-4">
            <a
              href="https://x.com/JetonDAO"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="nes-icon twitter is-large" />
            </a>

            <a
              href="https://youtube.com/jetonDAO"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="nes-icon youtube is-large" />
            </a>

            <a
              href="https://github.com/jetonDAO"
              className="mx-2 hover:text-gray-400 text-white"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="nes-icon github is-large" />
            </a>
          </div>
          <section className="flex items-start">
            <div className="nes-balloon from-right">
              <p className="text-black">© 2024 Jeton. All rights reserved.</p>
            </div>
          </section>
        </div>
      </footer>
    </div>
  );
}
